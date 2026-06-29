import { NextRequest, NextResponse } from 'next/server';
import { initDb, queryOne, run } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

type Params = { params: Promise<{ id: string; sid: string; iid: string }> };

async function authorizeItem(req: NextRequest, projectId: string, sectionId: string, itemId: string) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return null;
  const item = await queryOne(
    `SELECT i.* FROM boq_items i
     JOIN boq_sections s ON s.id = i.section_id
     JOIN boq_projects p ON p.id = s.project_id
     WHERE i.id = ? AND s.id = ? AND p.id = ? AND p.user_id = ?`,
    [itemId, sectionId, projectId, user.id]
  );
  return item ? item : null;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id, sid, iid } = await params;
  const item = await authorizeItem(req, id, sid, iid);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const fields = ['category', 'description', 'specification', 'unit', 'quantity', 'rate', 'gst_percent', 'sort_order'];

  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  for (const f of fields) {
    if (f in body) {
      updates.push(`${f} = ?`);
      values.push(body[f] as string | number | null);
    }
  }

  if (updates.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  values.push(Number(iid));
  await run(`UPDATE boq_items SET ${updates.join(', ')} WHERE id = ?`, values);

  const updated = await queryOne('SELECT * FROM boq_items WHERE id = ?', [iid]);
  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, sid, iid } = await params;
  const item = await authorizeItem(req, id, sid, iid);
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await run('DELETE FROM boq_items WHERE id = ?', [iid]);
  return NextResponse.json({ ok: true });
}
