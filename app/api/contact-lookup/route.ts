import { NextRequest, NextResponse } from 'next/server';
import { initDb, run } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId, linkedinUrl, name, company } = await req.json();
  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });

  try {
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const body: Record<string, string | boolean> = { reveal_personal_emails: false };
    if (firstName) body.first_name = firstName;
    if (lastName) body.last_name = lastName;
    if (company) body.organization_name = company;
    if (linkedinUrl) body.linkedin_url = linkedinUrl;

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

    const phones: { raw_number: string; type: string }[] = person.phone_numbers || [];
    const mobilePhone = phones.find(p => p.type === 'mobile')?.raw_number;
    const phone = mobilePhone || phones[0]?.raw_number || null;

    const emails: string[] = [];
    if (person.email) emails.push(person.email);
    (person.contact_emails || []).forEach((e: { email: string }) => {
      if (e.email && !emails.includes(e.email)) emails.push(e.email);
    });
    const email = emails[0] || null;

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
      allPhones: phones.map(p => p.raw_number),
      allEmails: emails,
      name: person.name,
      title: person.title,
      linkedin: person.linkedin_url,
    });
  } catch (err) {
    console.error('Apollo lookup error:', err);
    return NextResponse.json({ error: 'Contact lookup failed', phone: null, email: null, found: false }, { status: 500 });
  }
}
