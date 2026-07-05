import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pongs-crm-jwt-secret-2026-secure'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // On the Relive-only deployment, the event app is the whole app:
  // the root URL opens the control room instead of the CRM login.
  if (process.env.RELIVE_ROOT === '1' && (pathname === '/' || pathname === '/login')) {
    return NextResponse.redirect(new URL('/relive', req.url));
  }
  // Skip auth routes and static files
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/relive') ||
    pathname.startsWith('/api/relive') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  const token = req.cookies.get('pongs_session')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
