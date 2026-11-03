import Footer from '@/features/layout/components/footer/Footer';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
