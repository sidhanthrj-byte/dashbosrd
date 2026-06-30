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
  'Managing Director', 'Chief Architect', 'Partner', 'Design Director',
  'Associate Director', 'Creative Director',
  'Architect', 'Senior Architect', 'Associate Architect', 'Project Architect',
  'Architectural Designer', 'Design Architect',
  'Interior Designer', 'Senior Interior Designer', 'Lead Interior Designer',
  'Interior Design Lead', 'Space Designer', 'Concept Designer',
  'Head of Projects', 'Project Manager', 'Design Manager', 'Design Lead',
  'Studio Manager', 'Design Consultant',
];

function tierFromTitle(title: string): string {
  const t = (title || '').toLowerCase();
  if (t.includes('principal') || t.includes('founder') || t.includes('director') || t.includes('managing') || t.includes('chief') || t.includes('partner')) return 'high';
  if (t.includes('senior') || t.includes('associate') || t.includes('head') || t.includes('lead')) return 'medium';
  return 'low';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPerson = Record<string, any>;

interface EnrichedPerson {
  id: string | null;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  company: string;
}

function extractPhone(person: AnyPerson): string | null {
  const phones = person.phone_numbers || [];
  const mobile = phones.find((p: AnyPerson) => p.type === 'mobile');
  const work = phones.find((p: AnyPerson) => p.type === 'work');
  const best = mobile || work || phones[0];
  if (best?.sanitized_number || best?.raw_number) return best.sanitized_number || best.raw_number;

  const orgPhone = person.organization?.primary_phone;
  if (orgPhone) return orgPhone.sanitized_number || orgPhone.number || null;
  return person.organization?.phone || person.sanitized_phone || null;
}

// Enrich a single Apollo candidate by calling people/match with their ID
async function enrichByApolloId(apolloId: string, apolloKey: string): Promise<AnyPerson | null> {
  try {
    const res = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify({ id: apolloId, reveal_personal_emails: true }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return d?.person || null;
  } catch {
    return null;
  }
}

// Run promises with a concurrency limit
async function pMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 4
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

function normalizePerson(raw: AnyPerson): EnrichedPerson {
  const company = raw.organization?.name || raw.employment_history?.[0]?.organization_name || '';
  const name = raw.name || `${raw.first_name || ''} ${raw.last_name || ''}`.trim();
  return {
    id: raw.id || null,
    name,
    title: raw.title || 'Architect',
    email: raw.email || null,
    phone: extractPhone(raw),
    linkedin_url: raw.linkedin_url || null,
    company,
  };
}

async function apolloSearch(
  apolloKey: string,
  location: string,
  page: number,
  perPage: number,
  extra?: Record<string, unknown>
): Promise<AnyPerson[]> {
  const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
    body: JSON.stringify({
      person_titles: TITLES,
      person_locations: [location],
      q_organization_keyword_tags: ['architecture', 'interior design', 'design studio'],
      per_page: perPage,
      page,
      ...extra,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Apollo ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data?.people || [];
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count = 10, page = 1, area, replace_lead_id } = await req.json().catch(() => ({}));
  const apolloKeyRaw = process.env.APOLLO_API_KEY;
  if (!apolloKeyRaw) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });
  const apolloKey: string = apolloKeyRaw;

  await initDb();

  const city = session.city;
  const userId = session.userId;
  const location = CITY_LOCATIONS[city] || `${city}, India`;

  // Archive first so the replacement doesn't get blocked by dedup
  if (replace_lead_id) {
    await run("UPDATE leads SET archived = 1, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
      [replace_lead_id, userId]);
  }

  // Build dedup sets (exclude archived)
  const existing = await query<{ linkedin_url: string; apollo_id: string }>(
    'SELECT linkedin_url, apollo_id FROM leads WHERE user_id = ? AND linkedin_url IS NOT NULL AND (archived = 0 OR archived IS NULL)', [userId]
  );
  const existingLinkedins = new Set(existing.map(r => r.linkedin_url).filter(Boolean));
  const existingApolloIds = new Set(existing.map(r => r.apollo_id).filter(Boolean));

  const existingNames = await query<{ contact_name: string; company_name: string }>(
    'SELECT contact_name, company_name FROM leads WHERE user_id = ? AND (archived = 0 OR archived IS NULL)', [userId]
  );
  const existingCombos = new Set(existingNames.map(r => `${r.contact_name}|${r.company_name}`));

  let batchNum = 2;
  const batchSetting = await query<{ value: string }>('SELECT value FROM settings WHERE key = ?', [`last_batch_${userId}`]);
  if (batchSetting[0]) batchNum = parseInt(batchSetting[0].value) + 1;

  async function insertLead(
    companyName: string, contactName: string, contactTitle: string,
    phone: string | null, email: string | null,
    linkedinUrl: string | null, apolloId: string | null,
    leadArea: string | null, notes: string | null,
  ) {
    if (linkedinUrl && existingLinkedins.has(linkedinUrl)) return null;
    if (apolloId && existingApolloIds.has(apolloId)) return null;
    if (existingCombos.has(`${contactName}|${companyName}`)) return null;

    const priority = tierFromTitle(contactTitle);
    const result = await run(
      `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, phone, phone_fetched, priority, project_type, batch_number, status, user_id, notes, apollo_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
      [companyName, contactName, contactTitle, city, '', leadArea,
       linkedinUrl, email, phone, phone ? 1 : 0, priority, null, batchNum, userId, notes, apolloId]
    );
    const rows = await query('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
    if (rows[0]) {
      if (linkedinUrl) existingLinkedins.add(linkedinUrl);
      if (apolloId) existingApolloIds.add(apolloId);
      existingCombos.add(`${contactName}|${companyName}`);
      return rows[0];
    }
    return null;
  }

  // Enrich Apollo search results: api_search → people/match per ID → real name + phone
  async function fetchAndEnrichBatch(candidates: AnyPerson[], needed: number): Promise<EnrichedPerson[]> {
    // Filter out known dupes before making API calls
    const fresh = candidates.filter(c => {
      if (c.id && existingApolloIds.has(c.id)) return false;
      return true;
    }).slice(0, Math.min(needed * 2, 20));

    // Enrich concurrently (4 at a time) to get real name + phone
    const enriched = await pMap(fresh, async (candidate) => {
      const cid = candidate.id as string | undefined;
      if (!cid) return normalizePerson(candidate);
      const full = await enrichByApolloId(cid, apolloKey);
      if (full) return normalizePerson(full);
      // Fallback: use search result data (obfuscated name but has company + title)
      return normalizePerson(candidate);
    }, 4);

    return enriched.filter(p => p.name && p.company);
  }

  const addedLeads: AnyPerson[] = [];

  // ── AREA SEARCH ──────────────────────────────────────────────────────────────
  if (area) {
    const areaLower = area.toLowerCase();

    // OSM geocode + Overpass (best effort — often returns 0 for India)
    let osmFirmNames: string[] = [];
    try {
      const q = encodeURIComponent(`${area}, ${city}, India`);
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
        headers: { 'User-Agent': 'PongsCRM/1.0 (sidhanthrj@gmail.com)' },
        signal: AbortSignal.timeout(5000),
      });
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (nomData[0]) {
          const { lat, lon } = nomData[0];
          const overpassQ = `[out:json][timeout:15];(node["office"~"architect|interior_design",i](around:3000,${lat},${lon});way["office"~"architect|interior_design",i](around:3000,${lat},${lon}););out center tags;`;
          const opRes = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(overpassQ)}`,
            signal: AbortSignal.timeout(10000),
          });
          if (opRes.ok) {
            const opData = await opRes.json();
            osmFirmNames = (opData?.elements || [])
              .map((e: AnyPerson) => e.tags?.name).filter(Boolean).slice(0, 5);
          }
        }
      }
    } catch { /* OSM optional */ }

    // Use OSM firm names to seed Apollo searches
    for (const firmName of osmFirmNames) {
      if (addedLeads.length >= count) break;
      const firmRes = await fetch('https://api.apollo.io/api/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
        body: JSON.stringify({ organization_name: firmName, person_titles: TITLES, reveal_personal_emails: true }),
        signal: AbortSignal.timeout(10000),
      });
      if (firmRes.ok) {
        const fd = await firmRes.json();
        const p = fd?.person;
        if (p) {
          const person = normalizePerson(p);
          if (person.name && person.company) {
            const lead = await insertLead(person.company, person.name, person.title, person.phone, person.email, person.linkedin_url, person.id, area,
              `Found via map data in ${area}`);
            if (lead) addedLeads.push(lead);
          }
        }
      }
    }

    // Apollo city-level search — always runs, filters to area preference
    if (addedLeads.length < count) {
      const needed = count - addedLeads.length;
      try {
        const candidates = await apolloSearch(apolloKey, location, page, Math.min(needed * 3, 25));
        const enriched = await fetchAndEnrichBatch(candidates, needed);

        // Prefer area matches, fall back to all city
        const areaMatches = enriched.filter(p => {
          const n = (p.name + p.company).toLowerCase();
          return n.includes(areaLower);
        });
        const ordered = areaMatches.length > 0
          ? [...areaMatches, ...enriched.filter(p => !areaMatches.includes(p))]
          : enriched;

        for (const person of ordered) {
          if (addedLeads.length >= count) break;
          const leadArea = areaMatches.includes(person) ? area : `${city} (${area} search)`;
          const lead = await insertLead(person.company, person.name, person.title, person.phone, person.email, person.linkedin_url, person.id, leadArea, null);
          if (lead) addedLeads.push(lead);
        }
      } catch (err) {
        console.error('Apollo area search error:', err);
      }
    }

    if (addedLeads.length > 0) {
      await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [`last_batch_${userId}`, String(batchNum)]);
    }

    return NextResponse.json({
      leads: addedLeads,
      added: addedLeads.length,
      message: addedLeads.length > 0
        ? `Added ${addedLeads.length} leads for ${area}`
        : 'No new leads found — all results already in your database',
    });
  }

  // ── CITY-LEVEL APOLLO SEARCH ─────────────────────────────────────────────────
  try {
    const perPage = replace_lead_id ? 20 : Math.min(count * 2, 25);
    const candidates = await apolloSearch(apolloKey, location, page, perPage);

    if (candidates.length === 0) {
      return NextResponse.json({ leads: [], message: 'No leads found from Apollo for your city. Try a different page.' });
    }

    const needed = replace_lead_id ? 1 : count;
    const enriched = await fetchAndEnrichBatch(candidates, needed);

    for (const person of enriched) {
      if (addedLeads.length >= needed) break;
      if (!person.name || !person.company) continue;
      const lead = await insertLead(person.company, person.name, person.title, person.phone, person.email, person.linkedin_url, person.id, null, null);
      if (lead) addedLeads.push(lead);
    }

    // If still short (lots of dupes), try next page
    if (addedLeads.length < needed && enriched.length >= 20) {
      try {
        const moreCandidates = await apolloSearch(apolloKey, location, page + 1, 15);
        const moreEnriched = await fetchAndEnrichBatch(moreCandidates, needed - addedLeads.length);
        for (const person of moreEnriched) {
          if (addedLeads.length >= needed) break;
          const lead = await insertLead(person.company, person.name, person.title, person.phone, person.email, person.linkedin_url, person.id, null, null);
          if (lead) addedLeads.push(lead);
        }
      } catch { /* ignore secondary page errors */ }
    }

    if (addedLeads.length > 0) {
      await run('INSERT OR REPLACE INTO settings VALUES (?, ?)', [`last_batch_${userId}`, String(batchNum)]);
    }

    return NextResponse.json({
      leads: addedLeads,
      added: addedLeads.length,
      searched: candidates.length,
      message: addedLeads.length > 0
        ? `Added ${addedLeads.length} architect leads from Apollo${addedLeads.some(l => l.phone) ? ' — with phone numbers' : ''}`
        : 'All found leads already exist in your database. Try generating more.',
    });
  } catch (err) {
    console.error('Generate leads error:', err);
    return NextResponse.json({ error: String(err), leads: [] }, { status: 500 });
  }
}
