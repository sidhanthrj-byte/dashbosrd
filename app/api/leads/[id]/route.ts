import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, queryOne, run } from '@/lib/db';
import { generateNextSteps, getNextActionDate } from '@/lib/next-steps';
import { getSession } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const lead = await queryOne('SELECT * FROM leads WHERE id = ? AND user_id = ?', [id, session.userId]);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const logs = await query('SELECT * FROM call_logs WHERE lead_id = ? ORDER BY created_at DESC', [id]);
  return NextResponse.json({ lead, logs });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await initDb();
  const body = await req.json();
  const lead = await queryOne<{ status: string; contact_name: string; company_name: string }>(
    'SELECT * FROM leads WHERE id = ? AND user_id = ?', [id, session.userId]
  );
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status, notes, next_action, next_action_date, phone, email, area, deal_value } = body;
  const prevStatus = lead.status;

  let aiNextSteps: string | null = null;

  if (status && status !== prevStatus) {
    if (anthropic) {
      try {
        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          messages: [{
            role: 'user',
            content: `You are a sales assistant for Pongs Stretch Ceilings — a premium stretch ceiling brand sold to architects and interior designers in India.

Lead: ${lead.contact_name} (${lead.company_name})
Previous status: ${prevStatus}
New status: ${status}
Notes: ${notes || 'None'}

Give me exactly 3 specific, actionable next steps as a JSON array. Each step should have: action (string), timeframe (string), priority ("high"/"medium"/"low"), and optionally a short call script (50 words max).

Respond ONLY with a valid JSON array, no explanation.`,
          }],
        });
        const text = (msg.content[0] as { text: string }).text.trim();
        aiNextSteps = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } catch {}
    }

    if (!aiNextSteps) {
      aiNextSteps = JSON.stringify(generateNextSteps(status, lead.contact_name, lead.company_name, notes));
    }

    await run(
      'INSERT INTO call_logs (lead_id, status_before, status_after, notes, outcome) VALUES (?, ?, ?, ?, ?)',
      [id, prevStatus, status, notes || null, status]
    );
  }

  const nextDate = next_action_date || (status ? getNextActionDate(status) : null);

  await run(`
    UPDATE leads SET
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      next_action = COALESCE(?, next_action),
      next_action_date = COALESCE(?, next_action_date),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      area = COALESCE(?, area),
      deal_value = COALESCE(?, deal_value),
      ai_next_steps = COALESCE(?, ai_next_steps),
      last_contact_date = CASE WHEN ? IS NOT NULL THEN date('now') ELSE last_contact_date END,
      updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `, [
    status || null, notes || null, next_action || null, nextDate,
    phone || null, email || null, area || null, deal_value ?? null,
    aiNextSteps, status || null, id, session.userId,
  ]);

  if (status && status !== prevStatus && status !== 'new') {
    const contactedKey = `leads_contacted_${session.userId}`;
    const setting = await queryOne<{ value: string }>('SELECT value FROM settings WHERE key = ?', [contactedKey]);
    const count = parseInt(setting?.value || '0') + 1;
    await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [contactedKey, String(count)]);

    if (count >= 6) {
      await addNewBatch(session.userId, session.city);
      await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [contactedKey, '0']);
    }
  }

  const updated = await queryOne('SELECT * FROM leads WHERE id = ?', [id]);
  return NextResponse.json({ lead: updated, aiNextSteps: aiNextSteps ? JSON.parse(aiNextSteps) : null });
}

async function addNewBatch(userId: number, city: string) {
  const batchKey = `last_batch_${userId}`;
  const lastBatch = await queryOne<{ value: string }>('SELECT value FROM settings WHERE key = ?', [batchKey]);
  const nextBatch = parseInt(lastBatch?.value || '1') + 1;

  const newLeads: Record<string, Array<{ company_name: string; contact_name: string; contact_title: string; city: string; state: string; area: string; email: string; linkedin_url: string | null; priority: string; project_type: string }>> = {
    Mumbai: [
      { company_name: 'Kapil Gupta Architects', contact_name: 'Kapil Gupta', contact_title: 'Principal', city: 'Mumbai', state: 'Maharashtra', area: 'Khar', email: 'info@kapilguptaarchitects.com', linkedin_url: null, priority: 'high', project_type: 'Luxury Residential' },
      { company_name: 'Studio Koregaon Park', contact_name: 'Amit Shah', contact_title: 'Principal Designer', city: 'Mumbai', state: 'Maharashtra', area: 'Santa Cruz', email: 'info@studiokoregaon.com', linkedin_url: null, priority: 'medium', project_type: 'Residential Interiors' },
    ],
    Bangalore: [
      { company_name: 'Thought Parallels', contact_name: 'Shreekumar Nair', contact_title: 'Principal Architect', city: 'Bangalore', state: 'Karnataka', area: 'Whitefield', email: 'info@thoughtparallels.com', linkedin_url: null, priority: 'high', project_type: 'Residential & Commercial' },
      { company_name: 'Mancala Design', contact_name: 'Rahul Nair', contact_title: 'Founder', city: 'Bangalore', state: 'Karnataka', area: 'Koramangala', email: 'info@mancaladesign.com', linkedin_url: null, priority: 'medium', project_type: 'Luxury Interiors' },
    ],
    Chennai: [
      { company_name: 'Venkataramanan Architects', contact_name: 'Ramesh Venkataramanan', contact_title: 'Principal', city: 'Chennai', state: 'Tamil Nadu', area: 'Adyar', email: 'info@varchitects.com', linkedin_url: null, priority: 'high', project_type: 'Residential' },
      { company_name: 'Studio M Chennai', contact_name: 'Malar Murugesan', contact_title: 'Design Lead', city: 'Chennai', state: 'Tamil Nadu', area: 'OMR', email: 'info@studiomchennai.com', linkedin_url: null, priority: 'medium', project_type: 'Commercial Interiors' },
    ],
    Pune: [
      { company_name: 'Nandita Palchoudhuri Architects', contact_name: 'Nandita Palchoudhuri', contact_title: 'Principal', city: 'Pune', state: 'Maharashtra', area: 'Koregaon Park', email: 'info@npalchoudhuri.com', linkedin_url: null, priority: 'high', project_type: 'Residential' },
      { company_name: 'Praxis Architects', contact_name: 'Sanjay Patil', contact_title: 'Principal Architect', city: 'Pune', state: 'Maharashtra', area: 'Baner', email: 'info@praxisarchitects.in', linkedin_url: null, priority: 'medium', project_type: 'Commercial & Retail' },
    ],
  };

  for (const lead of newLeads[city] || []) {
    await run(
      `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, priority, project_type, batch_number, status, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      [lead.company_name, lead.contact_name, lead.contact_title, lead.city, lead.state, lead.area, lead.linkedin_url, lead.email, lead.priority, lead.project_type, nextBatch, userId]
    );
  }

  await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [batchKey, String(nextBatch)]);
}
