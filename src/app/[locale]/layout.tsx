import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { LOCALES } from '@/shared/constants/locales';

import Header from '@/shared/components/header/header';

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
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Header/>
      {children}
    </NextIntlClientProvider>
  );
}