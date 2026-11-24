'use client';

import styles from './RegisterCredentials.module.css';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { RegisterForm } from "../registerForm/RegisterForm";
import type { RegisterPlan } from '@/lib/auth/auth.schema';
import { LocalLink } from '@/shared/components/LocalLink';

import { MdGroups2 } from 'react-icons/md';
import { IoPersonAdd } from 'react-icons/io5';

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
        <LocalLink href="/register" className={styles.backToPackages}>{t('btnPackages')}</LocalLink>
      )}

      <div className={styles.credentials}>
        <div className={styles.header}>
          {plan === 'group' ? (
            <MdGroups2 size={70} style={{color: "#0E4D9A"}}/>
          ) : (
            <IoPersonAdd  size={70} style={{color: "#0E4D9A"}}/>
          )}
          <h1 className={styles.title}>{t('formTitle')}</h1>
          <h2>{plan === 'group' ? t('formPackageGroup') : t('formPackageSolo')}</h2>
        </div>

        <RegisterForm
          locale={locale}
          plan={plan}
          onPlanChange={handlePlanChange}
          onStepChange={setFormStep}
        />

        <p style={{ color: '#7691B4', fontWeight: '700', textAlign: 'center', marginTop: '1rem' }}>
          {t('alreadyMember')}{" "}
          <LocalLink href="/login" style={{ textDecoration: 'none', color: '#0E4D9A', fontWeight: '700' }} className={styles.loginLink}>{t('connect')}</LocalLink>
        </p>
      </div>
    </>
  );
}
