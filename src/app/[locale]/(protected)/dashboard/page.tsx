import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/app/auth';
import { DashboardContent } from '@/features/dashboard/components/dashboardContent/DashboardContent';
import { getGroupDetails } from '@/lib/groups/server/groups.service';
import { getTeamOrders, getUserOrders } from '@/lib/orders/server/orders.service';
import { redirect } from 'next/navigation';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return { title: t('metaTitle') };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.needsPickupInfo) redirect(`/${locale}/complete-profile`);

  const { id: userId, role, groupId } = session.user;

  const [orders, group, teamOrders] = await Promise.all([
    getUserOrders(userId),
    role === 'groupAdmin' && groupId ? getGroupDetails(groupId) : Promise.resolve(null),
    role === 'groupAdmin' && groupId ? getTeamOrders(groupId, userId) : Promise.resolve([]),
  ]);

  return <DashboardContent user={session.user} orders={orders} group={group} teamOrders={teamOrders} />;
}