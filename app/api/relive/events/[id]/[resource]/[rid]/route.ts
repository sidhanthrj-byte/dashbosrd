import { NextRequest, NextResponse } from 'next/server';
import { initDb, queryOne, run, logAlert } from '@/lib/relive/db';
import { RESOURCES } from '@/lib/relive/resources';

type Ctx = { params: Promise<{ id: string; resource: string; rid: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, resource, rid } = await params;
  const def = RESOURCES[resource];
  if (!def) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  await initDb();

  const body = await req.json();
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const c of def.columns) {
    if (c in body) {
      sets.push(`${c} = ?`);
      args.push(body[c]);
    }
  }
  if (sets.length > 0) {
    args.push(Number(rid), Number(id));
    const r = await run(`UPDATE ${def.table} SET ${sets.join(', ')} WHERE id = ? AND event_id = ?`, args);
    if (r.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (body._log?.message) {
    await logAlert(Number(id), body._log.level || 'info', String(body._log.message));
  }
  const row = await queryOne(`SELECT * FROM ${def.table} WHERE id = ? AND event_id = ?`, [rid, id]);
  return NextResponse.json({ row });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id, resource, rid } = await params;
  const def = RESOURCES[resource];
  if (!def) return NextResponse.json({ error: 'Unknown resource' }, { status: 404 });
  await initDb();
  if (resource === 'drivers') {
    // Free any guests assigned to this driver first.
    await run('UPDATE guests SET driver_id = NULL, pickup_eta = NULL WHERE event_id = ? AND driver_id = ?', [id, rid]);
  }
  const r = await run(`DELETE FROM ${def.table} WHERE id = ? AND event_id = ?`, [rid, id]);
  if (r.changes === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
