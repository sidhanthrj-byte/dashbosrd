import { NextRequest } from 'next/server';
import { initDb, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Lead } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401 });

  await initDb();
  const lead = await queryOne<Lead>('SELECT * FROM leads WHERE id = ? AND user_id = ?', [id, session.userId]);
  if (!lead) return new Response('Not found', { status: 404 });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const followDate = lead.next_action_date || tomorrow.toISOString().split('T')[0];
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtStart = followDate.replace(/-/g, '') + 'T090000';
  const dtEnd = followDate.replace(/-/g, '') + 'T093000';
  const uid = `lead-${lead.id}-${Date.now()}@pongs-crm`;

  const summary = `📞 Follow up: ${lead.contact_name} — ${lead.company_name}`;
  const description = [
    `Contact: ${lead.contact_name} (${lead.contact_title})`,
    `Company: ${lead.company_name}`,
    lead.phone ? `Phone: ${lead.phone}` : '',
    lead.email ? `Email: ${lead.email}` : '',
    `Status: ${lead.status.replace(/_/g, ' ')}`,
    lead.notes ? `Notes: ${lead.notes}` : '',
    lead.next_action ? `Action: ${lead.next_action}` : '',
  ].filter(Boolean).join('\\n');

  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Pongs CRM//Stretch Ceiling//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`, `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Kolkata:${dtStart}`,
    `DTEND;TZID=Asia/Kolkata:${dtEnd}`,
    `SUMMARY:${summary}`, `DESCRIPTION:${description}`,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY',
    `DESCRIPTION:Follow up with ${lead.contact_name}`, 'END:VALARM',
    'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY',
    `DESCRIPTION:NOW: Call ${lead.contact_name} at ${lead.company_name}`, 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="followup-${lead.contact_name.replace(/\s+/g, '-')}.ics"`,
    },
  });
}
