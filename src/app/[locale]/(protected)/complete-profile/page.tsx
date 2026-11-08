import { redirect } from "next/navigation";
import { auth } from "@/app/auth";
import CompleteProfileForm from "@/features/auth/components/completeProfileForm/CompleteProfileForm";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (!session.user.needsPickupInfo) redirect(`/${locale}/dashboard`);

  return <CompleteProfileForm locale={locale} />;
}