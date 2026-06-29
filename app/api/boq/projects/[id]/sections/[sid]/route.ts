import { NextRequest, NextResponse } from 'next/server';
import { initDb, queryOne, run } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string; sid: string }> };

async function authorize(req: NextRequest, projectId: string, sectionId: string) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return null;
  const section = await queryOne(
    `SELECT s.* FROM boq_sections s
     JOIN boq_projects p ON p.id = s.project_id
     WHERE s.id = ? AND p.id = ? AND p.user_id = ?`,
    [sectionId, projectId, user.id]
  );
  return section ? { user, section } : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, sid } = await params;
  const auth = await authorize(req, id, sid);
  if (!auth) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { name, area, sort_order } = body;

  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (area !== undefined) { updates.push('area = ?'); values.push(area); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }

  if (updates.length > 0) {
    values.push(Number(sid));
    await run(`UPDATE boq_sections SET ${updates.join(', ')} WHERE id = ?`, values);
  }

  const section = await queryOne('SELECT * FROM boq_sections WHERE id = ?', [sid]);
  return NextResponse.json({ section });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, sid } = await params;
  const auth = await authorize(req, id, sid);
  if (!auth) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await run('DELETE FROM boq_items WHERE section_id = ?', [sid]);
  await run('DELETE FROM boq_sections WHERE id = ?', [sid]);
  return NextResponse.json({ ok: true });
}
