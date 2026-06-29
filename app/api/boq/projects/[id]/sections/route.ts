import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, queryOne, run } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const project = await queryOne('SELECT id FROM boq_projects WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sections = await query(
    `SELECT s.*,
      COALESCE(SUM(i.quantity * i.rate), 0) as subtotal,
      COUNT(i.id) as item_count
     FROM boq_sections s
     LEFT JOIN boq_items i ON i.section_id = s.id
     WHERE s.project_id = ?
     GROUP BY s.id
     ORDER BY s.sort_order, s.id`,
    [id]
  );

  // Load items for each section
  const items = await query(
    `SELECT i.* FROM boq_items i
     JOIN boq_sections s ON i.section_id = s.id
     WHERE s.project_id = ?
     ORDER BY i.sort_order, i.id`,
    [id]
  );

  return NextResponse.json({ sections, items });
}

export async function POST(req: NextRequest, { params }: Params) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const project = await queryOne('SELECT id FROM boq_projects WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { name, area } = body;
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const maxOrder = await queryOne<{ max_order: number }>(
    'SELECT MAX(sort_order) as max_order FROM boq_sections WHERE project_id = ?', [id]
  );
  const sort_order = (maxOrder?.max_order ?? -1) + 1;

  const result = await run(
    'INSERT INTO boq_sections (project_id, name, area, sort_order) VALUES (?, ?, ?, ?)',
    [id, name, area || null, sort_order]
  );

  const section = await queryOne('SELECT * FROM boq_sections WHERE id = ?', [result.lastInsertRowid]);
  return NextResponse.json({ section }, { status: 201 });
}
