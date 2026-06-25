import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, run } from '@/lib/db';
import { getSession } from '@/lib/auth';

const CITY_LOCATIONS: Record<string, string> = {
  Mumbai:    'Mumbai, Maharashtra, India',
  Bangalore: 'Bangalore, Karnataka, India',
  Chennai:   'Chennai, Tamil Nadu, India',
  Pune:      'Pune, Maharashtra, India',
  Hyderabad: 'Hyderabad, Telangana, India',
};

const TITLES = [
  'Principal Architect', 'Founder', 'Co-Founder', 'Director',
  'Senior Architect', 'Interior Designer', 'Design Director',
  'Partner', 'Managing Director', 'Chief Architect',
];

function tierFromTitle(title: string): string {
  const t = (title || '').toLowerCase();
  if (t.includes('principal') || t.includes('founder') || t.includes('director') || t.includes('managing') || t.includes('chief') || t.includes('partner')) return 'high';
  if (t.includes('senior') || t.includes('associate')) return 'medium';
  return 'low';
}

interface PlaceResult {
  name: string;
  formatted_address: string;
  place_id: string;
  types?: string[];
}

interface ApolloMatchPerson {
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  linkedin_url?: string;
  phone_numbers?: Array<{ raw_number: string; sanitized_number?: string; type: string }>;
  organization?: { name?: string; primary_phone?: { number: string }; phone?: string };
  sanitized_phone?: string;
}

async function matchApolloContact(companyName: string, apolloKey: string): Promise<ApolloMatchPerson | null> {
  try {
    const res = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify({
        organization_name: companyName,
        person_titles: TITLES,
        reveal_personal_emails: true,
        reveal_phone_number: true,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.person || null;
  } catch {
    return null;
  }
}

async function searchGooglePlaces(query: string, placesKey: string): Promise<PlaceResult[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${placesKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.results || [];
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count = 10, page = 1, area, replace_lead_id } = await req.json().catch(() => ({}));
  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });

  await initDb();

  if (replace_lead_id) {
    await run("UPDATE leads SET archived = 1, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
      [replace_lead_id, session.userId]);
  }

  const city = session.city;
  const location = CITY_LOCATIONS[city] || city;

  // Get dedup sets upfront (used by both paths)
  const existing = await query<{ linkedin_url: string }>(
    'SELECT linkedin_url FROM leads WHERE user_id = ? AND linkedin_url IS NOT NULL', [session.userId]
  );
  const existingUrls = new Set(existing.map(r => r.linkedin_url));

  const existingNames = await query<{ contact_name: string; company_name: string }>(
    'SELECT contact_name, company_name FROM leads WHERE user_id = ?', [session.userId]
  );
  const existingCombos = new Set(existingNames.map(r => `${r.contact_name}|${r.company_name}`));

  let batchNum = 2;
  const batchSetting = await query<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?', [`last_batch_${session.userId}`]
  );
  if (batchSetting[0]) batchNum = parseInt(batchSetting[0].value) + 1;

  // ── GOOGLE PLACES PATH (when area specified and key available) ──────────────
  if (area) {
    const placesKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!placesKey) {
      return NextResponse.json({
        error: 'Area search requires GOOGLE_PLACES_API_KEY. Please add it in Vercel environment variables.',
        leads: [],
      }, { status: 500 });
    }

    try {
      // Search for architecture/interior design firms in the specified area
      const [archResults, interiorResults] = await Promise.all([
        searchGooglePlaces(`architects in ${area} ${city}`, placesKey),
        searchGooglePlaces(`interior designers in ${area} ${city}`, placesKey),
      ]);

      // Deduplicate by place_id
      const seen = new Set<string>();
      const places: PlaceResult[] = [];
      for (const p of [...archResults, ...interiorResults]) {
        if (!seen.has(p.place_id)) {
          seen.add(p.place_id);
          places.push(p);
        }
      }

      if (places.length === 0) {
        return NextResponse.json({
          leads: [],
          message: `No architect or interior design firms found in ${area}, ${city} via Google Maps.`,
        });
      }

      const addedLeads = [];
      const limit = Math.min(count, places.length);

      for (let i = 0; i < limit; i++) {
        const place = places[i];
        const companyName = place.name;
        const address = place.formatted_address;

        // Skip if company already in our DB
        const alreadyExists = [...existingCombos].some(combo => combo.includes(`|${companyName}`));
        if (alreadyExists) continue;

        // Try Apollo to find a contact person at this firm
        const person = await matchApolloContact(companyName, apolloKey);

        let contactName = person?.name || `${person?.first_name || ''} ${person?.last_name || ''}`.trim() || null;
        const contactTitle = person?.title || 'Architect';
        const linkedinUrl = person?.linkedin_url || null;
        const email = person?.email || null;

        const phones = person?.phone_numbers || [];
        const mobilePhone = phones.find(p => p.type === 'mobile');
        const anyPhone = phones[0];
        let phone: string | null = mobilePhone?.raw_number || anyPhone?.raw_number || null;
        if (!phone) {
          phone = person?.organization?.primary_phone?.number || person?.organization?.phone || person?.sanitized_phone || null;
        }

        // If Apollo found no contact, create a lead with just the company info
        if (!contactName) contactName = `${companyName} — Contact Needed`;

        if (linkedinUrl && existingUrls.has(linkedinUrl)) continue;
        if (existingCombos.has(`${contactName}|${companyName}`)) continue;

        const priority = tierFromTitle(contactTitle);

        const result = await run(
          `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, phone, phone_fetched, priority, project_type, batch_number, status, user_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
          [
            companyName,
            contactName,
            contactTitle,
            city, '',
            area,
            linkedinUrl, email, phone, phone ? 1 : 0,
            priority, null,
            batchNum, session.userId,
            `Found via Google Maps: ${address}`,
          ]
        );

        const newLead = await query('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
        if (newLead[0]) {
          addedLeads.push(newLead[0]);
          existingUrls.add(linkedinUrl || '');
          existingCombos.add(`${contactName}|${companyName}`);
        }
      }

      if (addedLeads.length > 0) {
        await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [`last_batch_${session.userId}`, String(batchNum)]);
      }

      return NextResponse.json({
        leads: addedLeads,
        added: addedLeads.length,
        searched: places.length,
        source: 'google_maps',
        message: addedLeads.length > 0
          ? `Added ${addedLeads.length} leads from ${places.length} firms found in ${area} via Google Maps`
          : `Found ${places.length} firms in ${area} but all already exist in your database`,
      });
    } catch (err) {
      console.error('Google Places generate error:', err);
      return NextResponse.json({ error: 'Area search failed', leads: [] }, { status: 500 });
    }
  }

  // ── APOLLO PATH (city-level search, no area filter) ─────────────────────────
  try {
    const searchBody: Record<string, unknown> = {
      q_person_title_fuzzy_match: true,
      person_titles: TITLES,
      person_locations: [location],
      q_organization_keyword_tags: ['architecture', 'interior design', 'design studio'],
      per_page: Math.min(count, 25),
      page,
    };

    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify(searchBody),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Apollo search error:', res.status, err);
      return NextResponse.json({ error: `Apollo error: ${res.status}`, leads: [] }, { status: 502 });
    }

    const data = await res.json();
    const people = data?.people || [];

    if (people.length === 0) {
      return NextResponse.json({ leads: [], message: 'No new leads found from Apollo for your city.' });
    }

    const addedLeads = [];

    for (const person of people) {
      const linkedinUrl = person.linkedin_url || null;
      const companyName = person.organization?.name || person.employment_history?.[0]?.organization_name || 'Unknown';
      const contactName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
      const contactTitle = person.title || 'Architect';

      if (linkedinUrl && existingUrls.has(linkedinUrl)) continue;
      if (existingCombos.has(`${contactName}|${companyName}`)) continue;
      if (!contactName || contactName === 'Unknown' || companyName === 'Unknown') continue;

      const email = person.email || null;
      const phones: Array<{ raw_number: string; type: string }> = person.phone_numbers || [];
      const phone = phones.find(p => p.type === 'mobile')?.raw_number || phones[0]?.raw_number || null;
      const priority = tierFromTitle(contactTitle);
      const projectType = person.organization?.keywords?.slice(0, 2).join(' & ') || null;
      const personArea = person.city || null;

      const result = await run(
        `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, phone, phone_fetched, priority, project_type, batch_number, status, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
        [
          companyName, contactName, contactTitle,
          city, '', personArea,
          linkedinUrl, email, phone, phone ? 1 : 0,
          priority, projectType,
          batchNum, session.userId,
        ]
      );

      const newLead = await query('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
      if (newLead[0]) {
        addedLeads.push(newLead[0]);
        existingUrls.add(linkedinUrl || '');
        existingCombos.add(`${contactName}|${companyName}`);
      }
    }

    if (addedLeads.length > 0) {
      await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [`last_batch_${session.userId}`, String(batchNum)]);
    }

    return NextResponse.json({
      leads: addedLeads,
      added: addedLeads.length,
      searched: people.length,
      message: addedLeads.length > 0
        ? `Added ${addedLeads.length} new architect leads from Apollo`
        : 'All found leads already exist in your database',
    });
  } catch (err) {
    console.error('Generate leads error:', err);
    return NextResponse.json({ error: 'Failed to generate leads', leads: [] }, { status: 500 });
  }
}
