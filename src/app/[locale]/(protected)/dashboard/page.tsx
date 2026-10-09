import { auth } from '@/app/auth';
import { DashboardContent } from '@/features/dashboard/components/dashboard/DashboardContent';
import { getGroupDetails } from '@/lib/groups/server/groups.service';
import { getUserOrders } from '@/lib/orders/server/orders.service';
import { redirect } from 'next/navigation';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const { id: userId, role, groupId } = session.user;

  const isAdminWithGroup = role === "groupAdmin" && !!session.user.groupId;

  const [orders, group] = await Promise.all([
    getUserOrders(session.user.id), // ← ton appel existant
    role === "groupAdmin" && groupId ? getGroupDetails(groupId) : Promise.resolve(null),
  ]);

  return <DashboardContent orders={orders} group={group} />;
}