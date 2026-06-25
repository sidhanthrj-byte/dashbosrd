import { NextRequest, NextResponse } from 'next/server';
import { initDb, run } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId, linkedinUrl, name, company, email: knownEmail } = await req.json();
  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });

  try {
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const body: Record<string, unknown> = {
      reveal_personal_emails: true,
      reveal_phone_number: true,
    };
    if (firstName) body.first_name = firstName;
    if (lastName) body.last_name = lastName;
    if (company) body.organization_name = company;
    if (linkedinUrl) body.linkedin_url = linkedinUrl;
    if (knownEmail) body.email = knownEmail;

    const res = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Apollo error:', res.status, err);
      return NextResponse.json({ error: `Apollo API error: ${res.status}`, phone: null, email: null, found: false });
    }

    const data = await res.json();
    const person = data?.person;

    if (!person) {
      return NextResponse.json({ phone: null, email: null, found: false });
    }

    // Extract phones — check all sources
    const phones: Array<{ raw_number: string; sanitized_number?: string; type: string }> = person.phone_numbers || [];

    // Prefer mobile, then work, then any
    const mobilePhone = phones.find(p => p.type === 'mobile');
    const workPhone = phones.find(p => p.type === 'work');
    const anyPhone = phones[0];
    const bestPhone = mobilePhone || workPhone || anyPhone;
    let phone: string | null = bestPhone?.raw_number || bestPhone?.sanitized_number || null;

    // Fallback: check organization phone if no personal phone found
    if (!phone) {
      const orgPhone = person.organization?.primary_phone?.number
        || person.organization?.phone
        || person.sanitized_phone
        || null;
      if (orgPhone) phone = orgPhone;
    }

    // Extract emails — all sources
    const emailSet = new Set<string>();
    if (person.email) emailSet.add(person.email);
    (person.contact_emails || []).forEach((e: { email: string }) => { if (e.email) emailSet.add(e.email); });
    (person.revealed_for_current_team?.email ? [person.revealed_for_current_team.email] : []).forEach((e: string) => emailSet.add(e));
    const emails = [...emailSet];
    const email = emails[0] || null;

    // Persist to DB
    await initDb();
    if (leadId) {
      await run(`
        UPDATE leads SET
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          linkedin_url = COALESCE(?, linkedin_url),
          phone_fetched = 1,
          updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `, [phone, email, person.linkedin_url || null, leadId, session.userId]);
    }

    return NextResponse.json({
      found: !!(phone || email),
      phone,
      email,
      allPhones: phones.map(p => ({ number: p.raw_number || p.sanitized_number, type: p.type })),
      allEmails: emails,
      name: person.name,
      title: person.title,
      linkedin: person.linkedin_url,
      apolloId: person.id,
    });
  } catch (err) {
    console.error('Apollo lookup error:', err);
    return NextResponse.json({ error: 'Contact lookup failed', phone: null, email: null, found: false }, { status: 500 });
  }
}
