import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, queryOne } from '@/lib/relive/db';
import type { Driver, EventRow, Guest } from '@/lib/relive/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDb();
  const event = await queryOne<EventRow>('SELECT * FROM events WHERE id = ?', [id]);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const guests = await query<Guest>('SELECT * FROM guests WHERE event_id = ? ORDER BY name ASC', [id]);
  const drivers = await query<Driver>('SELECT * FROM drivers WHERE event_id = ?', [id]);
  const driverName = new Map(drivers.map((d) => [d.id, d.name]));

  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['id', 'name', 'group', 'vip', 'seat', 'diet', 'phone', 'checked_in', 'checked_in_at', 'driver', 'pickup_eta', 'notes'],
    ...guests.map((g) => [
      g.id, g.name, g.grp ?? '', g.vip ? 'yes' : 'no', g.seat ?? '', g.diet, g.phone ?? '',
      g.checked_in ? 'yes' : 'no', g.checked_in_at ?? '',
      g.driver_id ? driverName.get(g.driver_id) ?? g.driver_id : '', g.pickup_eta ?? '', g.notes ?? '',
    ]),
  ];
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const slug = event.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-guests.csv"`,
    },
  });
}
