import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pancarte Express',
  description: 'Platform de services immobiliers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`} async defer/>
      </head>

      <body>
        {children}
      </body>
    </html>
  );
}