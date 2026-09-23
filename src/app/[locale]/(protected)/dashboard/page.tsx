import { auth } from "@/app/auth";
import { DashboardContent } from "@/features/dashboard/components/dashboard/DashboardContent";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${params.locale}/auth/login`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent user={session.user} />
    </div>
  );
}