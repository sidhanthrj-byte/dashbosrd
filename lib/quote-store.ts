import { query, queryOne, run, initDb } from './db'
import type { Quote } from './quote-types'
import { calculateQuote } from './quote-calculations'

function rowToQuote(row: Record<string, unknown>): Quote {
  return {
    id: row.id as string,
    quoteNumber: row.quote_number as string,
    leadId: row.lead_id as number | null,
    clientName: row.client_name as string,
    projectName: (row.project_name as string) || '',
    location: (row.location as string) || '',
    date: row.date as string,
    validUntil: (row.valid_until as string) || '',
    priceTier: row.price_tier as Quote['priceTier'],
    markupPercent: (row.markup_percent as number) || 0,
    items: JSON.parse((row.items_json as string) || '[]'),
    installationRatePerSqft: (row.installation_rate_per_sqft as number) || 60,
    notes: (row.notes as string) || '',
    grandTotal: (row.grand_total as number) || 0,
    userId: row.user_id as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function listQuotes(userId: number, search?: string): Promise<Quote[]> {
  await initDb()
  let sql = 'SELECT * FROM quotes WHERE user_id = ? '
  const params: (string | number)[] = [userId]
  if (search) {
    sql += 'AND (client_name LIKE ? OR project_name LIKE ? OR quote_number LIKE ? OR location LIKE ?) '
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
  }
  sql += 'ORDER BY created_at DESC'
  const rows = await query<Record<string, unknown>>(sql, params)
  return rows.map(rowToQuote)
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  await initDb()
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM quotes WHERE id = ?', [id])
  return row ? rowToQuote(row) : null
}

export async function saveQuote(quote: Quote): Promise<void> {
  await initDb()
  let grandTotal = 0
  try { grandTotal = calculateQuote(quote).grandTotal } catch {}
  
  const existing = await queryOne('SELECT id FROM quotes WHERE id = ?', [quote.id])
  if (existing) {
    await run(
      `UPDATE quotes SET quote_number=?, lead_id=?, client_name=?, project_name=?, location=?, date=?, valid_until=?, price_tier=?, markup_percent=?, installation_rate_per_sqft=?, items_json=?, notes=?, grand_total=?, updated_at=datetime('now') WHERE id=?`,
      [quote.quoteNumber, quote.leadId ?? null, quote.clientName, quote.projectName, quote.location, quote.date, quote.validUntil, quote.priceTier, quote.markupPercent, quote.installationRatePerSqft, JSON.stringify(quote.items), quote.notes, grandTotal, quote.id]
    )
  } else {
    await run(
      `INSERT INTO quotes (id, quote_number, lead_id, client_name, project_name, location, date, valid_until, price_tier, markup_percent, installation_rate_per_sqft, items_json, notes, grand_total, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [quote.id, quote.quoteNumber, quote.leadId ?? null, quote.clientName, quote.projectName, quote.location, quote.date, quote.validUntil, quote.priceTier, quote.markupPercent, quote.installationRatePerSqft, JSON.stringify(quote.items), quote.notes, grandTotal, quote.userId]
    )
  }
}

export async function deleteQuote(id: string): Promise<void> {
  await initDb()
  await run('DELETE FROM quotes WHERE id = ?', [id])
}

export async function nextQuoteNumber(userId: number): Promise<string> {
  await initDb()
  const rows = await query<{ quote_number: string }>('SELECT quote_number FROM quotes WHERE user_id = ?', [userId])
  const max = rows.reduce((n, r) => {
    const num = parseInt((r.quote_number || '').replace(/\D/g, '') || '0', 10)
    return Math.max(n, num)
  }, 0)
  return `Q-${String(max + 1).padStart(4, '0')}`
}
