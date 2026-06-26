import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getQuoteById, saveQuote, deleteQuote } from '@/lib/quote-store'
import { initDb } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initDb()
  const quote = await getQuoteById(params.id)
  if (!quote || quote.userId !== session.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(quote)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initDb()
  const existing = await getQuoteById(params.id)
  if (!existing || existing.userId !== session.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  const updated = { ...existing, ...body, id: params.id, userId: session.userId, updatedAt: new Date().toISOString() }
  await saveQuote(updated)
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await initDb()
  const existing = await getQuoteById(params.id)
  if (!existing || existing.userId !== session.userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await deleteQuote(params.id)
  return NextResponse.json({ ok: true })
}
