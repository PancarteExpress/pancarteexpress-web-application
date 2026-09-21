import { getRequestConfig } from 'next-intl/server';

type Messages = Record<string, unknown>;

const loadMessages = async (locale: string): Promise<Messages> => {
  try {
    const messages = await import(`@/messages/${locale}/header.json`);
    return {
      header: messages.default,
    };
  } catch {
    return {
      header: {},
    };
  }
};

export default getRequestConfig(({ locale }) => {
  const resolvedLocale = locale || 'fr';
  const messages = loadMessages(resolvedLocale);

  return {
    locale: resolvedLocale,
    messages,
    timeZone: 'America/Toronto',
  };
});