"use client";

import styles from './RegisterForm.module.css';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "../../../types";
import { useAuth } from "../../../hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { z } from "zod";
import { GoogleLoginButton } from '../../googleLoginButton/GoogleLoginButton';

interface RegisterFormProps {
  locale: string;
  packageChoice: "group" | "solo" | 'none';
}

const verifyCodeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits").regex(/^\d{6}$/, "Code must contain only digits"),
});

type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export function RegisterForm({ locale, packageChoice }: RegisterFormProps) {
  const router = useRouter();
  const { register: registerUser, login } = useAuth();

  const [groupStatus, setGroupStatus] = useState<"solo" | "group" | null>(null);

  const error = useAuthStore((state) => state.error);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [success, setSuccess] = useState<boolean>(false);

  const [step, setStep] = useState<"register" | "verify">("register");
  const [registeredData, setRegisteredData] = useState<RegisterInput | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema)});
  const { register: registerCode, handleSubmit: handleCodeSubmit, formState: { errors: codeErrors } } = useForm<VerifyCodeInput>({ resolver: zodResolver(verifyCodeSchema), });

  const onSubmit = async (data: RegisterInput) => {
    const result = await registerUser(data);
    if (result.success) {
      setRegisteredData(data);
      setStep("verify");
    }
  };

  const onVerifyCode = async (codeData: VerifyCodeInput) => {
    if (!registeredData) return;

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
          groupStatus: groupStatus === 'group' ? 'PENDING' : 'SOLO',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Verification failed");
      }

      await login({
        email: registeredData.email,
        password: registeredData.password,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Verification failed";
      useAuthStore.setState({ error: errorMessage });
    }
  };

  useEffect(() => {
    if (packageChoice === 'none') {
      router.push(`/${locale}/services`);
    } else if (packageChoice === 'solo' || packageChoice === 'group') {
      setGroupStatus(packageChoice);
    }
  }, [packageChoice, locale, router]);

  // Si on redirige, ne pas afficher le formulaire
  if (packageChoice === 'none' || groupStatus === null) {
    return null;
  }

  return (
    <div className={styles.mainContainer}>
      <form onSubmit={step === "register" ? handleSubmit(onSubmit) : handleCodeSubmit(onVerifyCode)} className="space-y-4 max-w-md">
        
        {/* Step 1: Registration */}
        {step === "register" && (<>

        <fieldset>
            <legend>dasdasdsadasdsa</legend>
            <div className={styles.userChoice}>
                <label className={groupStatus === 'solo' ? styles.checked : ''}>
                    <input type="radio" id="solo" name="groupStatus" value="solo" checked={groupStatus === "solo"} onChange={() => setGroupStatus('solo')} /> 
                    Forfait individuel
                </label>
                <label className={groupStatus === 'group' ? styles.checked : ''}>
                    <input type="radio" id="group" name="groupStatus" value="group" checked={groupStatus === "group"} onChange={() => setGroupStatus('group')}/>
                    Forfait équipe
                </label>
            </div>
        </fieldset>

        <GoogleLoginButton locale={locale} groupStatus={groupStatus} />

        <div className={styles.groupInputs}>
          <div className={styles.inputs}>
            <label htmlFor="registerFirstName" className="block text-sm font-medium">First Name <span className={styles.req}>*</span></label>
            <input
              id="registerFirstName"
              {...register("firstName")}
              type="text"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className={styles.inputs}>
            <label htmlFor="registerLastName" className="block text-sm font-medium">Last Name <span className={styles.req}>*</span></label>
            <input
              id="registerLastName"
              {...register("lastName")}
              type="text"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
        
        <div className={styles.groupInputs}>
          <div className={styles.inputs}>
            <label htmlFor="registerPhoneNumber" className="block text-sm font-medium">Phone number <span className={styles.req}>*</span></label>
            <input
              id="registerPhoneNumber"
              {...register("phoneNumber")}
              type="text"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className={styles.inputs}>
            <label htmlFor="registerCompanyName" className="block text-sm font-medium">Company name</label>
            <input
              id="registerCompanyName"
              {...register("companyName")}
              type="text"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <div className={styles.inputs}>
          <label htmlFor="registerEmail" className="block text-sm font-medium mb-1">Email <span className={styles.req}>*</span></label>
          <input
            id="registerEmail"
            type="email"
            {...register("email")}
            className="w-full px-3 py-2 border rounded"
            disabled={isLoading}
          />
        </div>

        <div className={styles.groupInputs}>
          <div className={styles.inputs}>
            <label htmlFor="registerPassword" className="block text-sm font-medium mb-1">Password <span className={styles.req}>*</span></label>
            <input
              id="registerPassword"
              type="password"
              {...register("password")}
              className="w-full px-3 py-2 border rounded"
              disabled={isLoading}
            />
          </div>
          
          <div className={styles.inputs}>
            <label htmlFor="registerPassword" className="block text-sm font-medium mb-1">Confirm password <span className={styles.req}>*</span></label>
            <input
              id="registerPassword"
              type="password"
              {...register("confirmPassword")}
              className="w-full px-3 py-2 border rounded"
              disabled={isLoading}
            />
          </div>
        </div>
        </>)}

        {/* Step 2: Verify Code */}
        {step === "verify" && (
        <div>
          <p style={{ textAlign: 'center', color: "#0E4D9A" }}>Un code de vérification a été envoyé à <span style={{ fontWeight: '700' }}>{registeredData?.email}</span></p>
          <div className={styles.inputs}>
            <label htmlFor="verifyCode" className="block text-sm font-medium">Code de vérification</label>
            <input
              id="verifyCode"
              type="text"
              maxLength={6}
              placeholder="000000"
              {...registerCode("code")}
              className="w-full px-3 py-2 border rounded text-center text-2xl tracking-widest"
              disabled={isLoading}
            />
          </div>
        </div>
        )}

        {(errors.root || codeErrors.code || errors.confirmPassword || error) &&
        <div className={styles.error}>
          {errors.root?.message || codeErrors.code?.message || errors.confirmPassword?.message || error }
        </div>}
        
        {success ? (
          <div className={styles.success}>
            Creation de votre compte reussie
          </div>
        ) : (isLoading || step === "verify") && (
          <div className={styles.loading}>
            {isLoading ? 'Tentative de creation du compte...' : 'Une derniere etape avant la creation du compte'}
          </div>
        )}

        <button type="submit" disabled={isLoading} className={styles.btnConnection}>
          {step === "register" ? 'S\'inscrire' : 'Confirmer le code de verification'}
        </button>
      </form>
    </div>
  );
}