import { initDb, query, queryOne, run } from './db'
import type { Quote, CeilingItem } from './quote-types'

function randomId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}

interface QuoteRow {
  id: string
  quote_number: string
  lead_id: number | null
  client_name: string
  project_name: string | null
  location: string | null
  date: string
  valid_until: string | null
  price_tier: string
  markup_percent: number
  installation_rate_per_sqft: number
  items_json: string
  notes: string | null
  grand_total: number
  user_id: number | null
  created_at: string
  updated_at: string
}

function rowToQuote(r: QuoteRow): Quote {
  return {
    id: r.id,
    quoteNumber: r.quote_number,
    leadId: r.lead_id,
    clientName: r.client_name,
    projectName: r.project_name ?? '',
    location: r.location ?? '',
    date: r.date,
    validUntil: r.valid_until ?? '',
    priceTier: r.price_tier as Quote['priceTier'],
    markupPercent: r.markup_percent,
    installationRatePerSqft: r.installation_rate_per_sqft,
    items: JSON.parse(r.items_json || '[]') as CeilingItem[],
    notes: r.notes ?? '',
    grandTotal: r.grand_total,
    userId: r.user_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function nextQuoteNumber(userId: number): Promise<string> {
  await initDb()
  const row = await queryOne<{ n: number }>(
    `SELECT COUNT(*) as n FROM quotes WHERE user_id = ?`, [userId]
  )
  const seq = (row?.n ?? 0) + 1
  return `Q${String(seq).padStart(4, '0')}`
}

export async function listQuotes(userId: number, search?: string): Promise<Quote[]> {
  await initDb()
  const like = search ? `%${search}%` : '%'
  const rows = await query<QuoteRow>(
    `SELECT * FROM quotes WHERE user_id = ? AND (client_name LIKE ? OR project_name LIKE ? OR quote_number LIKE ?) ORDER BY created_at DESC`,
    [userId, like, like, like]
  )
  return rows.map(rowToQuote)
}

export async function getQuoteById(id: string, userId: number): Promise<Quote | null> {
  await initDb()
  const row = await queryOne<QuoteRow>(
    `SELECT * FROM quotes WHERE id = ? AND user_id = ?`, [id, userId]
  )
  return row ? rowToQuote(row) : null
}

export async function saveQuote(quote: Omit<Quote, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt'> & { id?: string; quoteNumber?: string; userId: number }): Promise<Quote> {
  await initDb()
  const id = quote.id ?? randomId()
  const quoteNumber = quote.quoteNumber ?? await nextQuoteNumber(quote.userId)
  const now = new Date().toISOString()

  const existing = await queryOne<{ id: string }>(`SELECT id FROM quotes WHERE id = ?`, [id])

  if (existing) {
    await run(
      `UPDATE quotes SET client_name=?, project_name=?, location=?, date=?, valid_until=?,
       price_tier=?, markup_percent=?, installation_rate_per_sqft=?, items_json=?, notes=?,
       grand_total=?, lead_id=?, updated_at=? WHERE id=? AND user_id=?`,
      [quote.clientName, quote.projectName || null, quote.location || null,
       quote.date, quote.validUntil || null, quote.priceTier,
       quote.markupPercent, quote.installationRatePerSqft,
       JSON.stringify(quote.items), quote.notes || null,
       quote.grandTotal, quote.leadId ?? null, now, id, quote.userId]
    )
  } else {
    await run(
      `INSERT INTO quotes (id, quote_number, lead_id, client_name, project_name, location, date, valid_until,
       price_tier, markup_percent, installation_rate_per_sqft, items_json, notes, grand_total, user_id, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, quoteNumber, quote.leadId ?? null, quote.clientName,
       quote.projectName || null, quote.location || null, quote.date,
       quote.validUntil || null, quote.priceTier, quote.markupPercent,
       quote.installationRatePerSqft, JSON.stringify(quote.items),
       quote.notes || null, quote.grandTotal, quote.userId, now, now]
    )
  }

  const saved = await queryOne<QuoteRow>(`SELECT * FROM quotes WHERE id = ?`, [id])
  return rowToQuote(saved!)
}

export async function deleteQuote(id: string, userId: number): Promise<void> {
  await initDb()
  await run(`DELETE FROM quotes WHERE id = ? AND user_id = ?`, [id, userId])
}
