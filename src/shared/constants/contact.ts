// Coordonnées affichées sur le site et dans les courriels : seule source pour le texte et les liens tel:/mailto:
export const CONTACT = {
  /** Ligne principale (header, page contact, signatures) et service résidentiel */
  mainPhone: "514-825-2709",
  commercialPhone: "514-833-2709",
  accountingPhone: "450-543-0769",
  /** Cellulaire, page contact */
  mobilePhone: "438-543-0912",
  infoEmail: "info@pancarteexpress.com",
  commercialEmail: "structureframd@gmail.com",
  accountingEmail: "stephany@pancarteexpress.com",
  /** Adresse de l'entrepôt (page contact, ramassage) */
  address: "2160 Rue Léger, Lasalle, QC H8N 2L8",
} as const;

/** "514-825-2709" → "tel:+15148252709" (numéro nord-américain à 10 chiffres) */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+${digits.length === 10 ? `1${digits}` : digits}`;
}

export const mailtoHref = (email: string) => `mailto:${email}`;
