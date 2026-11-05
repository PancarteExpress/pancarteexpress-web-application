import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getTranslations } from 'next-intl/server';
import { registerPlanSchema } from '@/lib/auth/auth.schema';
import RegisterView from "@/features/auth/components/registerView/RegisterView";
import { inlineLoading } from '@/shared/components/deferredLoading/DeferredLoading';

const RegisterCredentials = dynamic(() => import('@/features/auth/components/registerCredentials/RegisterCredentials'), { loading: inlineLoading });

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string | string[] }>;
}

export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'register' });
  return { title: t('accountTitle') };
}

export default async function RegisterAccountPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { plan } = await searchParams;

  // Forfait absent ou invalide : retour au choix du forfait
  const parsed = registerPlanSchema.safeParse(plan);
  if (!parsed.success) {
    redirect(`/${locale}/register`);
  }

  return (
    <RegisterView>
      <RegisterCredentials locale={locale} plan={parsed.data} />
    </RegisterView>
  );
}
