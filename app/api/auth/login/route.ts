import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { initDb, queryOne } from '@/lib/db';
import { createSession, COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  await initDb();
  const user = await queryOne<{ id: number; name: string; email: string; password_hash: string; city: string }>(
    'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]
  );
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = await createSession(user.id, user.name, user.city);
  const res = NextResponse.json({ ok: true, name: user.name, city: user.city });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return res;
}
