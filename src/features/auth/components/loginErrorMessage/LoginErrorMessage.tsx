"use client";

import styles from './LoginErrorMessage.module.css';

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

import { getLoginErrorKey } from "../../utils/loginError";
import { LocalLink } from '@/shared/components/LocalLink';

function ErrorContent() {
  const t = useTranslations("login");
  
  const error = useSearchParams().get("error");
  const messageKey = getLoginErrorKey(error);

  if (!messageKey) return null;

  return (
    <div className={styles.message}>
      <p>{t(messageKey)}</p>
      {error === "no_account" && (
        <LocalLink href="/register">{t("becomeMember")}</LocalLink>
      )}
    </div>
  );
}

export function LoginErrorMessage() {
  return (
    <Suspense fallback={null}>
      <ErrorContent/>
    </Suspense>
  );
}
