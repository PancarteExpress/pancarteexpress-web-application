import { NextResponse, type NextRequest } from 'next/server';
import { get } from '@vercel/blob';
import { auth } from '@/app/auth';
import { prisma } from '@/lib/prisma';

/*
 * Ouvre une pièce jointe du stockage privé, pour le superAdmin seulement.
 * L'accès est vérifié ici, juste avant la lecture, et la réponse n'est jamais mise en cache par le CDN.
 */

/** Ouverts dans le navigateur ; les autres (Word, Excel) sont téléchargés */
const INLINE_TYPES: ReadonlySet<string> = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

/** Nom de fichier sûr dans l'en-tête, accents compris (RFC 5987) */
const contentDisposition = (type: 'inline' | 'attachment', fileName: string): string => {
  const ascii = fileName.normalize('NFD').replace(/[^\x20-\x7E]/g, '').replace(/["\\]/g, '');
  return `${type}; filename="${ascii || 'fichier'}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  // Non connecté : connexion, puis retour au fichier
  if (!session?.user) {
    const login = new URL('/fr/login', request.nextUrl.origin);
    login.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  // Connecté sans droit : même réponse qu'un fichier inexistant
  if (session.user.role !== 'superAdmin') {
    console.warn('[attachments] Accès refusé : rôle', session.user.role);
    return new NextResponse('Not found', { status: 404 });
  }

  const { id } = await params;
  const attachment = await prisma.serviceAttachment.findUnique({
    where: { id },
    select: { pathname: true, fileName: true, contentType: true },
  });
  if (!attachment) {
    console.warn('[attachments] Pièce jointe introuvable en base :', id);
    return new NextResponse('Not found', { status: 404 });
  }

  let result: Awaited<ReturnType<typeof get>>;
  try {
    result = await get(attachment.pathname, { access: 'private' });
  } catch (error: unknown) {
    // Ex. clé du stockage absente ou périmée
    console.error('[attachments] Lecture impossible dans le stockage :', attachment.pathname, error);
    return new NextResponse('Not found', { status: 404 });
  }
  if (result?.statusCode !== 200) {
    console.warn('[attachments] Fichier absent du stockage :', attachment.pathname, result?.statusCode);
    return new NextResponse('Not found', { status: 404 });
  }

  const disposition = INLINE_TYPES.has(attachment.contentType) ? 'inline' : 'attachment';
  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': attachment.contentType,
      'Content-Disposition': contentDisposition(disposition, attachment.fileName),
      'X-Content-Type-Options': 'nosniff',
      // Données privées : rien n'est gardé sur disque
      'Cache-Control': 'private, no-store',
    },
  });
}
