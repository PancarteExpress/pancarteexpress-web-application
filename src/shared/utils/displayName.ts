type PersonName = { firstName?: string | null; lastName?: string | null };

/** Prénom et nom tels que saisis ; "" si aucun des deux */
export const getFullName = (person: PersonName | null | undefined): string =>
  [person?.firstName?.trim(), person?.lastName?.trim()].filter(Boolean).join(" ");

/** Nom complet, ou le courriel à défaut */
export const getDisplayName = (person: PersonName & { email: string }): string => getFullName(person) || person.email;
