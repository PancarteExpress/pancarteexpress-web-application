"use client";

import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1]; // Extrait 'fr' ou 'en'

  
  const [registrationData, setRegistrationData] = useState<{
    email: string;
    name: string;
    password: string;
    isGroup: boolean;
    groupName?: string;
  } | null>(null);

  useEffect(() => {
    console.log("Full pathname:", pathname);
    console.log("Split result:", pathname.split("/"));
    console.log("Extracted locale:", locale);
    
    // Récupérer les données de registration depuis sessionStorage
    const data = sessionStorage.getItem("registrationData");
    if (!data) {
      router.push(`/${locale}/register`);
      return;
    }
    setRegistrationData(JSON.parse(data));
  }, [pathname, locale, router]);

  if (!registrationData) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Vérifier votre email
        </h1>
        <VerifyEmailForm
          locale={locale}
          email={registrationData.email}
          name={registrationData.name}
          password={registrationData.password}
          isGroup={registrationData.isGroup}
          groupName={registrationData.groupName}
        />
      </div>
    </div>
  );
}