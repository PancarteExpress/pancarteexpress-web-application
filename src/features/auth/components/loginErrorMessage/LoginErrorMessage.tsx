"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { getLoginErrorKey } from "../../utils/loginError";

function ErrorContent({ locale }: { locale: string }) {
  const t = useTranslations("login");
  const error = useSearchParams().get("error");
  const messageKey = getLoginErrorKey(error);
  if (!messageKey) return null;

  return (
    <div>
      <p>{t(messageKey)}</p>
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
