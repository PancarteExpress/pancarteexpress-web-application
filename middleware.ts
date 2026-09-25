// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware({
  locales: ['en', 'fr'],
  defaultLocale: 'fr',
  localePrefix: 'always',
});

export function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);
  
  // Extrait la locale de l'URL
  const pathname = request.nextUrl.pathname;
  const locale = pathname.split('/')[1] || 'fr';
  
  response.headers.set('x-locale', locale);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};