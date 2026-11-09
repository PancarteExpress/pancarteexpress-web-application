import type { Locale } from "@/shared/constants/locales";

// Dates affichées dans la langue de l'interface, toujours à l'heure de Montréal (même rendu serveur et client)
type DateStyle = "medium" | "long";
const DATE_FORMATTERS = new Map<string, Intl.DateTimeFormat>();

export function formatDate(date: Date, style: DateStyle = "medium", locale: Locale = "fr"): string {
  const key = `${locale}-${style}`;
  let formatter = DATE_FORMATTERS.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(`${locale}-CA`, { dateStyle: style, timeZone: "America/Toronto" });
    DATE_FORMATTERS.set(key, formatter);
  }
  return formatter.format(date);
}
