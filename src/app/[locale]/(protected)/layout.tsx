import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireRolePage } from "@/lib/auth/guard";
import Footer from "@/features/layout/components/footer/Footer";
import type { Metadata } from "next";

interface ProtectedLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ProtectedLayout({ children, params }: ProtectedLayoutProps) {
  const { locale } = await params;

  // Redirige vers la connexion si l'utilisateur n'est pas connecté
  const session = await requireRolePage(["user", "groupAdmin", "superAdmin"], locale);

  // Le superAdmin a sa propre zone : il ne voit jamais le dashboard client
  if (session.user.role === "superAdmin") {
    redirect(`/${locale}/admin`);
  }

  return (
    <>
      {children}
      <Footer />
    </>
  );
}