"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  const [isHydrated, setIsHydrated] = useState(false);

  function persistUser(nextUser: UserDto | null) {
    setUserState(nextUser);
    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
  }

  useEffect(() => {
    let active = true;

    async function revalidateSession() {
      try {
        const currentUser = await api.me();
        if (!active) {
          return;
        }
        persistUser(currentUser);
      } catch {
        if (!active) {
          return;
        }
        persistUser(null);
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    }

    void revalidateSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isHydrated,
      async login(username, password) {
        const response = await api.login({ username, password });
        persistUser(response.user);
      },
      async logout() {
        try {
          await api.logout();
        } finally {
          persistUser(null);
        }
      },
      setUser(nextUser) {
        persistUser(nextUser);
      },
    }),
    [isHydrated, user],
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
