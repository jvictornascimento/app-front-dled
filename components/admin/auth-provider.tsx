"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { UserDto } from "@/types/api";

interface AuthContextValue {
  user: UserDto | null;
  isHydrated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserDto | null) => void;
}

const STORAGE_KEY = "dled-control-user";
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserDto | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as UserDto) : null;
    } catch {
      return null;
    }
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHydrated: true,
      async login(username, password) {
        const response = await api.login({ username, password });
        setUserState(response.user);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user));
      },
      async logout() {
        try {
          await api.logout();
        } finally {
          setUserState(null);
          window.localStorage.removeItem(STORAGE_KEY);
        }
      },
      setUser(nextUser) {
        setUserState(nextUser);
        if (nextUser) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
          return;
        }
        window.localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
