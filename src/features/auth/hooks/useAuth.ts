import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";
import { useAuthStore } from "../store/authStore";
import { useCallback, useEffect } from "react";
import type { LoginInput, RegisterInput } from "../types";

export function useAuth() {
  const { setError, setLoading, clearError, logout: logoutStore } = useAuthStore();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.user && session.user.email) {
      const sessionUser = session.user as {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role?: "user" | "admin";
        groupId?: string | null;
        emailVerified?: Date | null;
      };

      useAuthStore.setState({
        user: {
          id: sessionUser.id,
          email: sessionUser.email,
          firstName: sessionUser.firstName || null,
          lastName: sessionUser.lastName || null,
          role: (sessionUser.role as "user" | "admin") || "user",
          groupId: sessionUser.groupId || null,
          emailVerified: sessionUser.emailVerified || null,
        },
      });
    } else if (status === "unauthenticated") {
      logoutStore();
    }
  }, [session, status, logoutStore]);

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

        if (result?.error) {
          throw new Error(result.error === "CredentialsSignin" ? "Identifiants invalides" : result.error);
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

        return { success: true, data: input };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Registration failed";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [clearError, setLoading, setError]
  );

  const logout = useCallback(async () => {
    await nextAuthSignOut({ redirect: false });
    logoutStore();
  }, [logoutStore]);

  return {
    login,
    register,
    logout,
    isAuthenticated: status === "authenticated",
    isLoading: useAuthStore((state) => state.isLoading),
    user: useAuthStore((state) => state.user),
  };
}