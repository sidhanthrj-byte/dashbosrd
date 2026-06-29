import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, queryOne, run } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string; sid: string }> };

async function authorizeSection(req: NextRequest, projectId: string, sectionId: string) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return null;
  const section = await queryOne(
    `SELECT s.id FROM boq_sections s
     JOIN boq_projects p ON p.id = s.project_id
     WHERE s.id = ? AND p.id = ? AND p.user_id = ?`,
    [sectionId, projectId, user.id]
  );
  return section ? user : null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id, sid } = await params;
  const user = await authorizeSection(req, id, sid);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await query(
    'SELECT * FROM boq_items WHERE section_id = ? ORDER BY sort_order, id',
    [sid]
  );
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id, sid } = await params;
  const user = await authorizeSection(req, id, sid);
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const {
    category = 'Civil Work',
    description = 'New Item',
    specification = '',
    unit = 'sqft',
    quantity = 0,
    rate = 0,
    gst_percent = 18,
  } = body;

  const maxOrder = await queryOne<{ max_order: number }>(
    'SELECT MAX(sort_order) as max_order FROM boq_items WHERE section_id = ?', [sid]
  );
  const sort_order = (maxOrder?.max_order ?? -1) + 1;

  const result = await run(
    `INSERT INTO boq_items (section_id, category, description, specification, unit, quantity, rate, gst_percent, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sid, category, description, specification, unit, quantity, rate, gst_percent, sort_order]
  );

  const item = await queryOne('SELECT * FROM boq_items WHERE id = ?', [result.lastInsertRowid]);
  return NextResponse.json({ item }, { status: 201 });
}
