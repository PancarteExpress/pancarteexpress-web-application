"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const messages: Record<string, string> = {
  no_account: "Aucun compte n'est associé à ce compte Google.",
  account_exists: "Un compte existe déjà avec cette adresse. Connectez-vous.",
};

function ErrorContent({ locale }: { locale: string }) {
  const error = useSearchParams().get("error");
  if (!error || !messages[error]) return null;

  return (
    <div>
      <p>{messages[error]}</p>
      {error === "no_account" && (
        <Link href={`/${locale}/register`}>Devenir membre</Link>
      )}
    </div>
  );
}

export function LoginErrorMessage({ locale }: { locale: string }) {
  return (
    <Suspense fallback={null}>
      <ErrorContent locale={locale} />
    </Suspense>
  );
}