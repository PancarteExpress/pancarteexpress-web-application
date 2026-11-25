import { auth } from '@/app/auth';
import ServiceForm from '@/features/services/components/serviceForm/ServiceForm';
import { getServiceAccess } from '@/lib/users/server/serviceAccess.service';
import { daysUntil, type ServiceAccess } from '@/lib/orders/billing';
import { ServiceBlockWarning } from '@/features/services/components/serviceBlock/ServiceBlockWarning';
import { ServicesBlocked } from '@/features/services/components/serviceBlock/ServicesBlocked';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

const NO_ACCOUNT: ServiceAccess = { status: 'ok' };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/services`,
      languages: { fr: '/fr/services', en: '/en/services' },
    },
  };
}

export default async function Services() {
  const session = await auth();
  // Invité : aucun compte, donc aucun blocage
  const access = session?.user?.id ? await getServiceAccess(session.user.id) : NO_ACCOUNT;

  if (access.status === 'blocked') {
    return (
      <main>
        <ServicesBlocked source={access.source} />
      </main>
    );
  }

  return (
    <main>
      {access.status === 'warning' && (
        <ServiceBlockWarning
          startsAt={access.startsAt.toISOString()}
          daysLeft={daysUntil(access.startsAt, new Date())}
          source={access.source}
        />
      )}
      <ServiceForm />
    </main>
  );
}