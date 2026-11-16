'use client';

import { useId, useState, type ChangeEvent } from 'react';
import { upload } from '@vercel/blob/client';
import { useTranslations } from 'next-intl';
import {
  ATTACHMENT_ACCEPT, ATTACHMENT_CONTENT_TYPES, ATTACHMENT_PREFIX, MAX_ATTACHMENT_SIZE, MAX_ATTACHMENTS_PER_ADDRESS,
  type AttachmentContentType,
} from '@/lib/attachments/constants';
import { useAddressStore, type PendingFile } from '@/features/services/store/addressStore';
import type { Address } from '@/features/services/types/address';
import styles from './attachments.module.css';

const ALLOWED: ReadonlySet<string> = new Set(ATTACHMENT_CONTENT_TYPES);
const isAllowed = (type: string): type is AttachmentContentType => ALLOWED.has(type);

/** Certains navigateurs ne donnent pas le type (ex. photos HEIC sous Windows) : on le déduit de l'extension */
const TYPE_BY_EXTENSION: Record<string, string> = {
  heic: 'image/heic',
  heif: 'image/heif',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const typeOf = (file: File): string =>
  file.type || TYPE_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''] || '';

/** Nom sûr dans le stockage : sans accents ni espaces. Le nom d'origine est gardé à part, pour l'affichage */
const safeName = (name: string): string =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.-]+/g, '-').slice(-100) || 'fichier';

const formatSize = (bytes: number): string =>
  bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`;

/** Pièces jointes d'une adresse : choisies, vérifiées, puis envoyées au stockage privé avec le bouton */
export function AttachmentsField({ address }: { address: Address }) {
  const t = useTranslations('services.attachments');
  const inputId = useId();
  const addAttachment = useAddressStore((s) => s.addAttachment);
  const removeAttachment = useAddressStore((s) => s.removeAttachment);
  const addPendingFiles = useAddressStore((s) => s.addPendingFiles);
  const removePendingFile = useAddressStore((s) => s.removePendingFile);
  const pending = useAddressStore((s) => s.pendingFiles[address.id]) ?? [];

  const attachments = address.attachments ?? [];
  const [sending, setSending] = useState(false);
  /** Progression de l'envoi, par fichier en attente */
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const remaining = MAX_ATTACHMENTS_PER_ADDRESS - attachments.length - pending.length;

  /** Choix des fichiers : vérifiés ici, mais pas encore envoyés */
  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    // Permet de choisir à nouveau le même fichier après un retrait
    event.target.value = '';

    const nextErrors: string[] = [];
    const accepted: PendingFile[] = [];
    for (const file of files) {
      const contentType = typeOf(file);
      if (accepted.length >= remaining) {
        nextErrors.push(t('tooMany', { max: MAX_ATTACHMENTS_PER_ADDRESS }));
        break;
      }
      if (!isAllowed(contentType)) nextErrors.push(t('invalidType', { name: file.name }));
      else if (file.size > MAX_ATTACHMENT_SIZE) nextErrors.push(t('tooLarge', { name: file.name, max: 10 }));
      else accepted.push({ id: crypto.randomUUID(), file, contentType });
    }

    setErrors(nextErrors);
    if (accepted.length > 0) addPendingFiles(address.id, accepted);
  };

  /** Envoi des fichiers en attente ; ceux qui échouent restent en attente, pour réessayer */
  const handleSend = async () => {
    setSending(true);
    setErrors([]);
    const failures: string[] = [];

    await Promise.all(
      pending.map(async ({ id, file, contentType }) => {
        try {
          const blob = await upload(`${ATTACHMENT_PREFIX}${safeName(file.name)}`, file, {
            access: 'private',
            contentType,
            handleUploadUrl: '/api/attachments/upload',
            onUploadProgress: ({ percentage }) => setProgress((p) => ({ ...p, [id]: percentage })),
          });
          addAttachment(address.id, { pathname: blob.pathname, fileName: file.name, contentType, size: file.size });
          removePendingFile(address.id, id);
        } catch {
          failures.push(t('uploadFailed', { name: file.name }));
        }
      }),
    );

    setProgress({});
    setErrors(failures);
    setSending(false);
  };

  return (
    <section className={styles.attachments} aria-labelledby={`${inputId}-title`}>
      <h3 id={`${inputId}-title`} className={styles.title}>{t('title')}</h3>
      <p className={styles.hint}>{t('hint', { max: MAX_ATTACHMENTS_PER_ADDRESS, size: 10 })}</p>

      {(attachments.length > 0 || pending.length > 0) && (
        <ul className={styles.list}>
          {attachments.map((file) => (
            <li key={file.pathname} className={styles.file}>
              <span className={styles.fileName}>{file.fileName}</span>
              <span className={styles.fileSize}>{formatSize(file.size)}</span>
              <span className={styles.sent}>{t('sentStatus')}</span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeAttachment(address.id, file.pathname)}
                aria-label={t('remove', { name: file.fileName })}
              >
                ×
              </button>
            </li>
          ))}

          {pending.map(({ id, file }) => (
            <li key={id} className={styles.file} data-pending>
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>{formatSize(file.size)}</span>
              {sending ? (
                <progress max={100} value={progress[id] ?? 0} aria-label={t('uploading', { name: file.name })} />
              ) : (
                <span className={styles.pendingStatus}>{t('pendingStatus')}</span>
              )}
              <button
                type="button"
                className={styles.remove}
                onClick={() => removePendingFile(address.id, id)}
                disabled={sending}
                aria-label={t('remove', { name: file.name })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.actions}>
        {remaining > 0 && !sending && (
          <label htmlFor={inputId} className={styles.addButton}>
            {t('add')}
            <input
              id={inputId}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              onChange={handleFiles}
              className={styles.input}
            />
          </label>
        )}

        {pending.length > 0 && (
          <button type="button" className={styles.sendButton} onClick={handleSend} disabled={sending}>
            {sending ? t('sending') : t('send', { count: pending.length })}
          </button>
        )}
      </div>

      {pending.length > 0 && !sending && <p className={styles.hint}>{t('pendingHint')}</p>}

      {errors.length > 0 && (
        <ul role="alert" className={styles.errors}>
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
    </section>
  );
}
