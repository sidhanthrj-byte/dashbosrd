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

interface OsmElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
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

// Step 1: Geocode area name → lat/lng using Nominatim (free, no key)
async function geocodeArea(area: string, city: string): Promise<{ lat: number; lon: number } | null> {
  const q = encodeURIComponent(`${area}, ${city}, India`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'PongsCRM/1.0 (sidhanthrj@gmail.com)' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Step 2: Find architect/interior design firms near coordinates using Overpass API (free, no key)
async function findFirmsNearby(lat: number, lon: number, radiusMeters = 2500): Promise<Array<{ name: string; address: string; phone: string | null }>> {
  const overpassQuery = `
    [out:json][timeout:20];
    (
      node["office"="architect"](around:${radiusMeters},${lat},${lon});
      node["office"="interior_design"](around:${radiusMeters},${lat},${lon});
      node["craft"="interior_designer"](around:${radiusMeters},${lat},${lon});
      node["office"="designer"](around:${radiusMeters},${lat},${lon});
      way["office"="architect"](around:${radiusMeters},${lat},${lon});
      way["office"="interior_design"](around:${radiusMeters},${lat},${lon});
    );
    out center tags;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });
    if (!res.ok) return [];
    const data = await res.json();
    const elements: OsmElement[] = data?.elements || [];

    return elements
      .filter(el => el.tags?.name)
      .map(el => ({
        name: el.tags!.name!,
        address: [el.tags?.['addr:street'], el.tags?.['addr:suburb'], el.tags?.['addr:city']]
          .filter(Boolean).join(', ') || '',
        phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      }));
  } catch {
    return [];
  }
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

  // ── OPENSTREETMAP PATH (free, no key) when area specified ─────────────────
  if (area) {
    try {
      const coords = await geocodeArea(area, city);

      if (!coords) {
        return NextResponse.json({
          leads: [],
          message: `Could not locate "${area}" in ${city}. Check the spelling and try again.`,
        });
      }

      const firms = await findFirmsNearby(coords.lat, coords.lon, 3000);

      if (firms.length === 0) {
        // OSM has sparse coverage — fall back to Apollo city search and note it
        return NextResponse.json({
          leads: [],
          message: `No firms found on OpenStreetMap for ${area}. Try searching city-wide (leave area blank) — coverage in Indian neighbourhoods is limited.`,
        });
      }

      const addedLeads = [];
      const limit = Math.min(count, firms.length);

      for (let i = 0; i < limit; i++) {
        const firm = firms[i];
        const companyName = firm.name;

        const alreadyExists = [...existingCombos].some(c => c.endsWith(`|${companyName}`));
        if (alreadyExists) continue;

        // Try Apollo to enrich with a contact person
        const person = await matchApolloContact(companyName, apolloKey);

        let contactName = person?.name
          || `${person?.first_name || ''} ${person?.last_name || ''}`.trim()
          || null;
        const contactTitle = person?.title || 'Architect';
        const linkedinUrl = person?.linkedin_url || null;
        const email = person?.email || null;

        const phones = person?.phone_numbers || [];
        const mobile = phones.find(p => p.type === 'mobile');
        let phone: string | null = mobile?.raw_number || phones[0]?.raw_number || null;
        if (!phone) {
          phone = firm.phone
            || person?.organization?.primary_phone?.number
            || person?.organization?.phone
            || person?.sanitized_phone
            || null;
        }

        if (!contactName) contactName = `${companyName} — Contact Needed`;

        if (linkedinUrl && existingUrls.has(linkedinUrl)) continue;
        if (existingCombos.has(`${contactName}|${companyName}`)) continue;

        const priority = tierFromTitle(contactTitle);

        const result = await run(
          `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, phone, phone_fetched, priority, project_type, batch_number, status, user_id, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
          [
            companyName, contactName, contactTitle,
            city, '', area,
            linkedinUrl, email, phone, phone ? 1 : 0,
            priority, null,
            batchNum, session.userId,
            firm.address ? `Found via OpenStreetMap: ${firm.address}` : 'Found via OpenStreetMap',
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
        searched: firms.length,
        source: 'openstreetmap',
        message: addedLeads.length > 0
          ? `Added ${addedLeads.length} leads from ${firms.length} firms found in ${area} via OpenStreetMap`
          : `Found ${firms.length} firms in ${area} but all already exist in your database`,
      });
    } catch (err) {
      console.error('OSM area search error:', err);
      return NextResponse.json({ error: 'Area search failed', leads: [] }, { status: 500 });
    }
  }

  // ── APOLLO PATH (city-level, no area) ─────────────────────────────────────
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
