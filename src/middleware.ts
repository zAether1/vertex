import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_ROUTES = ['/', '/login', '/register'];
const AUTH_ROUTES = ['/login', '/register'];
const ADMIN_ROUTES = ['/admin'];
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export async function middleware(req: NextRequest) {
  if (!process.env.AUTH_SECRET) {
    console.error('[SECURITY] FATAL: AUTH_SECRET is not set.');
    return new NextResponse('Internal Server Error: Missing AUTH_SECRET', { status: 500 });
  }
  const { pathname } = req.nextUrl;
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET as string,
    salt: process.env.NODE_ENV === 'production' ? '__Secure-vertex.session-token' : 'authjs.session-token',
    secureCookie: process.env.NODE_ENV === 'production'
  });
  const isLoggedIn = !!token;

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');

  if (PUBLIC_ROUTES.includes(pathname)) {
    if (isLoggedIn && AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return response;
  }

  if (pathname.startsWith('/api/')) {
    return response;
  }

  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token?.status === 'SUSPENDED' || token?.status === 'BANNED') {
    return NextResponse.redirect(new URL('/login?error=suspended', req.url));
  }

  if (pathname.startsWith('/admin')) {
    if (!token?.role || !ADMIN_ROLES.includes(token.role as string)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};



