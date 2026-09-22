"use client";

import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

export function AuthNav() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm">{user.email}</span>
        <button
          onClick={() => logout()}
          className="text-sm px-3 py-2 hover:bg-gray-100 rounded"
        >
          Déconnexion
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/auth/login" className="text-sm px-3 py-2 hover:bg-gray-100 rounded">
        Connexion
      </Link>
      <Link href="/auth/register" className="text-sm px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Sinscrire
      </Link>
    </div>
  );
}