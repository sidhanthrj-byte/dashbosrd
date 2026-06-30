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
  // Founders / directors
  'Principal Architect', 'Founder', 'Co-Founder', 'Director',
  'Managing Director', 'Chief Architect', 'Partner', 'Design Director',
  'Associate Director', 'Creative Director',
  // Architects (all levels)
  'Architect', 'Senior Architect', 'Associate Architect', 'Project Architect',
  'Architectural Designer', 'Design Architect',
  // Interior design
  'Interior Designer', 'Senior Interior Designer', 'Lead Interior Designer',
  'Interior Design Lead', 'Space Designer', 'Concept Designer',
  // Project / design leads
  'Head of Projects', 'Project Manager', 'Design Manager', 'Design Lead',
  'Studio Manager', 'Design Consultant',
];

function tierFromTitle(title: string): string {
  const t = (title || '').toLowerCase();
  if (t.includes('principal') || t.includes('founder') || t.includes('director') || t.includes('managing') || t.includes('chief') || t.includes('partner')) return 'high';
  if (t.includes('senior') || t.includes('associate') || t.includes('head') || t.includes('lead')) return 'medium';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApolloPerson = Record<string, any>;

async function geocodeArea(area: string, city: string): Promise<{ lat: number; lon: number } | null> {
  const q = encodeURIComponent(`${area}, ${city}, India`);
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PongsCRM/1.0 (sidhanthrj@gmail.com)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// Name-pattern Overpass query — finds businesses whose name contains architecture/design keywords
// Much broader than tag-based search and works better for Indian cities
async function findFirmsNearby(lat: number, lon: number, radiusMeters = 3000): Promise<Array<{ name: string; address: string; phone: string | null }>> {
  const overpassQuery = `
    [out:json][timeout:20];
    (
      node["office"~"architect|interior_design|designer|design_studio",i](around:${radiusMeters},${lat},${lon});
      way["office"~"architect|interior_design|designer|design_studio",i](around:${radiusMeters},${lat},${lon});
      node["name"~"architect|interior|design studio|designers",i](around:${radiusMeters},${lat},${lon});
      way["name"~"architect|interior|design studio|designers",i](around:${radiusMeters},${lat},${lon});
    );
    out center tags;
  `;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const elements: OsmElement[] = data?.elements || [];
    const seen = new Set<string>();
    const results: Array<{ name: string; address: string; phone: string | null }> = [];
    for (const el of elements) {
      const name = el.tags?.name;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      results.push({
        name,
        address: [el.tags?.['addr:street'], el.tags?.['addr:suburb'], el.tags?.['addr:city']]
          .filter(Boolean).join(', ') || '',
        phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
      });
    }
    return results;
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
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.person || null;
  } catch {
    return null;
  }
}

function extractPhone(person: ApolloMatchPerson | null, fallback?: string | null): string | null {
  if (!person) return fallback || null;
  const phones = person.phone_numbers || [];
  const mobile = phones.find(p => p.type === 'mobile');
  const phone = mobile?.raw_number || phones[0]?.raw_number || null;
  if (phone) return phone;
  return person.organization?.primary_phone?.number
    || person.organization?.phone
    || person.sanitized_phone
    || fallback
    || null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count = 10, page = 1, area, replace_lead_id } = await req.json().catch(() => ({}));
  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });

  await initDb();

  const city = session.city;
  const userId = session.userId;
  const location = CITY_LOCATIONS[city] || city;

  // Archive FIRST, then build dedup sets excluding archived leads
  // (so the archived lead doesn't block its own replacement)
  if (replace_lead_id) {
    await run("UPDATE leads SET archived = 1, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
      [replace_lead_id, userId]);
  }

  const existing = await query<{ linkedin_url: string }>(
    'SELECT linkedin_url FROM leads WHERE user_id = ? AND linkedin_url IS NOT NULL AND (archived = 0 OR archived IS NULL)', [userId]
  );
  const existingUrls = new Set(existing.map(r => r.linkedin_url));

  const existingNames = await query<{ contact_name: string; company_name: string }>(
    'SELECT contact_name, company_name FROM leads WHERE user_id = ? AND (archived = 0 OR archived IS NULL)', [userId]
  );
  const existingCombos = new Set(existingNames.map(r => `${r.contact_name}|${r.company_name}`));

  let batchNum = 2;
  const batchSetting = await query<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?', [`last_batch_${userId}`]
  );
  if (batchSetting[0]) batchNum = parseInt(batchSetting[0].value) + 1;

  async function insertLead(
    companyName: string,
    contactName: string,
    contactTitle: string,
    phone: string | null,
    email: string | null,
    linkedinUrl: string | null,
    leadArea: string | null,
    notes: string | null,
  ) {
    if (linkedinUrl && existingUrls.has(linkedinUrl)) return null;
    if (existingCombos.has(`${contactName}|${companyName}`)) return null;

    const priority = tierFromTitle(contactTitle);
    const result = await run(
      `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, phone, phone_fetched, priority, project_type, batch_number, status, user_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
      [companyName, contactName, contactTitle, city, '', leadArea, linkedinUrl, email, phone, phone ? 1 : 0, priority, null, batchNum, userId, notes]
    );
    const rows = await query('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
    if (rows[0]) {
      existingUrls.add(linkedinUrl || '');
      existingCombos.add(`${contactName}|${companyName}`);
      return rows[0];
    }
    return null;
  }

  // ── AREA SEARCH ──────────────────────────────────────────────────────────────
  if (area) {
    const areaLower = area.toLowerCase();
    const addedLeads = [];

    // Step 1: OSM — try to find firm names near the geocoded area
    let osmFirms: Array<{ name: string; address: string; phone: string | null }> = [];
    try {
      const coords = await geocodeArea(area, city);
      if (coords) {
        osmFirms = await findFirmsNearby(coords.lat, coords.lon, 3000);
      }
    } catch { /* OSM is optional */ }

    // Process OSM firms
    for (const firm of osmFirms) {
      if (addedLeads.length >= count) break;
      const alreadyExists = [...existingCombos].some(c => c.endsWith(`|${firm.name}`));
      if (alreadyExists) continue;

      const person = await matchApolloContact(firm.name, apolloKey);
      const contactName = person?.name
        || `${person?.first_name || ''} ${person?.last_name || ''}`.trim()
        || `${firm.name} — Contact Needed`;
      const contactTitle = person?.title || 'Architect';
      const linkedinUrl = person?.linkedin_url || null;
      const email = person?.email || null;
      const phone = extractPhone(person, firm.phone);

      const lead = await insertLead(firm.name, contactName, contactTitle, phone, email, linkedinUrl, area,
        firm.address ? `Found via OpenStreetMap in ${area}: ${firm.address}` : `Found via OpenStreetMap in ${area}`);
      if (lead) addedLeads.push(lead);
    }

    // Step 2: Apollo city-level search — ALWAYS runs, fills remaining slots
    // Post-filter prefers area matches but falls back to all city results
    if (addedLeads.length < count) {
      const needed = count - addedLeads.length;
      try {
        const apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
          body: JSON.stringify({
            q_person_title_fuzzy_match: true,
            person_titles: TITLES,
            person_locations: [location],
            q_organization_keyword_tags: ['architecture', 'interior design', 'design studio'],
            per_page: 25,
            page,
          }),
        });

        if (apolloRes.ok) {
          const apolloData = await apolloRes.json();
          let people: ApolloPerson[] = apolloData?.people || [];

          // Prefer results where address/city mentions the area
          const areaMatches = people.filter((p: ApolloPerson) => {
            const orgAddr = (p.organization?.raw_address || '').toLowerCase();
            const orgCity = (p.organization?.city || '').toLowerCase();
            const personCity = (p.city || '').toLowerCase();
            return orgAddr.includes(areaLower) || orgCity.includes(areaLower) || personCity.includes(areaLower);
          });
          // Put area matches first; if none matched, use all city results
          people = areaMatches.length > 0
            ? [...areaMatches, ...people.filter(p => !areaMatches.includes(p))]
            : people;

          for (const person of people) {
            if (addedLeads.length >= count) break;
            const companyName = person.organization?.name || person.employment_history?.[0]?.organization_name || 'Unknown';
            const contactName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
            if (!contactName || contactName === 'Unknown' || companyName === 'Unknown') continue;

            const phones: Array<{ raw_number: string; type: string }> = person.phone_numbers || [];
            const phone = phones.find((p: { type: string }) => p.type === 'mobile')?.raw_number || phones[0]?.raw_number || null;
            const leadArea = areaMatches.includes(person) ? area : (person.city || area);

            const lead = await insertLead(
              companyName, contactName, person.title || 'Architect',
              phone, person.email || null, person.linkedin_url || null,
              leadArea,
              areaMatches.includes(person) ? null : `Generated for ${area} — city-wide result`
            );
            if (lead) addedLeads.push(lead);
          }

          // If still short, try next page automatically
          if (addedLeads.length < needed && people.length === 25) {
            const nextRes = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
              body: JSON.stringify({
                q_person_title_fuzzy_match: true,
                person_titles: TITLES,
                person_locations: [location],
                q_organization_keyword_tags: ['architecture', 'interior design', 'design studio'],
                per_page: 25,
                page: page + 1,
              }),
            });
            if (nextRes.ok) {
              const nextData = await nextRes.json();
              for (const person of (nextData?.people || [])) {
                if (addedLeads.length >= count) break;
                const companyName = person.organization?.name || person.employment_history?.[0]?.organization_name || 'Unknown';
                const contactName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
                if (!contactName || contactName === 'Unknown' || companyName === 'Unknown') continue;
                const phones: Array<{ raw_number: string; type: string }> = person.phone_numbers || [];
                const phone = phones.find((p: { type: string }) => p.type === 'mobile')?.raw_number || phones[0]?.raw_number || null;
                const lead = await insertLead(companyName, contactName, person.title || 'Architect', phone, person.email || null, person.linkedin_url || null, area, `Generated for ${area} — city-wide result`);
                if (lead) addedLeads.push(lead);
              }
            }
          }
        }
      } catch (err) {
        console.error('Apollo area fallback error:', err);
      }
    }

    if (addedLeads.length > 0) {
      await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [`last_batch_${userId}`, String(batchNum)]);
    }

    const osmCount = osmFirms.length;
    const message = addedLeads.length > 0
      ? osmCount > 0
        ? `Added ${addedLeads.length} leads — ${osmCount} firm${osmCount !== 1 ? 's' : ''} found in ${area} via map data, rest filled from ${city}`
        : `Added ${addedLeads.length} leads for ${area} (sourced from ${city} — map data for this area is limited)`
      : 'All found leads already exist in your database';

    return NextResponse.json({ leads: addedLeads, added: addedLeads.length, searched: osmCount, message });
  }

  // ── CITY-LEVEL APOLLO SEARCH (no area) ───────────────────────────────────────
  try {
    const res = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify({
        q_person_title_fuzzy_match: true,
        person_titles: TITLES,
        person_locations: [location],
        q_organization_keyword_tags: ['architecture', 'interior design', 'design studio'],
        // When replacing (count=1), fetch 15 candidates so we have room to skip dupes
        per_page: replace_lead_id ? 15 : Math.min(count, 25),
        page,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Apollo search error:', res.status, err);
      return NextResponse.json({ error: `Apollo error: ${res.status}`, leads: [] }, { status: 502 });
    }

    const data = await res.json();
    const people: ApolloPerson[] = data?.people || [];

    if (people.length === 0) {
      return NextResponse.json({ leads: [], message: 'No new leads found from Apollo for your city.' });
    }

    const addedLeads = [];
    for (const person of people) {
      if (replace_lead_id && addedLeads.length >= 1) break; // only need 1 replacement
      if (!replace_lead_id && addedLeads.length >= count) break;

      const companyName = person.organization?.name || person.employment_history?.[0]?.organization_name || 'Unknown';
      const contactName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
      if (!contactName || contactName === 'Unknown' || companyName === 'Unknown') continue;

      const phones: Array<{ raw_number: string; type: string }> = person.phone_numbers || [];
      const phone = phones.find((p: { type: string }) => p.type === 'mobile')?.raw_number || phones[0]?.raw_number || null;

      const lead = await insertLead(companyName, contactName, person.title || 'Architect', phone, person.email || null, person.linkedin_url || null, person.city || null, null);
      if (lead) addedLeads.push(lead);
    }

    if (addedLeads.length > 0) {
      await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [`last_batch_${userId}`, String(batchNum)]);
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
