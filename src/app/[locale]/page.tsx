import HomeView from '@/features/home/components/HomeView';
import Footer from '@/shared/components/footer/Footer';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  return (
    <>
      <HomeView  />
      <Footer />
    </>
  );
}