"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

const messageKeys = {
  no_account: "errorNoAccount",
  account_exists: "errorAccountExists",
} as const;

function isKnownError(error: string): error is keyof typeof messageKeys {
  return error in messageKeys;
}

function ErrorContent({ locale }: { locale: string }) {
  const t = useTranslations("login");
  const error = useSearchParams().get("error");
  if (!error || !isKnownError(error)) return null;

  return (
    <div>
      <p>{t(messageKeys[error])}</p>
      {error === "no_account" && (
        <Link href={`/${locale}/register`}>{t("becomeMember")}</Link>
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
