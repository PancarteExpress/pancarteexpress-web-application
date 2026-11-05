// src/features/auth/components/registerCredentials/RegisterCredentials.tsx
'use client';

import styles from './RegisterCredentials.module.css';
import Link from "next/link";
import { useState } from 'react';
import { RegisterForm } from "../registerForm/RegisterForm";
import { MdGroups2 } from 'react-icons/md';
import { IoPersonAdd } from 'react-icons/io5';
import { useTranslations } from 'next-intl';
import type { RegisterPlan } from '@/lib/auth/auth.schema';

interface RegisterCredentialsProps {
  locale: string;
  plan: RegisterPlan;
}

export default function RegisterCredentials({ locale, plan: initialPlan }: RegisterCredentialsProps) {
  const t = useTranslations('register');
  const [plan, setPlan] = useState<RegisterPlan>(initialPlan);
  const [formStep, setFormStep] = useState<"register" | "verify">("register");

  // Garde ?plan= à jour sans relancer le rendu serveur ni perdre les champs remplis
  const handlePlanChange = (next: RegisterPlan) => {
    setPlan(next);
    const params = new URLSearchParams(window.location.search);
    params.set('plan', next);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <>
      {formStep === "register" && (
        <Link href={`/${locale}/register`} className={styles.backToPackages}>
          {t('btnPackages')}
        </Link>
      )}

      <div className={styles.credentials}>
        <div className={styles.header}>
          {plan === 'group' ? (
            <MdGroups2 size={70} style={{color: "#0E4D9A"}}/>
          ) : (
            <IoPersonAdd  size={70} style={{color: "#0E4D9A"}}/>
          )}
          <label>{t('formTitle')}</label>
          <h3>{plan === 'group' ? t('formPackageGroup') : t('formPackageSolo')}</h3>
        </div>

        <RegisterForm
          locale={locale}
          plan={plan}
          onPlanChange={handlePlanChange}
          onStepChange={setFormStep}
        />

        <p style={{ color: '#7691B4', fontWeight: '700', textAlign: 'center', marginTop: '1rem' }}>
          {t('alreadyMember')}{" "}
          <Link href={`/${locale}/login`} style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }}>
            {t('connect')}
          </Link>
        </p>
      </div>
    </>
  );
}
