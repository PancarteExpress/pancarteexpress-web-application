import Header from '@/shared/components/header/Header';
import Footer from '@/shared/components/footer/Footer';

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