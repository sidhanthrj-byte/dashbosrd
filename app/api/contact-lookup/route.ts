import { NextRequest, NextResponse } from 'next/server';
import { initDb, run } from '@/lib/db';
import { getSession } from '@/lib/auth';

function cleanIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  const num = digits.startsWith('91') && digits.length >= 12
    ? digits.slice(2)
    : digits.startsWith('0') && digits.length === 11
    ? digits.slice(1)
    : digits;
  if (num.length === 10 && /^[6789]/.test(num)) return `+91${num}`;
  return null;
}

function extractPhonesFromHtml(html: string): string[] {
  const results: string[] = [];
  const seen = new Set<string>();

  function add(raw: string) {
    const p = cleanIndianPhone(raw);
    if (p && !seen.has(p)) { seen.add(p); results.push(p); }
  }

  const telLinks = html.matchAll(/href=["']tel:\+?(\d[\d\s\-().]{7,14}\d)["']/gi);
  for (const m of telLinks) add(m[1]);

  const intl = html.matchAll(/\+91[-.\s]?([6789]\d{2}[-.\s]?\d{3}[-.\s]?\d{4})/g);
  for (const m of intl) add(`91${m[1].replace(/\D/g, '')}`);

  const ctx = html.matchAll(/(?:phone|mobile|mob|call us|contact|whatsapp|tel)[\s:.-]{0,5}(\+?91[-.\s]?)?([6789]\d{2}[-.\s]?\d{3}[-.\s]?\d{4})/gi);
  for (const m of ctx) add(`${m[1] || ''}${m[2]}`);

  return results;
}

async function scrapePhoneFromWebsite(baseUrl: string): Promise<string | null> {
  if (!baseUrl) return null;
  try {
    if (!baseUrl.startsWith('http')) baseUrl = `https://${baseUrl}`;
    const base = baseUrl.replace(/\/$/, '');
    const pages = [base, `${base}/contact`, `${base}/contact-us`, `${base}/about`];

    for (const url of pages) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-IN,en;q=0.9',
          },
          signal: AbortSignal.timeout(6000),
          redirect: 'follow',
        });
        if (!res.ok) continue;
        const html = await res.text();
        const phones = extractPhonesFromHtml(html);
        if (phones.length > 0) return phones[0];
      } catch {
        continue;
      }
    }
  } catch { /* ignore */ }
  return null;
}

type PhoneEntry = { raw_number: string; sanitized_number?: string; type: string };
type ApolloOrg = { name?: string; website_url?: string; primary_phone?: { number: string; sanitized_number?: string }; phone?: string };
type ApolloPerson = {
  id?: string; name?: string; title?: string; email?: string; linkedin_url?: string;
  phone_numbers?: PhoneEntry[]; sanitized_phone?: string;
  organization?: ApolloOrg;
  contact_emails?: Array<{ email: string }>;
};

async function apolloSearch(params: Record<string, unknown>, apolloKey: string): Promise<ApolloPerson[]> {
  const res = await fetch('https://api.apollo.io/api/v1/mixed_people/api_search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
    body: JSON.stringify({ per_page: 5, ...params }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const d = await res.json();
  return d?.people || [];
}

async function apolloMatchById(id: string, apolloKey: string): Promise<ApolloPerson | null> {
  const res = await fetch('https://api.apollo.io/api/v1/people/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
    body: JSON.stringify({ id, reveal_personal_emails: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return d?.person || null;
}

async function apolloMatchByLinkedin(linkedinUrl: string, apolloKey: string): Promise<ApolloPerson | null> {
  const res = await fetch('https://api.apollo.io/api/v1/people/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
    body: JSON.stringify({ linkedin_url: linkedinUrl, reveal_personal_emails: true }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const d = await res.json();
  return d?.person || null;
}

function extractPhoneFromPerson(person: ApolloPerson): string | null {
  // Direct phone numbers returned (e.g. from direct search results)
  const phones = person.phone_numbers || [];
  const mobile = phones.find(p => p.type === 'mobile');
  const work = phones.find(p => p.type === 'work');
  const best = mobile || work || phones[0];
  if (best?.sanitized_number || best?.raw_number) {
    return best.sanitized_number || best.raw_number;
  }
  // Org primary phone (usually the main contact number — often a mobile for Indian firms)
  const orgPhone = person.organization?.primary_phone;
  if (orgPhone) {
    return orgPhone.sanitized_number || orgPhone.number || null;
  }
  return person.organization?.phone || person.sanitized_phone || null;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId, linkedinUrl, name, company, email: knownEmail } = await req.json();
  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });

  try {
    let person: ApolloPerson | null = null;

    // ── Step 1: LinkedIn URL match (most accurate) ─────────────────────────────
    if (linkedinUrl) {
      person = await apolloMatchByLinkedin(linkedinUrl, apolloKey);
    }

    // ── Step 2: api_search to get Apollo ID, then people/match with ID ─────────
    if (!person) {
      const nameParts = (name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Try name + company search
      const searchParams: Record<string, unknown> = {};
      if (firstName) searchParams.first_name = firstName;
      if (lastName) searchParams.last_name = lastName;
      if (company) searchParams.q_organization_name = company;
      if (knownEmail) searchParams.email = knownEmail;

      if (Object.keys(searchParams).length > 0) {
        const searchResults = await apolloSearch(searchParams, apolloKey);

        // Find the best match
        const nameLower = (name || '').toLowerCase();
        const companyLower = (company || '').toLowerCase();
        const best = searchResults.find(p => {
          const pName = (p.name || '').toLowerCase();
          const pOrg = (p.organization?.name || '').toLowerCase();
          const nameMatch = nameLower && (pName.includes(nameLower.split(' ')[0]) || nameLower.split(' ')[0].includes(pName.split(' ')[0]));
          const orgMatch = companyLower && (pOrg.includes(companyLower.slice(0, 8)) || companyLower.includes(pOrg.slice(0, 8)));
          return nameMatch || orgMatch;
        }) || searchResults[0];

        // If we got an Apollo ID from search, do people/match with that ID for full data
        if (best?.id) {
          person = await apolloMatchById(best.id, apolloKey);
          // Fall back to search result if match failed
          if (!person) person = best;
        } else if (best) {
          person = best;
        }
      }
    }

    // ── Step 3: fallback — people/match by name+company (no ID) ───────────────
    if (!person && (name || company)) {
      const nameParts = (name || '').trim().split(' ');
      const matchBody: Record<string, unknown> = { reveal_personal_emails: true };
      if (nameParts[0]) matchBody.first_name = nameParts[0];
      if (nameParts.slice(1).join(' ')) matchBody.last_name = nameParts.slice(1).join(' ');
      if (company) matchBody.organization_name = company;
      if (knownEmail) matchBody.email = knownEmail;

      const matchRes = await fetch('https://api.apollo.io/api/v1/people/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
        body: JSON.stringify(matchBody),
        signal: AbortSignal.timeout(10000),
      });
      if (matchRes.ok) {
        const d = await matchRes.json();
        person = d?.person || null;
      }
    }

    let phone = extractPhoneFromPerson(person || {});
    let phoneSource = phone ? 'apollo' : null;

    // Extract emails
    const emailSet = new Set<string>();
    if (person?.email) emailSet.add(person.email);
    (person?.contact_emails || []).forEach(e => { if (e.email) emailSet.add(e.email); });
    const email = [...emailSet][0] || null;

    // ── Step 4: Website scraping fallback ─────────────────────────────────────
    if (!phone) {
      const websiteUrl = person?.organization?.website_url || null;
      if (websiteUrl) {
        const scraped = await scrapePhoneFromWebsite(websiteUrl);
        if (scraped) { phone = scraped; phoneSource = 'website'; }
      }

      if (!phone && company) {
        const slug = company
          .toLowerCase()
          .replace(/\b(architects?|designs?|studios?|interiors?|pvt|ltd|llp|and|&)\b/g, '')
          .replace(/[^a-z0-9]+/g, '')
          .slice(0, 25);
        if (slug.length >= 4) {
          const guessedUrl = `https://www.${slug}.com`;
          const scraped = await scrapePhoneFromWebsite(guessedUrl);
          if (scraped) { phone = scraped; phoneSource = 'website'; }
        }
      }
    }

    // ── Persist to DB ──────────────────────────────────────────────────────────
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
      `, [phone, email, person?.linkedin_url || null, leadId, session.userId]);
    }

    const apolloPhones: PhoneEntry[] = person?.phone_numbers || [];
    return NextResponse.json({
      found: !!(phone || email),
      phone,
      email,
      source: phoneSource,
      allPhones: apolloPhones.map(p => ({ number: p.sanitized_number || p.raw_number, type: p.type })),
      allEmails: [...emailSet],
      name: person?.name,
      title: person?.title,
      linkedin: person?.linkedin_url,
    });
  } catch (err) {
    console.error('Contact lookup error:', err);
    return NextResponse.json({ error: 'Contact lookup failed', phone: null, email: null, found: false }, { status: 500 });
  }
}
