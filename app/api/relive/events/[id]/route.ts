import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, queryOne, run, logAlert } from '@/lib/relive/db';
import type { EventRow } from '@/lib/relive/types';

// Full control-room snapshot: the event plus every board in one request.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDb();
  const event = await queryOne<EventRow>('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [guests, drivers, vendors, schedule, cues, alerts] = await Promise.all([
    query('SELECT * FROM guests WHERE event_id = ? ORDER BY vip DESC, name ASC', [id]),
    query('SELECT * FROM drivers WHERE event_id = ? ORDER BY name ASC', [id]),
    query('SELECT * FROM vendors WHERE event_id = ? ORDER BY name ASC', [id]),
    query('SELECT * FROM schedule WHERE event_id = ? ORDER BY start_time ASC, sort ASC', [id]),
    query('SELECT * FROM cues WHERE event_id = ? ORDER BY sort ASC, id ASC', [id]),
    query('SELECT * FROM alerts WHERE event_id = ? ORDER BY id DESC LIMIT 150', [id]),
  ]);
  return NextResponse.json({ event, guests, drivers, vendors, schedule, cues, alerts });
}

const EVENT_FIELDS = ['title', 'tagline', 'type', 'start_date', 'end_date', 'venue', 'city', 'status', 'live', 'safety_on'];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDb();
  const event = await queryOne<EventRow>('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const f of EVENT_FIELDS) {
    if (f in body) {
      sets.push(`${f} = ?`);
      args.push(body[f]);
    }
  }
  if (sets.length > 0) {
    args.push(Number(id));
    await run(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`, args);
  }
  if (body._log?.message) {
    await logAlert(Number(id), body._log.level || 'info', String(body._log.message));
  }
  const updated = await queryOne('SELECT * FROM events WHERE id = ?', [id]);
  return NextResponse.json({ event: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDb();
  // Cascade manually — libsql file DBs may not have foreign_keys pragma on.
  for (const table of ['guests', 'drivers', 'vendors', 'schedule', 'cues', 'alerts']) {
    await run(`DELETE FROM ${table} WHERE event_id = ?`, [id]);
  }
  const r = await run('DELETE FROM events WHERE id = ?', [id]);
  if (r.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
