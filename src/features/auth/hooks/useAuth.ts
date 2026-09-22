import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useAuthStore } from "../store/authStore";
import { useCallback, useEffect } from "react";
import type { LoginInput, RegisterInput } from "../types";

export function useAuth() {
  const { data: session, status } = useSession();
  const { user, setUser, setError, setLoading, clearError, logout } = useAuthStore();

  const isAuthenticated = status === "authenticated" && !!user;
  const isLoading = status === "loading";

  // Sync session avec store
  useEffect(() => {
    if (session?.user && session.user.email) {
      setUser({
        id: session.user.id as string,
        email: session.user.email,
        name: session.user.name || null,
        role: session.user.role || "user",
        groupId: session.user.groupId || null,
        emailVerified: session.user.emailVerified || null,
      });
    } else if (status === "unauthenticated") {
      logout();
    }
  }, [session, status, setUser, logout]);

  const login = useCallback(
    async (input: LoginInput) => {
      try {
        clearError();
        setLoading(true);

        const result = await nextAuthSignIn("credentials", {
          email: input.email,
          password: input.password,
          redirect: false,
        });

        if (!result?.ok) {
          throw new Error(result?.error || "Login failed");
        }

        return { success: true };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Login failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setError]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      try {
        clearError();
        setLoading(true);

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Registration failed");
        }

        // Auto-login après registration
        const loginResult = await login({
          email: input.email,
          password: input.password,
        });

        return loginResult;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Registration failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [login, clearError, setLoading, setError]
  );

  const logout_ = useCallback(async () => {
    try {
      await nextAuthSignOut({ redirect: false });
      logout();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout failed";
      setError(errorMessage);
    }
  }, [logout, setError]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error: useAuthStore((state) => state.error),
    login,
    register,
    logout: logout_,
    clearError,
  };
}