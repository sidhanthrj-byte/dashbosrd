import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDb, query, run } from '@/lib/db';
import { createSession, COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { name, email, password, firm_name, city } = await req.json();
  if (!name || !email || !password || !city) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 });
  }
  await initDb();
  const existing = await query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }
  const hash = await bcrypt.hash(password, 10);
  const result = await run(
    'INSERT INTO users (name, email, password_hash, firm_name, city) VALUES (?, ?, ?, ?, ?)',
    [name, email.toLowerCase(), hash, firm_name || null, city]
  );

  const userId = result.lastInsertRowid;
  const token = await createSession(userId, name, city);
  const res = NextResponse.json({ ok: true, name, city });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
