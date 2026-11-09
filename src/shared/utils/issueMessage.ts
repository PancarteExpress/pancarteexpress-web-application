// Messages de validation (Zod) partagés client/serveur : une clé i18n, avec valeurs optionnelles
// encodées « clé|{json} » (un message Zod n'est qu'une chaîne). Traduits à l'affichage par useIssueMessage.

export type IssueValues = Record<string, string | number>;

const SEPARATOR = '|';

export const issueMessage = (key: string, values?: IssueValues): string =>
  values ? `${key}${SEPARATOR}${JSON.stringify(values)}` : key;

export function parseIssueMessage(message: string): { key: string; values?: IssueValues } {
  const index = message.indexOf(SEPARATOR);
  if (index === -1) return { key: message };
  try {
    const parsed: unknown = JSON.parse(message.slice(index + 1));
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const values: IssueValues = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' || typeof v === 'number') values[k] = v;
      }
      return { key: message.slice(0, index), values };
    }
  } catch {
    // Texte libre contenant « | » : affiché tel quel
  }
  return { key: message };
}
