import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { initDb, query, run } from '@/lib/db';

const CITY_LOCATIONS: Record<string, string> = {
  Mumbai:    'Mumbai, Maharashtra, India',
  Bangalore: 'Bangalore, Karnataka, India',
  Chennai:   'Chennai, Tamil Nadu, India',
  Pune:      'Pune, Maharashtra, India',
  Hyderabad: 'Hyderabad, Telangana, India',
};

function tierFromTitle(title: string): string {
  const t = (title || '').toLowerCase();
  if (t.includes('principal') || t.includes('founder') || t.includes('director') || t.includes('managing') || t.includes('chief') || t.includes('partner')) return 'high';
  if (t.includes('senior') || t.includes('associate') || t.includes('head') || t.includes('lead')) return 'medium';
  return 'low';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApolloPerson = Record<string, any>;

function formatPerson(p: ApolloPerson) {
  const phones = p.phone_numbers || [];
  const mobile = phones.find((ph: { type: string }) => ph.type === 'mobile');
  const work = phones.find((ph: { type: string }) => ph.type === 'work');
  const best = mobile || work || phones[0];
  const orgPhone = p.organization?.primary_phone;
  const phone = best?.sanitized_number || best?.raw_number
    || orgPhone?.sanitized_number || orgPhone?.number
    || p.organization?.phone || p.sanitized_phone || null;

  return {
    id: p.id,
    name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    first_name: p.first_name,
    last_name: p.last_name,
    title: p.title || '',
    email: p.email || null,
    phone,
    has_direct_phone: p.has_direct_phone || (phones.length > 0 ? 'Yes' : 'No'),
    linkedin_url: p.linkedin_url || null,
    organization: {
      name: p.organization?.name || p.employment_history?.[0]?.organization_name || '',
      website_url: p.organization?.website_url || null,
      primary_phone: orgPhone?.sanitized_number || orgPhone?.number || null,
    },
    city: p.city || p.organization?.city || '',
    state: p.state || p.organization?.state || '',
  };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });

  // Read body once
  const body = await req.json().catch(() => ({}));
  const { keywords, company, title, linkedinUrl, page = 1, addPerson } = body;

  // ── Add a specific Apollo person as a lead ─────────────────────────────────
  if (addPerson) {
    await initDb();
    const userId = session.userId;
    const city = session.city;
    const p = addPerson as ApolloPerson;

    const companyName = p.organization?.name || p.employment_history?.[0]?.organization_name || 'Unknown';
    const contactName = p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
    if (!contactName || companyName === 'Unknown') {
      return NextResponse.json({ error: 'Insufficient person data' }, { status: 400 });
    }

    const phone = p.phone || null;
    const result = await run(
      `INSERT INTO leads (company_name, contact_name, contact_title, city, state, linkedin_url, email, phone, phone_fetched, priority, project_type, batch_number, status, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'new', ?)`,
      [companyName, contactName, p.title || 'Architect', city, '', p.linkedin_url || null,
       p.email || null, phone, phone ? 1 : 0, tierFromTitle(p.title || ''), null, userId]
    );
    const rows = await query('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ lead: rows[0] }, { status: 201 });
  }

  // ── Search Apollo ──────────────────────────────────────────────────────────

  // LinkedIn URL — use people/match directly for precision
  if (linkedinUrl) {
    const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify({ linkedin_url: linkedinUrl, reveal_personal_emails: true }),
      signal: AbortSignal.timeout(10000),
    });
    if (matchRes.ok) {
      const d = await matchRes.json();
      const p = d?.person;
      if (p) {
        // Get org phone via match by ID
        const formatted = formatPerson(p);
        return NextResponse.json({ people: [formatted], total: 1 });
      }
    }
    return NextResponse.json({ people: [], total: 0 });
  }

  const searchBody: Record<string, unknown> = { per_page: 10, page };

  if (keywords) searchBody.q_keywords = keywords;
  if (company) searchBody.q_organization_name = company;
  if (title) searchBody.person_titles = [title];

  // Add location + industry filter when no specific person is being searched
  if (!keywords && !company) {
    const location = CITY_LOCATIONS[session.city] || session.city;
    searchBody.person_locations = [location];
    if (!title) {
      searchBody.person_titles = [
        'Architect', 'Principal Architect', 'Interior Designer', 'Design Director',
        'Senior Architect', 'Associate Architect', 'Founder', 'Director',
        'Head of Projects', 'Design Manager', 'Studio Manager',
      ];
      searchBody.q_organization_keyword_tags = ['architecture', 'interior design', 'design studio'];
    }
  }

  const apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
    body: JSON.stringify(searchBody),
    signal: AbortSignal.timeout(15000),
  });

  if (!apolloRes.ok) {
    const err = await apolloRes.text();
    console.error('Apollo search-apollo error:', apolloRes.status, err);
    return NextResponse.json({ error: `Apollo error: ${apolloRes.status}`, people: [] }, { status: 502 });
  }

  const data = await apolloRes.json();
  const people: ApolloPerson[] = data?.people || [];
  const formatted = people.map(formatPerson);

  // For name searches, enrich top result with people/match to get org phone
  if (keywords && people.length > 0 && people[0]?.id) {
    try {
      const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
        body: JSON.stringify({ id: people[0].id, reveal_personal_emails: true }),
        signal: AbortSignal.timeout(8000),
      });
      if (matchRes.ok) {
        const d = await matchRes.json();
        if (d?.person) formatted[0] = formatPerson(d.person);
      }
    } catch { /* enrichment is best-effort */ }
  }

  return NextResponse.json({
    people: formatted,
    total: data?.pagination?.total_entries || people.length,
    page: data?.pagination?.page || page,
  });
}
