import { useTranslations } from 'next-intl';
import { parseIssueMessage } from '@/shared/utils/issueMessage';

/** Traduit un message de validation (clé du namespace donné) ; un texte libre est affiché tel quel. */
export function useIssueMessage(namespace: string) {
  const t = useTranslations(namespace);
  return (message: string | undefined): string | undefined => {
    if (!message) return message;
    const { key, values } = parseIssueMessage(message);
    return t.has(key) ? t(key, values) : message;
  };
}
