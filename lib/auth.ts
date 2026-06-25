import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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

export { COOKIE };
