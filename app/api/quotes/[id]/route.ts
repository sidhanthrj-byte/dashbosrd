import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getQuoteById, saveQuote, deleteQuote } from '@/lib/quote-store'
import { calculateQuote } from '@/lib/quote-calculations'
import type { Quote } from '@/lib/quote-types'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const quote = await getQuoteById(params.id, session.userId)
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ quote })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await getQuoteById(params.id, session.userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json() as Partial<Quote>

  const updated: Quote = {
    ...existing,
    ...body,
    id: existing.id,
    quoteNumber: existing.quoteNumber,
    userId: session.userId,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  }

  const breakdown = calculateQuote(updated)
  updated.grandTotal = breakdown.grandTotal

  const saved = await saveQuote({ ...updated, userId: session.userId })
  return NextResponse.json({ quote: saved })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await getQuoteById(params.id, session.userId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await deleteQuote(params.id, session.userId)
  return NextResponse.json({ ok: true })
}
