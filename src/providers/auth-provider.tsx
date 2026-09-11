"use client";

import { api } from "@/lib/api";
import { ApiRequestError } from "@/lib/api-error";
import {
  clearAuthSessionMarker,
  setAuthSessionMarker,
} from "@/lib/auth-session";
import { setUnauthorizedHandler } from "@/lib/api-error";
import type { UserPublic } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ReactNode, createContext, useContext, useEffect } from "react";

interface AuthContextValue {
  user: UserPublic | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await api.me();
        return res.user;
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) {
          return null;
        }
        throw err;
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setAuthSessionMarker();
      return;
    }
    if (!isLoading) {
      clearAuthSessionMarker();
    }
  }, [data, isLoading]);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      clearAuthSessionMarker();
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.removeQueries({ queryKey: ["kit"] });
      queryClient.removeQueries({ queryKey: ["practice"] });
      try {
        await api.logout();
      } catch {
        /* Session may already be invalid on the server. */
      }
      router.replace("/login?session=expired");
    });

    return () => setUnauthorizedHandler(null);
  }, [queryClient, router]);

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      clearAuthSessionMarker();
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.removeQueries({ queryKey: ["kit"] });
      queryClient.removeQueries({ queryKey: ["practice"] });
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: data ?? null,
        isLoading,
        isAuthenticated: !!data,
        logout,
        refresh: () => refetch(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
