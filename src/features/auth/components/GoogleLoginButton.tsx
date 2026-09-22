"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export function GoogleLoginButton() {
  const handleGoogleSignIn = async () => {
    await signIn("google", { redirect: true, callbackUrl: "/services" });
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full px-4 py-2 border border-gray-300 rounded font-medium flex items-center justify-center gap-2 hover:bg-gray-50"
    >
      <FcGoogle size={20} />
      Se connecter avec Google
    </button>
  );
}