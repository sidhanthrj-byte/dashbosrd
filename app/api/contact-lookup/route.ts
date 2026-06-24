import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { leadId, linkedinUrl, name, company } = await req.json();
  const apiKey = process.env.CONTACTOUT_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'ContactOut API key not configured' }, { status: 500 });
  }

  try {
    let result: { email?: string; phone?: string; phones?: string[]; emails?: string[] } = {};

    if (linkedinUrl) {
      const encoded = encodeURIComponent(linkedinUrl);
      const res = await fetch(
        `https://api.contactout.com/v1/people?linkedin=${encoded}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`:${apiKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        result.email = data?.profile?.email?.[0] || data?.email || null;
        result.phone = data?.profile?.phone?.[0] || data?.phone || null;
        result.phones = data?.profile?.phone || [];
        result.emails = data?.profile?.email || [];
      }
    }

    if (!result.phone && (name || company)) {
      const query = [name, company].filter(Boolean).join(' ');
      const res = await fetch(
        `https://api.contactout.com/v1/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`:${apiKey}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const person = data?.results?.[0];
        if (person) {
          result.email = result.email || person?.email?.[0] || null;
          result.phone = result.phone || person?.phone?.[0] || null;
          result.phones = person?.phone || result.phones || [];
          result.emails = person?.email || result.emails || [];
        }
      }
    }

    if (result.phone || result.email) {
      const db = getDb();
      if (leadId) {
        db.prepare(`
          UPDATE leads SET
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            phone_fetched = 1,
            updated_at = datetime('now')
          WHERE id = ?
        `).run(result.phone || null, result.email || null, leadId);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('ContactOut error:', err);
    return NextResponse.json({ error: 'Failed to fetch contact data', details: String(err) }, { status: 500 });
  }
}
