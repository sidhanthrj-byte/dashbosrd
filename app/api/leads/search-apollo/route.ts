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

// Titles that matter to a Pongs salesperson: decision-makers and senior
// people at architecture / interior design firms — not juniors, not admin.
const SENIORITY_PRESETS: Record<string, { titles: string[]; seniorities?: string[] }> = {
  // Owners, principals, heads — the people who approve vendors
  leadership: {
    titles: [
      'Principal Architect', 'Founder', 'Co-Founder', 'Managing Director',
      'Design Director', 'Director', 'Partner', 'Managing Partner',
      'Design Head', 'Head of Design', 'Head of Projects', 'Project Head',
      'Chief Architect', 'Studio Head',
    ],
    seniorities: ['owner', 'founder', 'c_suite', 'partner', 'director', 'head'],
  },
  // Senior working professionals — specify projects, recommend materials
  senior: {
    titles: [
      'Senior Architect', 'Senior Interior Designer', 'Senior Designer',
      'Associate Architect', 'Project Architect', 'Project Manager',
      'Design Manager', 'Lead Designer', 'Studio Manager', 'Associate',
    ],
    seniorities: ['senior', 'manager', 'head'],
  },
  // Everyone relevant
  any: {
    titles: [
      'Architect', 'Interior Designer', 'Principal Architect', 'Senior Architect',
      'Senior Interior Designer', 'Design Director', 'Design Head', 'Project Head',
      'Founder', 'Partner', 'Director', 'Project Manager', 'Design Manager',
    ],
  },
};

const ORG_TAGS = ['architecture', 'interior design', 'design studio', 'architectural services'];

// Known localities per city — used to auto-tag a lead's area from the firm's street address
const CITY_AREAS: Record<string, string[]> = {
  Mumbai:    ['Bandra', 'Juhu', 'Khar', 'Andheri', 'Lower Parel', 'Worli', 'Powai', 'Goregaon', 'Malad', 'Navi Mumbai', 'Santa Cruz', 'Vile Parle', 'Dadar', 'Colaba', 'Fort', 'Chembur', 'Borivali', 'Thane'],
  Bangalore: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'BTM Layout', 'Yelahanka', 'Rajajinagar', 'Malleswaram', 'JP Nagar', 'Basavanagudi', 'Sadashivanagar', 'RT Nagar', 'Hebbal', 'Sarjapur', 'Bellandur', 'Marathahalli', 'MG Road', 'Richmond', 'Frazer Town', 'Banashankari', 'Electronic City'],
  Chennai:   ['Adyar', 'Anna Nagar', 'OMR', 'Velachery', 'T Nagar', 'Nungambakkam', 'Mylapore', 'Besant Nagar', 'Kilpauk', 'Egmore', 'Guindy', 'Porur', 'ECR'],
  Pune:      ['Koregaon Park', 'Baner', 'Kothrud', 'Viman Nagar', 'Hinjawadi', 'Wakad', 'Aundh', 'Kalyani Nagar', 'Camp', 'Deccan', 'Hadapsar', 'Balewadi'],
  Hyderabad: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Kondapur', 'Hitech City', 'Kukatpally', 'Begumpet', 'Ameerpet', 'Secunderabad'],
};

function detectArea(city: string, ...texts: (string | null | undefined)[]): string | null {
  const areas = CITY_AREAS[city] || [];
  const haystack = texts.filter(Boolean).join(' ').toLowerCase();
  if (!haystack) return null;
  for (const a of areas) {
    if (haystack.includes(a.toLowerCase())) return a;
  }
  return null;
}

function tierFromTitle(title: string): string {
  const t = (title || '').toLowerCase();
  if (t.includes('principal') || t.includes('founder') || t.includes('director') || t.includes('managing') || t.includes('chief') || t.includes('partner') || t.includes('head')) return 'high';
  if (t.includes('senior') || t.includes('associate') || t.includes('lead') || t.includes('manager')) return 'medium';
  return 'low';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApolloPerson = Record<string, any>;

// Extract the best phone, PREFERRING the person's own mobile over office landlines.
function extractPhone(p: ApolloPerson): { phone: string | null; phoneType: string | null } {
  const phones = p.phone_numbers || [];
  const mobile = phones.find((ph: { type: string }) => ph.type === 'mobile');
  const home = phones.find((ph: { type: string }) => ph.type === 'home');
  const work = phones.find((ph: { type: string }) => ph.type === 'work_hq' || ph.type === 'work');
  const other = phones.find((ph: { type: string }) => ph.type === 'other');

  if (mobile?.sanitized_number || mobile?.raw_number) {
    return { phone: mobile.sanitized_number || mobile.raw_number, phoneType: 'mobile' };
  }
  if (home?.sanitized_number || home?.raw_number) {
    return { phone: home.sanitized_number || home.raw_number, phoneType: 'personal' };
  }
  if (other?.sanitized_number || other?.raw_number) {
    return { phone: other.sanitized_number || other.raw_number, phoneType: 'personal' };
  }
  if (work?.sanitized_number || work?.raw_number) {
    return { phone: work.sanitized_number || work.raw_number, phoneType: 'work' };
  }
  const orgPhone = p.organization?.primary_phone;
  const office = orgPhone?.sanitized_number || orgPhone?.number || p.organization?.phone || p.sanitized_phone || null;
  return office ? { phone: office, phoneType: 'office' } : { phone: null, phoneType: null };
}

function formatPerson(p: ApolloPerson) {
  const { phone, phoneType } = extractPhone(p);
  const hasDirectDial = p.has_direct_phone === 'Yes'
    || (p.phone_numbers || []).some((ph: { type: string }) => ph.type === 'mobile');

  return {
    id: p.id,
    name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    first_name: p.first_name,
    last_name: p.last_name,
    title: p.title || '',
    email: p.email || null,
    phone,
    phone_type: phoneType,
    has_direct_phone: hasDirectDial ? 'Yes' : (p.has_direct_phone || 'No'),
    linkedin_url: p.linkedin_url || null,
    organization: {
      name: p.organization?.name || p.employment_history?.[0]?.organization_name || '',
      website_url: p.organization?.website_url || null,
      primary_phone: p.organization?.primary_phone?.sanitized_number || p.organization?.primary_phone?.number || null,
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

  const body = await req.json().catch(() => ({}));
  const { keywords, company, linkedinUrl, area, seniority = 'any', page = 1, perPage = 25, addPerson } = body;

  // ── Add a specific Apollo person as a lead ─────────────────────────────────
  if (addPerson) {
    await initDb();
    const userId = session.userId;
    const city = session.city;
    let p = addPerson as ApolloPerson;

    // Enrich via people/match to get real name + phone (api_search obfuscates last names)
    if (p.id) {
      try {
        const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
          body: JSON.stringify({ id: p.id, reveal_personal_emails: true }),
          signal: AbortSignal.timeout(10000),
        });
        if (matchRes.ok) {
          const d = await matchRes.json();
          if (d?.person) p = d.person;
        }
      } catch { /* use original data */ }
    }

    const formatted = formatPerson(p);
    const companyName = formatted.organization.name || 'Unknown';
    const contactName = formatted.name;
    if (!contactName || companyName === 'Unknown') {
      return NextResponse.json({ error: 'Insufficient person data' }, { status: 400 });
    }

    // Avoid duplicates by apollo_id
    if (p.id) {
      const existing = await query<{ id: number }>(
        'SELECT id FROM leads WHERE user_id = ? AND apollo_id = ? AND (archived = 0 OR archived IS NULL)',
        [userId, p.id]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Already in your CRM', duplicate: true }, { status: 409 });
      }
    }

    // Auto-detect area from the firm's street address, falling back to a user-supplied tag
    const autoArea = detectArea(city,
      p.organization?.street_address, p.organization?.raw_address,
      p.street_address, p.present_raw_address, companyName)
      || body.addArea || null;

    const result = await run(
      `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, phone, phone_type, phone_fetched, priority, project_type, batch_number, status, user_id, apollo_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'new', ?, ?)`,
      [companyName, contactName, formatted.title || 'Architect', city, formatted.state || '',
       autoArea, formatted.linkedin_url, formatted.email, formatted.phone, formatted.phone_type,
       formatted.phone ? 1 : 0, tierFromTitle(formatted.title || ''), null, userId, p.id || null]
    );
    const rows = await query('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
    return NextResponse.json({ lead: rows[0] }, { status: 201 });
  }

  // ── LinkedIn URL — people/match directly for precision ────────────────────
  if (linkedinUrl) {
    const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify({ linkedin_url: linkedinUrl, reveal_personal_emails: true }),
      signal: AbortSignal.timeout(10000),
    });
    if (matchRes.ok) {
      const d = await matchRes.json();
      if (d?.person) return NextResponse.json({ people: [formatPerson(d.person)], total: 1 });
    }
    return NextResponse.json({ people: [], total: 0 });
  }

  // ── Search Apollo ──────────────────────────────────────────────────────────
  const preset = SENIORITY_PRESETS[seniority] || SENIORITY_PRESETS.any;
  const cityLocation = CITY_LOCATIONS[session.city] || session.city;

  const searchBody: Record<string, unknown> = {
    per_page: Math.min(perPage, 50),
    page,
    person_locations: [cityLocation],
    person_titles: preset.titles,
    q_organization_keyword_tags: ORG_TAGS,
  };
  if (preset.seniorities) searchBody.person_seniorities = preset.seniorities;

  // NOTE: Apollo cannot filter by sub-city area — the area param is used only
  // as a tag when adding leads (see addPerson). Search is city-wide.
  void area;
  if (keywords) searchBody.q_keywords = keywords;
  if (company) {
    searchBody.q_organization_name = company;
    // When targeting a specific firm, drop the org-tag constraint (firm name is enough)
    delete searchBody.q_organization_keyword_tags;
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

  // People with a direct (personal) phone first — that's who you can actually call
  formatted.sort((a, b) => {
    const aDirect = a.has_direct_phone === 'Yes' ? 1 : 0;
    const bDirect = b.has_direct_phone === 'Yes' ? 1 : 0;
    return bDirect - aDirect;
  });

  // Skip leads already in the CRM
  await initDb();
  const ids = formatted.map(f => f.id).filter(Boolean);
  let existingIds = new Set<string>();
  if (ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    const existing = await query<{ apollo_id: string }>(
      `SELECT apollo_id FROM leads WHERE user_id = ? AND apollo_id IN (${placeholders}) AND (archived = 0 OR archived IS NULL)`,
      [session.userId, ...ids]
    );
    existingIds = new Set(existing.map(e => e.apollo_id));
  }
  const withDupFlag = formatted.map(f => ({ ...f, already_added: existingIds.has(f.id) }));

  return NextResponse.json({
    people: withDupFlag,
    total: data?.pagination?.total_entries || people.length,
    page: data?.pagination?.page || page,
  });
}
