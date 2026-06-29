import { NextRequest, NextResponse } from 'next/server';
import { initDb, queryOne, run } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const project = await queryOne(
    'SELECT * FROM boq_projects WHERE id = ? AND user_id = ?',
    [id, user.id]
  );
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const sections = await run(`SELECT * FROM boq_sections WHERE project_id = ? ORDER BY sort_order, id`, [id]);
  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await queryOne('SELECT id FROM boq_projects WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const fields = ['name', 'client_name', 'client_phone', 'client_email', 'project_type',
                  'location', 'total_area', 'status', 'markup_percent', 'discount_amount', 'notes'];

  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  for (const f of fields) {
    if (f in body) {
      updates.push(`${f} = ?`);
      values.push(body[f] as string | number | null);
    }
  }
  if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

  updates.push(`updated_at = datetime('now')`);
  values.push(Number(id), Number(user.id));

  await run(`UPDATE boq_projects SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, values);
  const project = await queryOne('SELECT * FROM boq_projects WHERE id = ?', [id]);
  return NextResponse.json({ project });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await queryOne('SELECT id FROM boq_projects WHERE id = ? AND user_id = ?', [id, user.id]);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Cascade delete items → sections → project
  await run(`DELETE FROM boq_items WHERE section_id IN (SELECT id FROM boq_sections WHERE project_id = ?)`, [id]);
  await run(`DELETE FROM boq_sections WHERE project_id = ?`, [id]);
  await run(`DELETE FROM boq_projects WHERE id = ?`, [id]);

  return NextResponse.json({ ok: true });
}
