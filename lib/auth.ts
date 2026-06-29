import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pongs-crm-jwt-secret-2026-secure'
);
const COOKIE = 'pongs_session';

export async function createSession(userId: number, name: string, city: string): Promise<string> {
  return new SignJWT({ userId, name, city })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SECRET);
}

export async function getSession(): Promise<{ userId: number; name: string; city: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: number; name: string; city: string };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<{ id: number; name: string; city: string } | null> {
  try {
    const token = req.cookies.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    const p = payload as { userId: number; name: string; city: string };
    return { id: p.userId, name: p.name, city: p.city };
  } catch {
    return null;
  }
}

export { COOKIE };
