import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const batch = searchParams.get('batch');
  const search = searchParams.get('search');
  const city = searchParams.get('city');
  const area = searchParams.get('area');
  const priority = searchParams.get('priority');
  const project_type = searchParams.get('project_type');
  const sort = searchParams.get('sort') || 'priority';

  let query = 'SELECT * FROM leads WHERE 1=1';
  const params: (string | number)[] = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (batch) {
    query += ' AND batch_number = ?';
    params.push(Number(batch));
  }
  if (search) {
    query += ' AND (company_name LIKE ? OR contact_name LIKE ? OR city LIKE ? OR area LIKE ? OR project_type LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (city && city !== 'all') {
    query += ' AND city LIKE ?';
    params.push(`%${city}%`);
  }
  if (area && area !== 'all') {
    query += ' AND area LIKE ?';
    params.push(`%${area}%`);
  }
  if (priority && priority !== 'all') {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (project_type && project_type !== 'all') {
    query += ' AND project_type LIKE ?';
    params.push(`%${project_type}%`);
  }

  const orderMap: Record<string, string> = {
    priority: "CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END ASC, updated_at DESC",
    recent: 'updated_at DESC',
    name: 'contact_name ASC',
    company: 'company_name ASC',
    followup: 'next_action_date ASC',
  };
  query += ` ORDER BY ${orderMap[sort] || orderMap['priority']}`;

  const leads = db.prepare(query).all(...params);
  return NextResponse.json({ leads });
}
