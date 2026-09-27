"use client";

import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import styles from "./AuthNav.module.css"

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
      <div className={styles.mainContainer}>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-2 hover:bg-gray-100 rounded"
        >
          Déconnexion
        </button>
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="text-sm px-3 py-2 hover:bg-gray-100 rounded"
        >
          Mon compte
        </button>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <Link href={`/${locale}/register`} className="text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Devenir membre
      </Link>
      <Link href={`/${locale}/login`} className="text-sm px-3 py-2 hover:bg-gray-100 rounded">
        Connexion
      </Link>
    </div>
  );
}