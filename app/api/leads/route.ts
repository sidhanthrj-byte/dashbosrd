import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, run } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const batch = searchParams.get('batch');
  const search = searchParams.get('search');
  const city = searchParams.get('city');
  const area = searchParams.get('area');
  const priority = searchParams.get('priority');
  const phoneFilter = searchParams.get('phone_filter'); // 'has_phone' | 'no_contact'
  const sort = searchParams.get('sort') || 'priority';

  let sql = 'SELECT * FROM leads WHERE user_id = ? AND (archived = 0 OR archived IS NULL)';
  const params: (string | number)[] = [session.userId];

  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  if (batch) { sql += ' AND batch_number = ?'; params.push(Number(batch)); }
  if (search) {
    sql += ' AND (company_name LIKE ? OR contact_name LIKE ? OR city LIKE ? OR area LIKE ? OR project_type LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (city && city !== 'all') { sql += ' AND city LIKE ?'; params.push(`%${city}%`); }
  if (area && area !== 'all') { sql += ' AND area LIKE ?'; params.push(`%${area}%`); }
  if (priority && priority !== 'all') { sql += ' AND priority = ?'; params.push(priority); }
  if (phoneFilter === 'has_phone') { sql += ' AND phone IS NOT NULL'; }
  else if (phoneFilter === 'no_contact') { sql += ' AND phone IS NULL AND phone_fetched = 1'; }
  else if (phoneFilter === 'not_fetched') { sql += ' AND phone IS NULL AND phone_fetched = 0'; }

  const ORDER: Record<string, string> = {
    priority: "CASE WHEN phone IS NOT NULL THEN 0 ELSE 1 END ASC, CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END ASC, CASE WHEN next_action_date <= date('now') THEN 0 ELSE 1 END ASC, updated_at DESC",
    recent:   'updated_at DESC',
    followup: 'next_action_date ASC',
    name:     'contact_name ASC',
    company:  'company_name ASC',
  };
  sql += ` ORDER BY ${ORDER[sort] || ORDER.priority}`;

  const leads = await query(sql, params);
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const body = await req.json();
  const { company_name, contact_name, contact_title, city, state, area, email, phone, linkedin_url, priority, project_type, notes, status } = body;

  if (!company_name || !contact_name) {
    return NextResponse.json({ error: 'Company and contact name required' }, { status: 400 });
  }

  const result = await run(
    `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, email, phone, linkedin_url, priority, project_type, notes, status, user_id, batch_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [company_name, contact_name, contact_title || '', city || '', state || '', area || null, email || null, phone || null, linkedin_url || null, priority || 'medium', project_type || null, notes || null, status || 'new', session.userId]
  );

  const rows = await query('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
  return NextResponse.json({ lead: rows[0] }, { status: 201 });
}
