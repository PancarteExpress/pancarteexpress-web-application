import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import {
  ATTACHMENT_CONTENT_TYPES, ATTACHMENT_PREFIX, MAX_ATTACHMENT_SIZE,
} from '@/lib/attachments/constants';
import { ipKey, isRateLimited, LIMITS } from '@/lib/rateLimit/server/rateLimit';

/*
 * Délivre un jeton d'envoi temporaire : le navigateur envoie ensuite le fichier
 * directement au stockage privé, sans passer par ce serveur (limite de 4,5 Mo).
 * Types, taille et dossier sont imposés ici : Vercel les applique, même si le navigateur est contourné.
 * Les invités peuvent commander : pas de connexion exigée, mais un nombre d'envois limité par IP.
 */
export async function POST(request: Request) {
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: 'invalidRequest' }, { status: 400 });
  }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // 30 fichiers par 15 minutes et par IP : large pour une demande, assez pour freiner les abus
        if (await isRateLimited('attachmentUpload', [{ key: await ipKey(), limit: LIMITS.uploadIp }])) {
          throw new Error('tooManyUploads');
        }
        // Seulement dans le dossier des pièces jointes
        if (!pathname.startsWith(ATTACHMENT_PREFIX) || pathname.includes('..')) {
          throw new Error('invalidPathname');
        }
        return {
          allowedContentTypes: [...ATTACHMENT_CONTENT_TYPES],
          maximumSizeInBytes: MAX_ATTACHMENT_SIZE,
          // Deux fichiers du même nom ne s'écrasent jamais
          addRandomSuffix: true,
        };
      },
      // Appelé par Vercel une fois le fichier reçu ; ne fonctionne pas en local (localhost).
      // Le rattachement à la commande se fait au paiement (étape F3), pas ici.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'uploadFailed';
    const status = message === 'tooManyUploads' ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}