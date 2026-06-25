import { NextRequest, NextResponse } from 'next/server';
import { initDb, queryOne } from '@/lib/db';
import { generateNextSteps } from '@/lib/next-steps';
import { getSession } from '@/lib/auth';
import type { Lead } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const lead = await queryOne<Lead>('SELECT * FROM leads WHERE id = ? AND user_id = ?', [id, session.userId]);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let steps;
  if (lead.ai_next_steps) {
    try { steps = JSON.parse(lead.ai_next_steps); }
    catch { steps = generateNextSteps(lead.status, lead.contact_name, lead.company_name, lead.notes || ''); }
  } else {
    steps = generateNextSteps(lead.status, lead.contact_name, lead.company_name, lead.notes || '');
  }

  return NextResponse.json({ steps });
}
