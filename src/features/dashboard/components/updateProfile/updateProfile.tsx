"use client";

import styles from "./updateProfile.module.css";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProfileSchema,
  updatePasswordSchema,
  type UpdateProfileInput,
  type UpdatePasswordInput,
} from "@/features/auth/types";
import { useSession } from "next-auth/react";
import { User } from "next-auth";

interface UpdateProfileProps {
  sessionUser?: User; // ou type complet
  onClose: () => void;
}

export default function UpdateProfile({ sessionUser, onClose }: UpdateProfileProps) {
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);


  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      companyName: "",
      groupStatus: "SOLO",
    },
  });

  useEffect(() => {
    if (sessionUser) {
      resetProfile({
        firstName: sessionUser.firstName || "",
        lastName: sessionUser.lastName || "",
        email: sessionUser.email || "",
        phoneNumber: sessionUser.phoneNumber || "",
        companyName: sessionUser.companyName || "",
        groupStatus: sessionUser.groupStatus || "SOLO",
      });
    }
  }, [sessionUser, resetProfile]);

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmitProfile = async (data: UpdateProfileInput) => {
    try {
      setIsLoading(true);
      setProfileSuccess(null);

      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Update failed");
      }

      setProfileSuccess("Profile updated successfully");
      await update();

      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Update failed";
      setProfileSuccess(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitPassword = async (data: UpdatePasswordInput) => {
    try {
      setIsLoading(true);
      setPasswordSuccess(null);

      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Update failed");
      }

      setPasswordSuccess("Password updated successfully");
      resetPassword();

      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Update failed";
      setPasswordSuccess(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.fixedContainer}>
      <div className={styles.mainContainer}>
        <div className={styles.header}>
          <h2>Update Profile</h2>
          <button onClick={onClose}>
            Fermer
          </button>
        </div>

        {/* Profile Form */}
        <div className={styles.personalInfos}>
          <h3 className="text-xl font-semibold mb-4">Profile Information</h3>

          {profileSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">

            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">First Name</label>
                <input
                  {...registerProfile("firstName")}
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                />
                {profileErrors.firstName && (
                  <span className="text-red-500 text-sm">
                    {profileErrors.firstName.message}
                  </span>
                )}
              </div>

              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Last Name</label>
                <input
                  {...registerProfile("lastName")}
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                />
                {profileErrors.lastName && (
                  <span className="text-red-500 text-sm">
                    {profileErrors.lastName.message}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Email</label>
                <input
                  {...registerProfile("email")}
                  type="email"
                  className="w-full px-3 py-2 border rounded"
                />
                {profileErrors.email && (
                  <span className="text-red-500 text-sm">
                    {profileErrors.email.message}
                  </span>
                )}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Phone Number</label>
                <input
                  {...registerProfile("phoneNumber")}
                  type="tel"
                  className="w-full px-3 py-2 border rounded"
                />
                {profileErrors.phoneNumber && (
                  <span className="text-red-500 text-sm">
                    {profileErrors.phoneNumber.message}
                  </span>
                )}
              </div>

              <div className={styles.inputs}>
                <label className="block text-sm font-medium">Company Name</label>
                <input
                  {...registerProfile("companyName")}
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                />
                {profileErrors.companyName && (
                  <span className="text-red-500 text-sm">
                    {profileErrors.companyName.message}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.accountStatus}>
              {sessionUser?.role === "groupAdmin" ? <span className={styles.role}>Administrateur</span> : <span className={styles.role}>User</span>}
              {sessionUser?.groupStatus === "SOLO" &&<span className={styles.solo}>solo</span>}
              {sessionUser?.groupStatus === "PENDING" &&<span className={styles.pending}>En attente de rejoindre un groupe</span>}
              {sessionUser?.groupStatus === "JOINED" &&<span className={styles.joined}>PancarteExpress</span>}
            </div>

            <div className={styles.btnSave}>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        
          <h3 className="text-xl font-semibold mb-4">Change Password</h3>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">
                  Current Password
                </label>
                <input
                  {...registerPassword("currentPassword")}
                  type="password"
                  className="w-full px-3 py-2 border rounded"
                />
                {passwordErrors.currentPassword && (
                  <span className="text-red-500 text-sm">
                    {passwordErrors.currentPassword.message}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputs}>
                <label className="block text-sm font-medium">New Password</label>
                <input
                  {...registerPassword("newPassword")}
                  type="password"
                  className="w-full px-3 py-2 border rounded"
                />
                {passwordErrors.newPassword && (
                  <span className="text-red-500 text-sm">
                    {passwordErrors.newPassword.message}
                  </span>
                )}
              </div>

              <div className={styles.inputs}>
                <label className="block text-sm font-medium">
                  Confirm Password
                </label>
                <input
                  {...registerPassword("confirmPassword")}
                    type="password"
                    className="w-full px-3 py-2 border rounded"
                />
                {passwordErrors.confirmPassword && (
                  <span className="text-red-500 text-sm">
                    {passwordErrors.confirmPassword.message}
                  </span>
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