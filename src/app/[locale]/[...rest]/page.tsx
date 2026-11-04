import { notFound } from 'next/navigation';

// Sans cette route, une URL inconnue échappe à [locale]/not-found.tsx
export default function CatchAllPage() {
  notFound();
}
