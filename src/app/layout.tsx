import { SessionProvider } from 'next-auth/react';
import StorageOwnerSync from '@/shared/components/storageOwnerSync/StorageOwnerSync';
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pancarte Express',
  description: 'Platform de services immobiliers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <SessionProvider>
          <StorageOwnerSync />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}