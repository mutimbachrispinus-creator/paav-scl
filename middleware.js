import { NextResponse } from 'next/server';

/**
 * EduVantage SaaS Middleware
 */
export function middleware(request) {
  const url = request.nextUrl.clone();
  const host = request.headers.get('host') || '';
  
  // 1. Skip ALL API routes and internal Next.js assets
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/_next') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Platform Main Domain Check
  // We use a broader check to handle Vercel deployment variations
  const isMainPlatform = 
    host === 'paav-scl.vercel.app' || 
    host === 'localhost:3000' || 
    host.endsWith('.vercel.app') && !host.includes('--'); // Basic check for production domain

  if (isMainPlatform) {
    return NextResponse.next();
  }

  // 3. Subdomain Routing
  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    const ignore = ['www', 'app', 'portal', 'admin', 'paav-scl'];
    
    if (!ignore.includes(subdomain)) {
      if (url.pathname === '/') {
        url.pathname = '/login';
        url.searchParams.set('tenant', subdomain);
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
