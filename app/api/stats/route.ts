import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const total = (db.prepare('SELECT COUNT(*) as c FROM leads').get() as { c: number }).c;
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM leads GROUP BY status
  `).all() as { status: string; count: number }[];

  const converted = byStatus.find(s => s.status === 'converted')?.count || 0;
  const inProgress = byStatus
    .filter(s => !['new', 'converted', 'not_interested'].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const todayFollowUps = (db.prepare(`
    SELECT COUNT(*) as c FROM leads
    WHERE next_action_date <= date('now') AND status NOT IN ('converted', 'not_interested')
  `).get() as { c: number }).c;

  const lastBatch = (db.prepare("SELECT value FROM settings WHERE key = 'last_batch'").get() as { value: string } | undefined)?.value || '1';
  const contactedSinceBatch = (db.prepare("SELECT value FROM settings WHERE key = 'leads_contacted_since_last_batch'").get() as { value: string } | undefined)?.value || '0';

  const recentLogs = db.prepare(`
    SELECT cl.*, l.company_name, l.contact_name
    FROM call_logs cl
    JOIN leads l ON l.id = cl.lead_id
    ORDER BY cl.created_at DESC
    LIMIT 10
  `).all();

  return NextResponse.json({
    total,
    converted,
    inProgress,
    todayFollowUps,
    byStatus,
    lastBatch: parseInt(lastBatch),
    contactedSinceBatch: parseInt(contactedSinceBatch),
    nextBatchIn: Math.max(0, 6 - parseInt(contactedSinceBatch)),
    recentLogs,
  });
}
