import { NextRequest, NextResponse } from 'next/server';
import { initDb, run } from '@/lib/db';
import { getSession } from '@/lib/auth';

function cleanIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  // Strip leading 91 or 0
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

  // Priority 1: <a href="tel:..."> — most reliable
  const telLinks = html.matchAll(/href=["']tel:\+?(\d[\d\s\-().]{7,14}\d)["']/gi);
  for (const m of telLinks) add(m[1]);

  // Priority 2: +91 followed by 10 digits (international format)
  const intl = html.matchAll(/\+91[-.\s]?([6789]\d{2}[-.\s]?\d{3}[-.\s]?\d{4})/g);
  for (const m of intl) add(`91${m[1].replace(/\D/g, '')}`);

  // Priority 3: Numbers in phone-context keywords
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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadId, linkedinUrl, name, company, email: knownEmail } = await req.json();
  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) return NextResponse.json({ error: 'Apollo API key not configured' }, { status: 500 });

  try {
    // ── Step 1: Apollo people/match ────────────────────────────────────────────
    const nameParts = (name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const apolloBody: Record<string, unknown> = {
      reveal_personal_emails: true,
      reveal_phone_number: true,
    };
    if (firstName) apolloBody.first_name = firstName;
    if (lastName) apolloBody.last_name = lastName;
    if (company) apolloBody.organization_name = company;
    if (linkedinUrl) apolloBody.linkedin_url = linkedinUrl;
    if (knownEmail) apolloBody.email = knownEmail;

    const apolloRes = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apolloKey },
      body: JSON.stringify(apolloBody),
    });

    type PhoneEntry = { raw_number: string; sanitized_number?: string; type: string };
    type ApolloOrg = { website_url?: string; primary_phone?: { number: string }; phone?: string };
    type ApolloPerson = {
      name?: string; title?: string; email?: string; linkedin_url?: string;
      phone_numbers?: PhoneEntry[]; sanitized_phone?: string;
      organization?: ApolloOrg;
      contact_emails?: Array<{ email: string }>;
    };

    let person: ApolloPerson | null = null;
    if (apolloRes.ok) {
      const d = await apolloRes.json();
      person = d?.person || null;
    }

    // Extract phone from Apollo
    const apolloPhones: PhoneEntry[] = person?.phone_numbers || [];
    const mobile = apolloPhones.find(p => p.type === 'mobile');
    const work = apolloPhones.find(p => p.type === 'work');
    const bestApollo = mobile || work || apolloPhones[0];
    let phone: string | null = bestApollo?.raw_number || bestApollo?.sanitized_number || null;

    // Check org phone from Apollo
    if (!phone && person?.organization) {
      phone = person.organization.primary_phone?.number
        || person.organization.phone
        || person?.sanitized_phone
        || null;
    }

    let phoneSource = phone ? 'apollo' : null;

    // Extract email from Apollo
    const emailSet = new Set<string>();
    if (person?.email) emailSet.add(person.email);
    (person?.contact_emails || []).forEach(e => { if (e.email) emailSet.add(e.email); });
    const email = [...emailSet][0] || null;

    // ── Step 2: Website scraping if Apollo has no phone ────────────────────────
    if (!phone) {
      // Try the website from Apollo's org data first
      const websiteUrl = person?.organization?.website_url || null;
      if (websiteUrl) {
        const scraped = await scrapePhoneFromWebsite(websiteUrl);
        if (scraped) { phone = scraped; phoneSource = 'website'; }
      }

      // If still nothing, try guessing a website from the company name
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

    return NextResponse.json({
      found: !!(phone || email),
      phone,
      email,
      source: phoneSource,
      allPhones: apolloPhones.map(p => ({ number: p.raw_number || p.sanitized_number, type: p.type })),
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
