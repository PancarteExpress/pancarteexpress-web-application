import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { auth } from "@/app/auth";
import CompleteProfileForm from "@/features/auth/components/completeProfileForm/CompleteProfileForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "register.completeProfile" });

  return {
    title: t("metaTitle"),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect(`/${locale}/login`);
  if (!session.user.needsPickupInfo) redirect(`/${locale}/dashboard`);

  return <CompleteProfileForm locale={locale} />;
}