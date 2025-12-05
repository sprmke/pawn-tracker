import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  const isPublicRoute = nextUrl.pathname === '/';
  const isAuthRoute = nextUrl.pathname.startsWith('/auth');

  // Allow access to public routes and auth routes
  if (isPublicRoute || isAuthRoute) {
    // If logged in and on landing page, redirect to dashboard
    if (isLoggedIn && isPublicRoute) {
      return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign in for protected routes
  if (!isLoggedIn) {
    const signInUrl = new URL('/auth/signin', nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
