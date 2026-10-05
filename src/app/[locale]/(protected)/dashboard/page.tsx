import { auth } from "@/app/auth";
import { DashboardContent } from "@/features/dashboard/components/dashboard/DashboardContent";
import { getUserProductOrders, getUserServiceOrders } from "@/lib/orders/server/orders.service";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const [productOrders, serviceOrders] = await Promise.all([
    getUserProductOrders(session.user.id),
    getUserServiceOrders(session.user.id),
  ]);

  return <DashboardContent productOrders={productOrders} serviceOrders={serviceOrders} />;
}