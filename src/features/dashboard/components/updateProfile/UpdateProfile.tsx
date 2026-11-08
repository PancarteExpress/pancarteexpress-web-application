"use client";

import styles from "./UpdateProfile.module.css";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  updatePasswordSchema,
  type UpdateProfileInput,
  type UpdatePasswordInput,
} from "@/lib/auth/auth.schema";
import { useSession } from "next-auth/react";
import type { User } from "next-auth";
import { useTranslations } from "next-intl";
import { readErrorCode, type AppErrorCode } from "@/lib/errors/appError";
import AddressAutocomplete from "@/shared/components/addressAutocomplete/AddressAutocomplete";

// Erreurs serveur rattachées à un champ ; les autres s'affichent en message global
const PROFILE_ERROR_FIELDS: Partial<Record<AppErrorCode, keyof UpdateProfileInput>> = {
  emailChangeNotAllowed: "email",
};
const PASSWORD_ERROR_FIELDS: Partial<Record<AppErrorCode, keyof UpdatePasswordInput>> = {
  currentPasswordIncorrect: "currentPassword",
};

interface UpdateProfileProps {
  sessionUser?: User;
  onClose: () => void;
}

export default function UpdateProfile({ sessionUser, onClose }: UpdateProfileProps) {
  const { update } = useSession();
  const tErrors = useTranslations("errors");
  const [isLoading, setIsLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setError: setProfileFieldError,
    control: controlProfile,
    setValue: setProfileFieldValue,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      pickupAddress: "",
      pickupCity: "",
      pickupPostalCode: "",
      groupStatus: "SOLO",
    },
  });

  // Données de session : une seule source de reset
  useEffect(() => {
    if (!sessionUser) return;
    resetProfile((prev) => ({
      ...prev,
      firstName: sessionUser.firstName || "",
      lastName: sessionUser.lastName || "",
      email: sessionUser.email || "",
      phoneNumber: sessionUser.phoneNumber || "",
      companyName: sessionUser.companyName || "",
      groupStatus: sessionUser.groupStatus || "SOLO",
    }));
  }, [sessionUser, resetProfile]);

  // Adresse de ramassage enregistrée
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/pickup")
      .then((res) => res.json())
      .then((body: { pickup: { address: string | null; city: string | null; postalCode: string | null } | null }) => {
        if (cancelled) return;
        setProfileFieldValue("pickupAddress", body.pickup?.address ?? "");
        setProfileFieldValue("pickupCity", body.pickup?.city ?? "");
        setProfileFieldValue("pickupPostalCode", body.pickup?.postalCode ?? "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setProfileFieldValue]);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    setError: setPasswordFieldError,
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmitProfile = async (data: UpdateProfileInput) => {
    try {
      setIsLoading(true);
      setProfileSuccess(null);
      setProfileError(null);

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const code = await readErrorCode(res);
        const field = PROFILE_ERROR_FIELDS[code];
        if (field) setProfileFieldError(field, { type: "server", message: tErrors(code) });
        else setProfileError(tErrors(code));
        return;
      }

      setProfileSuccess("Profile updated successfully");
      await update();

      setTimeout(() => setProfileSuccess(null), 3000);
    } catch {
      setProfileError(tErrors("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: UpdatePasswordInput) => {
    try {
      setIsLoading(true);
      setPasswordSuccess(null);
      setPasswordError(null);

      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const code = await readErrorCode(res);
        const field = PASSWORD_ERROR_FIELDS[code];
        if (field) setPasswordFieldError(field, { type: "server", message: tErrors(code) });
        else setPasswordError(tErrors(code));
        return;
      }

      setPasswordSuccess("Password updated successfully");
      resetPassword();

      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch {
      setPasswordError(tErrors("serverError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.fixedContainer}>
      <div className={styles.mainContainer}>
        <div className={styles.header}>
          <h2>Update Profile</h2>
          <button onClick={onClose}>Fermer</button>
        </div>

        {/* Profile Form */}
        <div className={styles.personalInfos}>
          <h3 className="text-xl font-semibold mb-4">Profile Information</h3>

          {profileSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{profileSuccess}</div>
          )}

          {profileError && (
            <p role="alert" className={styles.formError}>{profileError}</p>
          )}

          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">First Name</label>
                <input {...registerProfile("firstName")} type="text" className="w-full px-3 py-2 border rounded" />
                {profileErrors.firstName && (
                  <span className="text-red-500 text-sm">{profileErrors.firstName.message}</span>
                )}
              </div>

              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Last Name</label>
                <input {...registerProfile("lastName")} type="text" className="w-full px-3 py-2 border rounded" />
                {profileErrors.lastName && (
                  <span className="text-red-500 text-sm">{profileErrors.lastName.message}</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Email</label>
                <input {...registerProfile("email")} type="email" readOnly className="w-full px-3 py-2 border rounded" />
                {profileErrors.email && (
                  <span className="text-red-500 text-sm">{profileErrors.email.message}</span>
                )}
              </div>

              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Phone Number</label>
                <input {...registerProfile("phoneNumber")} type="tel" className="w-full px-3 py-2 border rounded" />
                {profileErrors.phoneNumber && (
                  <span className="text-red-500 text-sm">{profileErrors.phoneNumber.message}</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label htmlFor="pickupAddress" className="block text-sm font-medium">Adresse de ramassage</label>
                <Controller
                  control={controlProfile}
                  name="pickupAddress"
                  render={({ field }) => (
                    <AddressAutocomplete
                      id="pickupAddress"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      inputRef={field.ref}
                      onSelect={(addr) => {
                        setProfileFieldValue(
                          "pickupAddress",
                          addr ? `${addr.streetNumber} ${addr.streetName}` : "",
                          { shouldValidate: true }
                        );
                        setProfileFieldValue("pickupCity", addr?.city ?? "");
                        setProfileFieldValue("pickupPostalCode", addr?.postalCode ?? "");
                      }}
                    />
                  )}
                />
                {profileErrors.pickupAddress && (
                  <span className="text-red-500 text-sm">{profileErrors.pickupAddress.message}</span>
                )}
              </div>

              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Company Name</label>
                <input {...registerProfile("companyName")} type="text" className="w-full px-3 py-2 border rounded" />
                {profileErrors.companyName && (
                  <span className="text-red-500 text-sm">{profileErrors.companyName.message}</span>
                )}
              </div>
            </div>

            <div className={styles.accountStatus}>
              {sessionUser?.role === "groupAdmin" ? <span className={styles.role}>Administrateur</span> : <span className={styles.role}>User</span>}
              {sessionUser?.groupStatus === "SOLO" && <span className={styles.solo}>solo</span>}
              {sessionUser?.groupStatus === "PENDING" && <span className={styles.pending}>En attente de rejoindre un groupe</span>}
              {sessionUser?.groupStatus === "JOINED" && <span className={styles.joined}>{sessionUser?.groupName}</span>}
            </div>

            <div className={styles.btnSave}>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          <h3 className="text-xl font-semibold mb-4">Change Password</h3>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{passwordSuccess}</div>
          )}

          {passwordError && (
            <p role="alert" className={styles.formError}>{passwordError}</p>
          )}

          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Current Password</label>
                <input {...registerPassword("currentPassword")} type="password" autoComplete="current-password" className="w-full px-3 py-2 border rounded" />
                {passwordErrors.currentPassword && (
                  <span className="text-red-500 text-sm">{passwordErrors.currentPassword.message}</span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">New Password</label>
                <input {...registerPassword("newPassword")} type="password" autoComplete="new-password" className="w-full px-3 py-2 border rounded" />
                {passwordErrors.newPassword && (
                  <span className="text-red-500 text-sm">{passwordErrors.newPassword.message}</span>
                )}
              </div>

              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Confirm Password</label>
                <input {...registerPassword("confirmPassword")} type="password" autoComplete="new-password" className="w-full px-3 py-2 border rounded" />
                {passwordErrors.confirmPassword && (
                  <span className="text-red-500 text-sm">{passwordErrors.confirmPassword.message}</span>
                )}
              </div>
            </div>

            <div className={styles.btnSave}>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}