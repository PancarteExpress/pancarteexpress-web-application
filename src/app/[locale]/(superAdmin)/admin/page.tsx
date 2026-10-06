
import { AdminDashboard } from "@/features/superAdmin/components/superAdminDashboard/superAdminDashboard";
import { requireRolePage } from "@/lib/auth/guard";
import { listUsersForAdmin } from "@/lib/users/server/user.service";


interface AdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  await requireRolePage(["superAdmin"], locale);

  const users = await listUsersForAdmin();

  return <AdminDashboard users={users} />;
}