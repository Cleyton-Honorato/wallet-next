import { NextResponse, type NextRequest } from 'next/server';
import { COOKIES } from '@/lib/constants';
import { verifySessionToken } from '@/server/auth/jwt';

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

/**
 * Guard de navegação — otimista, só para não pintar uma tela que seria negada.
 * A autoridade continua sendo `requireUser()` em cada leitura e cada action.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(COOKIES.SESSION)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!session && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('returnTo', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (session && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
