import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, queryOne, run, logAlert } from '@/lib/relive/db';
import type { EventSummary } from '@/lib/relive/types';

export async function GET() {
  await initDb();
  const events = await query<EventSummary>(`
    SELECT e.*,
      (SELECT COUNT(*) FROM guests g WHERE g.event_id = e.id) AS guest_count,
      (SELECT COUNT(*) FROM guests g WHERE g.event_id = e.id AND g.checked_in = 1) AS checked_in,
      (SELECT COUNT(*) FROM vendors v WHERE v.event_id = e.id) AS vendor_count,
      (SELECT COUNT(*) FROM alerts a WHERE a.event_id = e.id AND a.level != 'info') AS open_alerts
    FROM events e
    ORDER BY e.live DESC, e.start_date ASC
  `);
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  await initDb();
  const body = await req.json();
  const { title, tagline, type, start_date, end_date, venue, city } = body;
  if (!title || !start_date || !venue) {
    return NextResponse.json({ error: 'title, start_date and venue are required' }, { status: 400 });
  }
  const r = await run(
    `INSERT INTO events (title, tagline, type, start_date, end_date, venue, city, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'planning')`,
    [title, tagline || null, type || 'Wedding', start_date, end_date || start_date, venue, city || null]
  );
  await logAlert(r.lastInsertRowid, 'info', 'Event created');
  const event = await queryOne('SELECT * FROM events WHERE id = ?', [r.lastInsertRowid]);
  return NextResponse.json({ event }, { status: 201 });
}
