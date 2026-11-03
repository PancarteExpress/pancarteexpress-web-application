// Dates affichées en français, toujours à l'heure de Montréal (même rendu serveur et client)
const DATE_FORMATTERS = {
  medium: new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium", timeZone: "America/Toronto" }),
  long: new Intl.DateTimeFormat("fr-CA", { dateStyle: "long", timeZone: "America/Toronto" }),
};

export const formatDate = (date: Date, style: keyof typeof DATE_FORMATTERS = "medium"): string =>
  DATE_FORMATTERS[style].format(date);
