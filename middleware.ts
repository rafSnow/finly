import { NextResponse, type NextRequest } from 'next/server';

const AUTH_ROUTES = ['/login', '/cadastro'];
const PROTECTED_PREFIX = [
  '/dashboard',
  '/transacoes',
  '/contas',
  '/cartoes',
  '/orcamento',
  '/metas',
  '/relatorios',
  '/familia',
  '/importar',
  '/perfil',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('__session')?.value;

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );
  const isProtectedRoute = PROTECTED_PREFIX.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // If user is logged in and accessing auth routes, redirect to dashboard
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is NOT logged in and accessing protected routes, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)'],
};
