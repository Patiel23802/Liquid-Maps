import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  clearTokens,
  getAccessToken,
  setTokens,
} from "../api/client";

export type Me = {
  id: string;
  phone: string;
  name: string;
  username: string;
  onboardingCompleted: boolean;
  city: { id: string; name: string; slug: string } | null;
  primaryVibeId: number | null;
};

type AuthCtx = {
  me: Me | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (access: string, refresh: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api<Me>("/me", { method: "GET" });
      setMe(data);
    } catch {
      setMe(null);
      await clearTokens();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const signOut = useCallback(async () => {
    await clearTokens();
    setMe(null);
  }, []);

  const setSession = useCallback(async (access: string, refresh: string) => {
    await setTokens(access, refresh);
    await refreshMe();
  }, [refreshMe]);

  const value = useMemo(
    () => ({ me, loading, refreshMe, signOut, setSession }),
    [me, loading, refreshMe, signOut, setSession]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
