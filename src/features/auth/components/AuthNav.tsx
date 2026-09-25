"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  locale: string;
}

export function AuthNav({ locale }: LoginFormProps) {
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}`);
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="text-sm px-3 py-2 hover:bg-gray-100 rounded"
        >
          Mon compte
        </button>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-2 hover:bg-gray-100 rounded"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={`/${locale}/login`} className="text-sm px-3 py-2 hover:bg-gray-100 rounded">
        Connexion
      </Link>
      <Link href={`/${locale}/register`} className="text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Sinscrire
      </Link>
    </div>
  );
}