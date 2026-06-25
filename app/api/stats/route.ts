import { NextResponse } from 'next/server';
import { initDb, query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const userId = session.userId;

  const totalRow = await queryOne<{ c: number }>('SELECT COUNT(*) as c FROM leads WHERE user_id = ?', [userId]);
  const total = totalRow?.c || 0;

  const byStatus = await query<{ status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM leads WHERE user_id = ? GROUP BY status', [userId]
  );

  const converted = byStatus.find(s => s.status === 'converted')?.count || 0;
  const inProgress = byStatus
    .filter(s => !['new', 'converted', 'not_interested'].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const todayRow = await queryOne<{ c: number }>(
    `SELECT COUNT(*) as c FROM leads WHERE user_id = ? AND next_action_date <= date('now') AND status NOT IN ('converted', 'not_interested')`,
    [userId]
  );
  const todayFollowUps = todayRow?.c || 0;

  const batchSetting = await queryOne<{ value: string }>('SELECT value FROM settings WHERE key = ?', [`last_batch_${userId}`]);
  const contactedSetting = await queryOne<{ value: string }>('SELECT value FROM settings WHERE key = ?', [`leads_contacted_${userId}`]);
  const lastBatch = parseInt(batchSetting?.value || '1');
  const contactedSinceBatch = parseInt(contactedSetting?.value || '0');

  const recentLogs = await query(
    `SELECT cl.*, l.company_name, l.contact_name FROM call_logs cl
     JOIN leads l ON l.id = cl.lead_id WHERE l.user_id = ?
     ORDER BY cl.created_at DESC LIMIT 10`,
    [userId]
  );

  return NextResponse.json({
    total, converted, inProgress, todayFollowUps, byStatus,
    lastBatch, contactedSinceBatch,
    nextBatchIn: Math.max(0, 6 - contactedSinceBatch),
    recentLogs,
  });
}
