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

interface UpdateProfileProps {
  onClose: () => void;
}

export default function UpdateProfile({ onClose }: UpdateProfileProps) {
  const { data: session, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  type SessionUser = { firstName?: string; lastName?: string; email?: string };
  const sessionUser = session?.user as SessionUser | undefined;

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
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: sessionUser?.firstName || "",
      lastName: sessionUser?.lastName || "",
      email: sessionUser?.email || "",
    },
  });

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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Update Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Profile Form */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Profile Information</h3>

          {profileSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {profileSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
            <div>
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

            <div>
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

            <div>
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

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        {/* Password Form */}
        <div className="border-t pt-8">
          <h3 className="text-xl font-semibold mb-4">Change Password</h3>

          {passwordSuccess && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
            <div>
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

            <div>
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

            <div>
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

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Update Password"}
            </button>
          </form>
        </div>

        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}