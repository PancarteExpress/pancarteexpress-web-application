
import { AdminDashboard } from "@/features/superAdmin/components/superAdminDashboard/superAdminDashboard";
import { requireRolePage } from "@/lib/auth/guard";
import { listGroupsForAdmin } from "@/lib/groups/server/groups.service";
import { listServicesForAdmin } from "@/lib/services/services.service";
import { listUsersForAdmin } from "@/lib/users/server/user.service";


interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  await requireRolePage(["superAdmin"], locale);

  const [users, groups, services] = await Promise.all([
    listUsersForAdmin(),
    listGroupsForAdmin(),
    listServicesForAdmin(),
  ]);

  return <AdminDashboard users={users} groups={groups} services={services} />;
}