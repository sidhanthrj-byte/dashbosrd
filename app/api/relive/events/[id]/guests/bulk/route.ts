import { NextRequest, NextResponse } from 'next/server';
import { initDb, queryOne, run, logAlert } from '@/lib/relive/db';
import { DIETS } from '@/lib/relive/types';

type IncomingGuest = {
  name?: string;
  grp?: string | null;
  seat?: string | null;
  diet?: string | null;
  phone?: string | null;
  vip?: boolean | number | string | null;
};

const MAX_ROWS = 5000;
const DIET_SET = new Set(DIETS.map((d) => d.toLowerCase()));

function truthy(v: unknown): number {
  if (v === true || v === 1) return 1;
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'yes' || s === 'y' || s === 'true' || s === '1' || s === 'vip' ? 1 : 0;
}

function normDiet(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!s) return 'None';
  return DIET_SET.has(s.toLowerCase())
    ? DIETS.find((d) => d.toLowerCase() === s.toLowerCase())!
    : s.slice(0, 40);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await initDb();
  const event = await queryOne('SELECT id FROM events WHERE id = ?', [id]);
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const rows: IncomingGuest[] = Array.isArray(body?.guests) ? body.guests : [];
  if (rows.length === 0) return NextResponse.json({ error: 'No guest rows provided' }, { status: 400 });
  if (rows.length > MAX_ROWS) return NextResponse.json({ error: `Too many rows (max ${MAX_ROWS})` }, { status: 400 });

  let inserted = 0;
  let skipped = 0;
  for (const g of rows) {
    const name = String(g.name ?? '').trim();
    if (!name) { skipped++; continue; }
    await run(
      `INSERT INTO guests (event_id, name, grp, vip, seat, diet, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(id),
        name.slice(0, 120),
        g.grp ? String(g.grp).slice(0, 80) : null,
        truthy(g.vip),
        g.seat ? String(g.seat).slice(0, 40) : null,
        normDiet(g.diet),
        g.phone ? String(g.phone).slice(0, 40) : null,
      ]
    );
    inserted++;
  }

  await logAlert(Number(id), 'info', `Guest import: ${inserted} added${skipped ? `, ${skipped} skipped (no name)` : ''}`);
  return NextResponse.json({ inserted, skipped });
}
