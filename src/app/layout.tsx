import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pancarte Express',
  // description : traduite dans [locale]/layout.tsx (namespace metadata)
};

// <html> est dans [locale]/layout.tsx : c'est là que la locale est connue
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
