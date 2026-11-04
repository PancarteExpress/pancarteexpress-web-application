import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';

import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { LOCALES } from '@/shared/constants/locales';

import Header from '@/features/layout/components/header/Header';
import StorageOwnerSync from '@/features/layout/components/storageOwnerSync/StorageOwnerSync';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(LOCALES, locale)) notFound();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <SessionProvider>
          <StorageOwnerSync />
          <NextIntlClientProvider messages={messages} locale={locale}>
            <Header/>
            {children}
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
