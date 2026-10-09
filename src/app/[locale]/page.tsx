import HomeView from '@/features/home/components/HomeView';
import Footer from '@/shared/components/footer/footer';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  //locale={locale === 'en' ? 'en' : 'fr'}
  return (
    <>
      <HomeView  />
      <Footer />
    </>
  );
}