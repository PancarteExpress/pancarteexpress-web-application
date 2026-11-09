import '../globals.css';
import type { Metadata } from 'next';
import { Montserrat, Inter, Poppins } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';

import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { LOCALES } from '@/shared/constants/locales';

import Header from '@/features/layout/components/header/Header';
import StorageOwnerSync from '@/features/layout/components/storageOwnerSync/StorageOwnerSync';

const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-title' });
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-text' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '900'],
  display: 'swap',
  variable: '--font-home',
});

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return { description: t('description') };
}

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
    <html
      lang={locale}
      className={`${montserrat.variable} ${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
    >
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
