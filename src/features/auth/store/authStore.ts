import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin";
  groupId: string | null;
  emailVerified: Date | null;
}

interface AuthStore {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: false,
        error: null,

        setUser: (user) => set({ user, error: null }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        logout: () => set({ user: null, error: null }),
        clearError: () => set({ error: null }),
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ user: state.user }),
      }
    ),
    {
      name: "AuthStore",
    }
  )
);