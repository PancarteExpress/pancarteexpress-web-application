// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/shared/constants/locales';

const handleI18nRouting = createMiddleware({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false, // ignore Accept-Language et le cookie NEXT_LOCALE
});

export function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);

  const segment = request.nextUrl.pathname.split('/')[1];
  const locale = LOCALES.includes(segment as Locale) ? segment : DEFAULT_LOCALE;

  response.headers.set('x-locale', locale);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};