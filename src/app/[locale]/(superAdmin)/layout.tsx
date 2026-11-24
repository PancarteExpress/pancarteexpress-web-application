import { requireRolePage } from "@/lib/auth/guard";
import type { ReactNode } from "react";
import type { Metadata } from "next";

interface SuperAdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SuperAdminLayout({ children, params }: SuperAdminLayoutProps) {
  const { locale } = await params;
  await requireRolePage(["superAdmin"], locale);
  return <>{children}</>;
}