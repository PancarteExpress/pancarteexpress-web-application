import { requireRolePage } from "@/lib/auth/guard";
import type { ReactNode } from "react";

interface SuperAdminLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function SuperAdminLayout({ children, params }: SuperAdminLayoutProps) {
  const { locale } = await params;
  await requireRolePage(["superAdmin"], locale);
  return <>{children}</>;
}