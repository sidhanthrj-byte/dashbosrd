import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const batch = searchParams.get('batch');
  const search = searchParams.get('search');

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
    query += ' AND (company_name LIKE ? OR contact_name LIKE ? OR city LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY priority DESC, created_at ASC';

  const leads = db.prepare(query).all(...params);
  return NextResponse.json({ leads });
}
