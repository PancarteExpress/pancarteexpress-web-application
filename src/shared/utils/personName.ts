// Majuscule au début de chaque mot, y compris après un trait d'union ou une apostrophe.
// Le reste est gardé tel que saisi : "McDonald" ou "DeLuca" ne sont pas abîmés.
const WORD_START = /(^|[\s\-'’])(\p{L})/gu;

/** "jean-philippe", "o'neil" → "Jean-Philippe O'Neil" ; ignore les parties vides */
export function formatPersonName(...parts: (string | null | undefined)[]): string {
  return parts
    .map((part) => part?.normalize("NFC").trim().replace(/\s+/g, " ") ?? "")
    .filter(Boolean)
    .join(" ")
    .replace(WORD_START, (_, separator: string, letter: string) => separator + letter.toLocaleUpperCase("fr-CA"));
}

/** Première lettre de chaque mot (3 au plus) : "Cristian Fermin" + "Lopez" → "CFL" */
export function getPersonInitials(...parts: (string | null | undefined)[]): string {
  return formatPersonName(...parts)
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => Array.from(word)[0])
    .join("");
}
