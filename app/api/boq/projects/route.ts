import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, run, queryOne } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await query<{
    id: number; name: string; client_name: string; client_phone: string;
    project_type: string; location: string; total_area: number;
    status: string; markup_percent: number; discount_amount: number;
    created_at: string; updated_at: string;
    section_count: number; subtotal: number;
  }>(
    `SELECT p.*,
      COUNT(DISTINCT s.id) AS section_count,
      COALESCE(SUM(i.quantity * i.rate), 0) AS subtotal
     FROM boq_projects p
     LEFT JOIN boq_sections s ON s.project_id = p.id
     LEFT JOIN boq_items i ON i.section_id = s.id
     WHERE p.user_id = ?
     GROUP BY p.id
     ORDER BY p.updated_at DESC`,
    [user.id]
  );

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  await initDb();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, client_name, client_phone, client_email, project_type, location, total_area, notes } = body;

  if (!name || !client_name) {
    return NextResponse.json({ error: 'name and client_name are required' }, { status: 400 });
  }

  const result = await run(
    `INSERT INTO boq_projects (name, client_name, client_phone, client_email, project_type, location, total_area, notes, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, client_name, client_phone || null, client_email || null,
     project_type || 'Residential Apartment', location || null,
     total_area || null, notes || null, user.id]
  );

  const project = await queryOne('SELECT * FROM boq_projects WHERE id = ?', [result.lastInsertRowid]);
  return NextResponse.json({ project }, { status: 201 });
}
