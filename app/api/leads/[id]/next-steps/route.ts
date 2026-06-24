import { NextRequest, NextResponse } from 'next/server';
import { getDb, Lead } from '@/lib/db';
import { generateNextSteps } from '@/lib/next-steps';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as Lead | undefined;
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let steps;
  if (lead.ai_next_steps) {
    try {
      steps = JSON.parse(lead.ai_next_steps);
    } catch {
      steps = generateNextSteps(lead.status, lead.contact_name, lead.company_name, lead.notes || '');
    }
  } else {
    steps = generateNextSteps(lead.status, lead.contact_name, lead.company_name, lead.notes || '');
  }

  return NextResponse.json({ steps });
}
