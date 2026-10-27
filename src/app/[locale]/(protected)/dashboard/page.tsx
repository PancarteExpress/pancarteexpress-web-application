import { auth } from '@/app/auth';
import { DashboardContent } from '@/features/dashboard/components/dashboard/DashboardContent';
import { getGroupDetails } from '@/lib/groups/server/groups.service';
import { getTeamOrders, getUserOrders } from '@/lib/orders/server/orders.service';
import { redirect } from 'next/navigation';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const { id: userId, role, groupId } = session.user;

  const [orders, group, teamOrders] = await Promise.all([
    getUserOrders(userId),
    role === 'groupAdmin' && groupId ? getGroupDetails(groupId) : Promise.resolve(null),
    role === 'groupAdmin' && groupId ? getTeamOrders(groupId, userId) : Promise.resolve([]),
  ]);

  return <DashboardContent orders={orders} group={group} teamOrders={teamOrders} />;
}