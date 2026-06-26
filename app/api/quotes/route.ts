import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { listQuotes, saveQuote, nextQuoteNumber } from '@/lib/quote-store'
import { initDb } from '@/lib/db'
import type { Quote } from '@/lib/quote-types'

function randomId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initDb()
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const quotes = await listQuotes(session.userId, q || undefined)
  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initDb()
  const body = await req.json()
  const now = new Date().toISOString()
  const quoteNumber = await nextQuoteNumber(session.userId)
  const quote: Quote = {
    ...body,
    id: randomId(),
    quoteNumber,
    userId: session.userId,
    createdAt: now,
    updatedAt: now,
  }
  await saveQuote(quote)
  return NextResponse.json(quote, { status: 201 })
}
