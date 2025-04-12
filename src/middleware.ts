import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { securityHeaders } from './utils/security/security-headers';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Handle CORS
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS?.split(',') || [];

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers
    });
  }

  // Block analytics if disabled
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'false') {
    const url = new URL(request.url);
    if (url.pathname.includes('analytics') || url.pathname.includes('tracking')) {
      return new NextResponse(null, { status: 204 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 