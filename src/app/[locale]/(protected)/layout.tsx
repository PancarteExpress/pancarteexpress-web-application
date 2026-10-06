import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireRolePage } from "@/lib/auth/guard";

interface ProtectedLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ProtectedLayout({ children, params }: ProtectedLayoutProps) {
  const { locale } = await params;

  // Redirige vers la connexion si l'utilisateur n'est pas connecté
  const session = await requireRolePage(["user", "groupAdmin", "superAdmin"], locale);

  // Le superAdmin a sa propre zone : il ne voit jamais le dashboard client
  if (session.user.role === "superAdmin") {
    redirect(`/${locale}/admin`);
  }

  return <>{children}</>;
}