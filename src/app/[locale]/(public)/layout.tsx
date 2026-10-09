import Header from '@/shared/components/header/header';
import Footer from '@/shared/components/footer/footer';

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