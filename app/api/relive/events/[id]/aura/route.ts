import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, queryOne } from '@/lib/relive/db';
import type { Alert, Cue, EventRow, Guest, ScheduleItem, Vendor } from '@/lib/relive/types';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Aura — the ops copilot. Summarizes live state into a short briefing with
// prioritized suggestions. Uses Claude when a key is configured, otherwise
// falls back to deterministic heuristics so the feature always works.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDb();
  const event = await queryOne<EventRow>('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [guests, vendors, schedule, cues, alerts] = await Promise.all([
    query<Guest>('SELECT * FROM guests WHERE event_id = ?', [id]),
    query<Vendor>('SELECT * FROM vendors WHERE event_id = ?', [id]),
    query<ScheduleItem>('SELECT * FROM schedule WHERE event_id = ? ORDER BY start_time ASC', [id]),
    query<Cue>('SELECT * FROM cues WHERE event_id = ? ORDER BY sort ASC', [id]),
    query<Alert>('SELECT * FROM alerts WHERE event_id = ? ORDER BY id DESC LIMIT 25', [id]),
  ]);

  const checkedIn = guests.filter((g) => g.checked_in).length;
  const vipsPending = guests.filter((g) => g.vip && !g.checked_in).map((g) => g.name);
  const noPickup = guests.filter((g) => !g.driver_id).length;
  const dietCounts = guests.reduce<Record<string, number>>((acc, g) => {
    if (g.diet !== 'None') acc[g.diet] = (acc[g.diet] || 0) + 1;
    return acc;
  }, {});
  const vendorIssues = vendors.filter((v) => v.status === 'issue' || v.status === 'pending');
  const liveItem = schedule.find((s) => s.status === 'in_progress');
  const nextItem = schedule.find((s) => s.status === 'pending');
  const readyCues = cues.filter((c) => c.status === 'ready');
  const warnings = alerts.filter((a) => a.level !== 'info');

  const heuristics: string[] = [];
  if (vipsPending.length > 0) heuristics.push(`${vipsPending.length} VIPs not checked in yet (${vipsPending.slice(0, 3).join(', ')}${vipsPending.length > 3 ? '…' : ''}) — brief the hosts at the door.`);
  if (noPickup > 0) heuristics.push(`${noPickup} guests have no pickup assigned — use auto-assign on the Transport board.`);
  for (const v of vendorIssues) heuristics.push(`${v.name} (${v.role}) is still "${v.status}" — chase for confirmation.`);
  if (nextItem) heuristics.push(`Next up: ${nextItem.title} — give the owning team a 15-minute call.`);
  if (readyCues.length > 0) heuristics.push(`${readyCues.length} cue(s) armed and waiting: ${readyCues.map((c) => c.number).join(', ')}.`);
  if (Object.keys(dietCounts).length > 0) heuristics.push(`Dietary plates to stage: ${Object.entries(dietCounts).map(([k, v]) => `${v}× ${k}`).join(', ')}.`);

  if (!anthropic) {
    return NextResponse.json({
      briefing: `${event.title} — ${checkedIn}/${guests.length} guests in. ${liveItem ? `Live now: ${liveItem.title}.` : 'Nothing live at the moment.'} ${warnings.length > 0 ? `${warnings.length} open warning(s) on the board.` : 'No open warnings.'}`,
      tips: heuristics.slice(0, 6),
      source: 'heuristics',
    });
  }

  try {
    const context = {
      event: { title: event.title, type: event.type, venue: event.venue, dates: [event.start_date, event.end_date] },
      guests: { total: guests.length, checkedIn, vipsPending, unassignedPickups: noPickup, dietCounts },
      vendors: vendors.map((v) => ({ name: v.name, role: v.role, status: v.status })),
      runOfShow: schedule.map((s) => ({ title: s.title, start: s.start_time, status: s.status })),
      cues: cues.map((c) => ({ number: c.number, name: c.name, status: c.status })),
      recentAlerts: alerts.slice(0, 10).map((a) => `[${a.level}] ${a.message}`),
      now: new Date().toISOString(),
    };
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: `You are Aura, the live-operations copilot inside an event control room. Given the JSON state below, reply with ONLY valid JSON: {"briefing": "<2-3 sentence situational briefing for the event director>", "tips": ["<up to 6 short, concrete, prioritized action items>"]}.\n\n${JSON.stringify(context)}`,
      }],
    });
    const text = msg.content.find((b) => b.type === 'text')?.text ?? '';
    const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
    return NextResponse.json({ briefing: parsed.briefing, tips: parsed.tips ?? [], source: 'aura' });
  } catch {
    return NextResponse.json({
      briefing: `${event.title} — ${checkedIn}/${guests.length} guests in. ${liveItem ? `Live now: ${liveItem.title}.` : ''}`,
      tips: heuristics.slice(0, 6),
      source: 'heuristics',
    });
  }
}
