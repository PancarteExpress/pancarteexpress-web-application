'use client';

import NextError from 'next/error';

// Hors de toute locale valide : le layout racine ne fournit pas <html>
export default function RootNotFound() {
  return (
    <html lang="fr">
      <body>
        <NextError statusCode={404} />
      </body>
    </html>
  );
}
