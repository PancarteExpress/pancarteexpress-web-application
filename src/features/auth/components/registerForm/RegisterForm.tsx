"use client";

import styles from './RegisterForm.module.css';

import * as z from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';

import { BillingAddressField } from "../billingAddressField/BillingAddressField";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, verifyCodeSchema, type RegisterInput, type RegisterPlan } from "@/lib/auth/auth.schema";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { GoogleLoginButton } from '../googleLoginButton/GoogleLoginButton';
import { PickupFields } from "../pickupFields/PickupFields";
import { readErrorCode } from '@/lib/errors/appError';
import { useIssueMessage } from '@/shared/hooks/useIssueMessage';
import { formatPhone } from '@/shared/utils/phone';

interface RegisterFormProps {
  locale: string;
  plan: RegisterPlan;
  onPlanChange: (plan: RegisterPlan) => void;
  onStepChange?: (step: "register" | "verify") => void;
}

type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export function RegisterForm({ locale, plan, onPlanChange, onStepChange }: RegisterFormProps) {
  const t = useTranslations('register');
  const tErrors = useTranslations('errors');
  const tv = useIssueMessage('errors.validation');
  const { register: registerUser, login } = useAuth();

  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [success, setSuccess] = useState<boolean>(false);
  const [resent, setResent] = useState(false);

  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredData, setRegisteredData] = useState<RegisterInput | null>(null);
  const emailLocale = locale === 'en' ? 'en' : 'fr';

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { pickupMode: "address" },
  });
  const { register, handleSubmit, formState: { errors } } = form;

  const { register: registerCode, handleSubmit: handleCodeSubmit, formState: { errors: codeErrors, isSubmitting: isVerifying } } = useForm<VerifyCodeInput>({ resolver: zodResolver(verifyCodeSchema) });

  const onSubmit = async (data: RegisterInput) => {
    const result = await registerUser({ ...data, locale: emailLocale });
    if (result.success) {
      setRegisteredData(data);
      setStep("verify");
    }
  };

  const onVerifyCode = async (codeData: VerifyCodeInput) => {
    if (!registeredData) return;
    setResent(false);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registeredData.email,
          code: codeData.code,
          firstName: registeredData.firstName,
          lastName: registeredData.lastName,
          password: registeredData.password,
          phoneNumber: registeredData.phoneNumber,
          companyName: registeredData.companyName,
          billingAddress: registeredData.billingAddress,
          groupStatus: plan === 'group' ? 'PENDING' : 'SOLO',
          locale: emailLocale,
          pickupMode: registeredData.pickupMode,
          pickupAddress: registeredData.pickupAddress,
          pickupCity: registeredData.pickupCity,
          pickupPostalCode: registeredData.pickupPostalCode,
          receptionDate: registeredData.receptionDate,
          pickupNotes: registeredData.pickupNotes,
        }),
      });

      if (!res.ok) {
        useAuthStore.setState({ error: tErrors(await readErrorCode(res)) });
        return;
      }

      const loginResult = await login({
        identifier: registeredData.email,
        password: registeredData.password,
      });

      // Compte créé, mais connexion automatique impossible : on l'envoie se connecter
      if (!loginResult.success) {
        window.location.replace(`/${locale}/login`);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.replace(`/${locale}/dashboard`);
      }, 1000);
    } catch {
      useAuthStore.setState({ error: tErrors('serverError') });
    }
  };

  // Renvoie un nouveau code : register() remplace l'ancien code (5 nouveaux essais)
  const resendCode = async () => {
    if (!registeredData) return;
    setResent(false);
    const result = await registerUser({ ...registeredData, locale: emailLocale });
    if (result.success) setResent(true);
  };

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // Première erreur, quel que soit le champ (avant : seuls quelques champs étaient affichés)
  const firstFieldError = Object.values(errors).find((e) => e?.message)?.message;
  const errorMessage = tv(firstFieldError || codeErrors.code?.message) || error;

  // Un seul message à la fois : le plus pertinent gagne
  const feedback =
    success ? { className: styles.success, role: 'status', text: t('accountCreatedSuccessfully') }
    : isLoading ? { className: styles.loading, role: 'status', text: t('tryingToCreateAccount') }
    : errorMessage ? { className: styles.error, role: 'alert', text: errorMessage }
    : resent ? { className: styles.success, role: 'status', text: t('codeResent') }
    : step === 'verify' ? { className: styles.loading, role: 'status', text: t('lastStepToCreateAccount') }
    : null;

  return (
    <div className={styles.mainContainer}>
      <FormProvider {...form}>
        <form
          onSubmit={step === "register" ? handleSubmit(onSubmit) : handleCodeSubmit(onVerifyCode)}
          className="space-y-4 max-w-md"
        >
          {step === "register" && (<>

          <fieldset>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input className={styles.radioInput} type="radio" id="solo" name="groupStatus" value="solo" checked={plan === "solo"} onChange={() => onPlanChange('solo')} />
                <span className={styles.radioButton} style={{ borderRadius: '10px 0 0 10px' }}>
                  {t('formBtnSolo')}
                </span>
              </label>
              <label className={styles.radioLabel}>
                <input className={styles.radioInput} type="radio" id="group" name="groupStatus" value="group" checked={plan === "group"} onChange={() => onPlanChange('group')} />
                <span className={styles.radioButton} style={{ borderRadius: '0 10px 10px 0' }}>
                  {t('formBtnGroup')}
                </span>
              </label>
            </div>
          </fieldset>

          <GoogleLoginButton locale={locale} intent="register" groupStatus={plan} />

          <div className={styles.groupInputs}>
            <div className={styles.inputs}>
              <label htmlFor="registerFirstName" className="block text-sm font-medium">{t('formFirstName')} <span className={styles.req}>*</span></label>
              <input id="registerFirstName" autoComplete="given-name" {...register("firstName")} type="text" />
            </div>

            <div className={styles.inputs}>
              <label htmlFor="registerLastName" className="block text-sm font-medium">{t('formLastName')} <span className={styles.req}>*</span></label>
              <input id="registerLastName" autoComplete="family-name" {...register("lastName")} type="text" />
            </div>
          </div>

          <div className={styles.groupInputs}>
            <div className={styles.inputs}>
              <label htmlFor="registerPhoneNumber" className="block text-sm font-medium">{t('formPhoneNumber')} <span className={styles.req}>*</span></label>
              <input
                id="registerPhoneNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={14}
                placeholder="(514) 825-2709"
                {...register("phoneNumber")}
                onInput={(e) => { e.currentTarget.value = formatPhone(e.currentTarget.value); }}
              />
            </div>

            <div className={styles.inputs}>
              <label htmlFor="registerCompanyName" className="block text-sm font-medium">{t('formCompanyName')}</label>
              <input id="registerCompanyName" autoComplete="organization" {...register("companyName")} type="text" />
            </div>
          </div>

          <div className={styles.inputs}>
            <label htmlFor="registerEmail" className="block text-sm font-medium mb-1">{t('formEmail')} <span className={styles.req}>*</span></label>
            <input id="registerEmail" type="email" autoComplete="email" {...register("email")} disabled={isLoading} />
          </div>

          <div className={styles.groupInputs}>
            <div className={styles.inputs}>
              <label htmlFor="registerPassword" className="block text-sm font-medium mb-1">{t('formPassword')} <span className={styles.req}>*</span></label>
              <input id="registerPassword" type="password" autoComplete="new-password" {...register("password")} className="w-full px-3 py-2 border rounded" disabled={isLoading} />
            </div>

            <div className={styles.inputs}>
              <label htmlFor="registerConfirmPassword" className="block text-sm font-medium mb-1">{t('formConfirmPassword')} <span className={styles.req}>*</span></label>
              <input id="registerConfirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} className="w-full px-3 py-2 border rounded" disabled={isLoading} />
            </div>
          </div>

          <BillingAddressField />

          <PickupFields />

          </>)}

          {step === "verify" && (
          <div>
            <p style={{ textAlign: 'center', color: "#0E4D9A" }}>
              {t.rich('verificationCodeSent', {
                email: registeredData?.email ?? '',
                bold: (chunks) => <span style={{ fontWeight: 700 }}>{chunks}</span>,
              })}
            </p>
            <div className={styles.inputs}>
              <label htmlFor="verifyCode" className="block text-sm font-medium">{t('verificationCode')}</label>
              <input
                id="verifyCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                {...registerCode("code")}
                className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest"
                disabled={isLoading}
              />
              <button type="button" className={styles.linkButton} onClick={resendCode} disabled={isLoading}>
                {t('resendCode')}
              </button>
            </div>
          </div>
          )}

          {feedback && (
            <div className={feedback.className} role={feedback.role}>
              {feedback.text}
            </div>
          )}

          <button type="submit" disabled={isLoading || isVerifying || success} className={styles.btnConnection}>
            {step === "register" ? t('register') : t('confirmVerificationCode')}
          </button>
        </form>
      </FormProvider>
    </div>
  );
}