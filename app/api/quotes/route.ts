import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listQuotes, saveQuote, nextQuoteNumber } from '@/lib/quote-store'
import { calculateQuote } from '@/lib/quote-calculations'
import type { Quote } from '@/lib/quote-types'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? undefined

  const quotes = await listQuotes(session.userId, search)
  return NextResponse.json({ quotes })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as Partial<Quote>

  if (!body.clientName) return NextResponse.json({ error: 'clientName required' }, { status: 400 })

  const items = body.items ?? []
  const priceTier = body.priceTier ?? 'msp'
  const markupPercent = body.markupPercent ?? 0
  const installationRatePerSqft = body.installationRatePerSqft ?? 60
  const date = body.date ?? new Date().toISOString().slice(0, 10)

  const draft: Quote = {
    id: '',
    quoteNumber: '',
    clientName: body.clientName,
    projectName: body.projectName ?? '',
    location: body.location ?? '',
    date,
    validUntil: body.validUntil ?? '',
    priceTier,
    markupPercent,
    installationRatePerSqft,
    items,
    notes: body.notes ?? '',
    grandTotal: 0,
    createdAt: '',
    updatedAt: '',
  }

  const breakdown = calculateQuote(draft)
  const grandTotal = breakdown.grandTotal

  const saved = await saveQuote({
    ...draft,
    grandTotal,
    leadId: body.leadId ?? null,
    userId: session.userId,
  })

  return NextResponse.json({ quote: saved }, { status: 201 })
}
