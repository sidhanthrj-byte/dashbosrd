import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, queryOne, run, logAlert } from '@/lib/relive/db';
import { RESOURCES } from '@/lib/relive/resources';

type Ctx = { params: Promise<{ id: string; resource: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id, resource } = await params;
  const def = RESOURCES[resource];
  if (!def) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  await initDb();
  const order = resource === 'alerts' ? 'id DESC' : 'id ASC';
  const rows = await query(`SELECT * FROM ${def.table} WHERE event_id = ? ORDER BY ${order}`, [id]);
  return NextResponse.json({ [resource]: rows });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id, resource } = await params;
  const def = RESOURCES[resource];
  if (!def) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  await initDb();
  const event = await queryOne('SELECT id FROM events WHERE id = ?', [id]);
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const body = await req.json();
  for (const f of def.required) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      return NextResponse.json({ error: `${f} is required` }, { status: 400 });
    }
  }
  const cols = def.columns.filter((c) => c in body);
  const values = cols.map((c) => body[c]);
  const r = await run(
    `INSERT INTO ${def.table} (event_id${cols.map((c) => `, ${c}`).join('')})
     VALUES (?${cols.map(() => ', ?').join('')})`,
    [Number(id), ...values]
  );
  if (body._log?.message) {
    await logAlert(Number(id), body._log.level || 'info', String(body._log.message));
  }
  const row = await queryOne(`SELECT * FROM ${def.table} WHERE id = ?`, [r.lastInsertRowid]);
  return NextResponse.json({ row }, { status: 201 });
}
