import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateNextSteps, getNextActionDate } from '@/lib/next-steps';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const logs = db.prepare('SELECT * FROM call_logs WHERE lead_id = ? ORDER BY created_at DESC').all(id);
  return NextResponse.json({ lead, logs });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const body = await req.json();
  const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as { status: string; contact_name: string; company_name: string } | undefined;
  if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status, notes, next_action, next_action_date, phone, email, area, deal_value } = body;
  const prevStatus = lead.status;

  let aiNextSteps = null;

  if (status && status !== prevStatus) {
    if (anthropic) {
      try {
        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          messages: [
            {
              role: 'user',
              content: `You are a sales assistant for Pongs Stretch Ceilings — a premium stretch ceiling brand sold to architects and interior designers in India.

Lead: ${lead.contact_name} (${lead.company_name})
Previous status: ${prevStatus}
New status: ${status}
Notes: ${notes || 'None'}

Give me exactly 3 specific, actionable next steps as a JSON array. Each step should have: action (string), timeframe (string), priority ("high"/"medium"/"low"), and optionally a short call script (50 words max).

Respond ONLY with a valid JSON array, no explanation.`,
            },
          ],
        });
        const text = (msg.content[0] as { text: string }).text.trim();
        const json = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        aiNextSteps = json;
      } catch {
        // fall through to rule-based
      }
    }

    if (!aiNextSteps) {
      const steps = generateNextSteps(status, lead.contact_name, lead.company_name, notes);
      aiNextSteps = JSON.stringify(steps);
    }

    db.prepare(`
      INSERT INTO call_logs (lead_id, status_before, status_after, notes, outcome)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, prevStatus, status, notes || null, status);
  }

  const nextDate = next_action_date || (status ? getNextActionDate(status) : null);

  db.prepare(`
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
    WHERE id = ?
  `).run(
    status || null,
    notes || null,
    next_action || null,
    nextDate,
    phone || null,
    email || null,
    area || null,
    deal_value ?? null,
    aiNextSteps,
    status || null,
    id
  );

  // Auto-add next batch after 6 contacts
  if (status && status !== prevStatus && status !== 'new') {
    const setting = db.prepare("SELECT value FROM settings WHERE key = 'leads_contacted_since_last_batch'").get() as { value: string } | undefined;
    const count = parseInt(setting?.value || '0') + 1;
    db.prepare("INSERT OR REPLACE INTO settings VALUES ('leads_contacted_since_last_batch', ?)").run(String(count));

    if (count >= 6) {
      await addNewBatch(db);
      db.prepare("INSERT OR REPLACE INTO settings VALUES ('leads_contacted_since_last_batch', '0')").run();
    }
  }

  const updated = db.prepare('SELECT * FROM leads WHERE id = ?').get(id);
  return NextResponse.json({ lead: updated, aiNextSteps: aiNextSteps ? JSON.parse(aiNextSteps) : null });
}

async function addNewBatch(db: ReturnType<typeof getDb>) {
  const lastBatch = db.prepare("SELECT value FROM settings WHERE key = 'last_batch'").get() as { value: string } | undefined;
  const nextBatch = parseInt(lastBatch?.value || '1') + 1;

  const newLeads = [
    { company_name: 'Kapil Gupta Architects', contact_name: 'Kapil Gupta', contact_title: 'Principal', city: 'Hyderabad', state: 'Telangana', email: 'info@kapilguptaarchitects.com', priority: 'high', project_type: 'Luxury Residential' },
    { company_name: 'Shanmugam Associates', contact_name: 'S. Shanmugam', contact_title: 'Principal Architect', city: 'Chennai', state: 'Tamil Nadu', email: 'info@shanmugamassociates.com', priority: 'high', project_type: 'Villa & Bungalow' },
    { company_name: 'Venkataramanan Associates', contact_name: 'G. Venkataramanan', contact_title: 'Director', city: 'Chennai', state: 'Tamil Nadu', email: 'va@venkataramanan.com', priority: 'medium', project_type: 'Residential & Commercial' },
    { company_name: 'Ar. Rajiv Saini & Associates', contact_name: 'Rajiv Saini', contact_title: 'Principal Architect', city: 'Mumbai', state: 'Maharashtra', email: 'studio@rajivsaini.com', priority: 'high', project_type: 'Luxury Interiors' },
    { company_name: 'Studio Lotus', contact_name: 'Ambrish Arora', contact_title: 'Founding Partner', city: 'New Delhi', state: 'Delhi', linkedin_url: 'https://www.linkedin.com/company/studio-lotus', email: 'studio@studiolotus.in', priority: 'high', project_type: 'Heritage & Sustainable' },
    { company_name: 'DADA & Partners', contact_name: 'David Adjaye', contact_title: 'Design Director', city: 'Bangalore', state: 'Karnataka', email: 'info@dadapartners.com', priority: 'medium', project_type: 'Commercial' },
    { company_name: 'GA Design', contact_name: 'Gurjit Matharoo', contact_title: 'Principal', city: 'Ahmedabad', state: 'Gujarat', email: 'ga@gadesign.in', priority: 'medium', project_type: 'Institutional' },
    { company_name: 'Biome Environmental Solutions', contact_name: 'Ar. Chitra Vishwanath', contact_title: 'Director', city: 'Bangalore', state: 'Karnataka', email: 'info@biome-solutions.com', priority: 'medium', project_type: 'Green Buildings' },
    { company_name: 'De Design', contact_name: 'Ar. Parag Singal', contact_title: 'Principal', city: 'Ahmedabad', state: 'Gujarat', email: 'info@dedesign.in', priority: 'medium', project_type: 'Residential & Commercial' },
    { company_name: 'T+T Design', contact_name: 'Tanvir Saggu', contact_title: 'Creative Director', city: 'Chandigarh', state: 'Punjab', email: 'tt@ttdesign.in', priority: 'medium', project_type: 'Hospitality' },
    { company_name: 'Ace Associates', contact_name: 'Ar. Saurabh Jain', contact_title: 'Principal', city: 'Jaipur', state: 'Rajasthan', email: 'info@aceassociates.co.in', priority: 'medium', project_type: 'Residential' },
    { company_name: 'Khosla Associates', contact_name: 'Sandeep Khosla', contact_title: 'Principal', city: 'Bangalore', state: 'Karnataka', linkedin_url: 'https://www.linkedin.com/company/khosla-associates', email: 'studio@khoslaassociates.com', priority: 'high', project_type: 'Luxury Residential' },
  ];

  const stmt = db.prepare(`
    INSERT INTO leads (company_name, contact_name, contact_title, city, state, linkedin_url, email, priority, project_type, batch_number, status)
    VALUES (@company_name, @contact_name, @contact_title, @city, @state, @linkedin_url, @email, @priority, @project_type, @batch_number, 'new')
  `);

  for (const lead of newLeads) {
    stmt.run({ linkedin_url: null, ...lead, batch_number: nextBatch });
  }

  db.prepare("INSERT OR REPLACE INTO settings VALUES ('last_batch', ?)").run(String(nextBatch));
}
