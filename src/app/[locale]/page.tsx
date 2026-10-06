import HomeView from '@/features/home/components/HomeView';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  //locale={locale === 'en' ? 'en' : 'fr'}
  return <HomeView  />;
}