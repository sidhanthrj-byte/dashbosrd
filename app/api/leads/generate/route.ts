import { NextRequest, NextResponse } from 'next/server';
import { initDb, query, run } from '@/lib/db';
import { getSession } from '@/lib/auth';

const CITY_LOCATIONS: Record<string, string> = {
  Mumbai:    'Mumbai, Maharashtra, India',
  Bangalore: 'Bangalore, Karnataka, India',
  Chennai:   'Chennai, Tamil Nadu, India',
  Pune:      'Pune, Maharashtra, India',
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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { count = 10, page = 1, area, replace_lead_id } = await req.json().catch(() => ({}));
  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });

  await initDb();

  // Archive the replaced lead before generating a new one
  if (replace_lead_id) {
    await run("UPDATE leads SET archived = 1, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
      [replace_lead_id, session.userId]);
  }

  const city = session.city;
  const location = CITY_LOCATIONS[city] || city;

  try {
    // Apollo people search — always search at city level (area filter is applied post-fetch)
    const searchBody: Record<string, unknown> = {
      q_person_title_fuzzy_match: true,
      person_titles: TITLES,
      person_locations: [location],
      q_organization_keyword_tags: ['architecture', 'interior design', 'design studio'],
      per_page: Math.min(count * (area ? 3 : 1), 25), // fetch more when area-filtering
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
    let people = data?.people || [];

    // Post-fetch area filter: Apollo doesn't support neighbourhood-level location,
    // so we filter results by person.city or organization address matching the area
    if (area && people.length > 0) {
      const areaLower = area.toLowerCase();
      const filtered = people.filter((p: Record<string, unknown>) => {
        const personCity = ((p.city as string) || '').toLowerCase();
        const orgCity = ((p.organization as Record<string, unknown>)?.city as string || '').toLowerCase();
        const orgAddr = ((p.organization as Record<string, unknown>)?.raw_address as string || '').toLowerCase();
        return personCity.includes(areaLower) || orgCity.includes(areaLower) || orgAddr.includes(areaLower);
      });
      // Use filtered if it has results; otherwise fall back to unfiltered (area may not match Apollo data)
      if (filtered.length > 0) people = filtered;
    }

    if (people.length === 0) {
      return NextResponse.json({ leads: [], message: area ? `No leads found in ${area} from Apollo — try searching the whole city.` : 'No new leads found from Apollo for your city.' });
    }

    // Get existing linkedin URLs to avoid duplicates
    const existing = await query<{ linkedin_url: string }>(
      'SELECT linkedin_url FROM leads WHERE user_id = ? AND linkedin_url IS NOT NULL', [session.userId]
    );
    const existingUrls = new Set(existing.map(r => r.linkedin_url));

    // Also get existing company+name combos to avoid duplicates
    const existingNames = await query<{ contact_name: string; company_name: string }>(
      'SELECT contact_name, company_name FROM leads WHERE user_id = ?', [session.userId]
    );
    const existingCombos = new Set(existingNames.map(r => `${r.contact_name}|${r.company_name}`));

    const addedLeads = [];
    let batchNum = 2;
    const batchSetting = await query<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?', [`last_batch_${session.userId}`]
    );
    if (batchSetting[0]) batchNum = parseInt(batchSetting[0].value) + 1;

    for (const person of people) {
      const linkedinUrl = person.linkedin_url || null;
      const companyName = person.organization?.name || person.employment_history?.[0]?.organization_name || 'Unknown';
      const contactName = person.name || `${person.first_name || ''} ${person.last_name || ''}`.trim();
      const contactTitle = person.title || 'Architect';

      // Skip duplicates
      if (linkedinUrl && existingUrls.has(linkedinUrl)) continue;
      if (existingCombos.has(`${contactName}|${companyName}`)) continue;
      if (!contactName || contactName === 'Unknown' || companyName === 'Unknown') continue;

      const email = person.email || null;
      const phones: Array<{ raw_number: string; type: string }> = person.phone_numbers || [];
      const phone = phones.find(p => p.type === 'mobile')?.raw_number || phones[0]?.raw_number || null;
      const priority = tierFromTitle(contactTitle);
      const projectType = person.organization?.keywords?.slice(0, 2).join(' & ') || null;
      const area = person.city || null;

      const result = await run(
        `INSERT INTO leads (company_name, contact_name, contact_title, city, state, area, linkedin_url, email, phone, phone_fetched, priority, project_type, batch_number, status, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
        [
          companyName, contactName, contactTitle,
          city, '', area,
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

    // Update batch counter
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
