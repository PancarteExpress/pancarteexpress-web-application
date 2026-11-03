import Header from '@/features/layout/components/header/Header';
import Footer from '@/features/layout/components/footer/Footer';

export default async function SiteLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      {children}
      <Footer />
    </>
  );
}