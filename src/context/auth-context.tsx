import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken } from "@/lib/api";

export type AuthUser = { id: string; name: string; email: string; role: string };
export type AuthCompany = { id: string; name: string; cuit: string };

type AuthResponse = { token: string; user: AuthUser; company: AuthCompany };
type MeResponse = { user: AuthUser; company: AuthCompany };

type Status = "loading" | "authed" | "guest";

type AuthState = {
  status: Status;
  user: AuthUser | null;
  company: AuthCompany | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { company: string; name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<AuthCompany | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api<MeResponse>("/me");
        if (!alive) return;
        setUser(me.user);
        setCompany(me.company);
        setStatus("authed");
      } catch {
        if (!alive) return;
        setToken(null);
        setStatus("guest");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const apply = (r: AuthResponse) => {
    setToken(r.token);
    setUser(r.user);
    setCompany(r.company);
    setStatus("authed");
  };

  const value: AuthState = {
    status,
    user,
    company,
    login: async (email, password) => {
      const r = await api<AuthResponse>("/auth/login", { method: "POST", body: { email, password } });
      apply(r);
    },
    register: async (input) => {
      const r = await api<AuthResponse>("/auth/register", { method: "POST", body: input });
      apply(r);
    },
    logout: () => {
      setToken(null);
      setUser(null);
      setCompany(null);
      setStatus("guest");
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
