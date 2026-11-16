/** Pièces jointes d'une adresse de service (photos, plans, documents) */

/** Types autorisés : le serveur les impose aussi dans le jeton d'envoi */
export const ATTACHMENT_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic', // photos d'iPhone
  'image/heif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
] as const;
export type AttachmentContentType = (typeof ATTACHMENT_CONTENT_TYPES)[number];

/** Pour l'attribut accept du sélecteur de fichiers */
export const ATTACHMENT_ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,.docx,.xlsx';

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 Mo
export const MAX_ATTACHMENTS_PER_ADDRESS = 5;

/** Dossier des pièces jointes dans le stockage privé */
export const ATTACHMENT_PREFIX = 'attachments/';