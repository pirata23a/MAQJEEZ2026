import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type MLAccount } from "@/data/ml";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/context/toast-context";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "No se pudo conectar con el servidor");

type ConnectInput = { nickname: string; site: MLAccount["site"]; email: string };

type MLState = {
  accounts: MLAccount[];
  totals: { listings: number; questions: number; messages: number; salesToday: number };
  connect: (input: ConnectInput) => Promise<void>;
  disconnect: (id: string) => Promise<void>;
  makeDefault: (id: string) => Promise<void>;
  sync: (id: string) => Promise<void>;
};

const Ctx = createContext<MLState | null>(null);

export function MLProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [accounts, setAccounts] = useState<MLAccount[]>([]);

  const reload = useCallback(() => api<MLAccount[]>("/ml").then(setAccounts), []);

  useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const value = useMemo<MLState>(
    () => ({
      accounts,
      totals: {
        listings: accounts.reduce((a, x) => a + x.activeListings, 0),
        questions: accounts.reduce((a, x) => a + x.pendingQuestions, 0),
        messages: accounts.reduce((a, x) => a + x.pendingMessages, 0),
        salesToday: accounts.reduce((a, x) => a + x.salesToday, 0),
      },
      connect: async (input) => {
        try {
          await api("/ml", { method: "POST", body: input });
          await reload();
          toast("Cuenta de Mercado Libre conectada");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
      disconnect: async (id) => {
        try {
          await api(`/ml/${id}`, { method: "DELETE" });
          await reload();
          toast("Cuenta desconectada");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
      makeDefault: async (id) => {
        try {
          await api(`/ml/${id}`, { method: "PATCH", body: { makeDefault: true } });
          await reload();
          toast("Cuenta principal actualizada");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
      sync: async (id) => {
        try {
          await api(`/ml/${id}`, { method: "PATCH", body: { sync: true } });
          await reload();
          toast("Cuenta sincronizada");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
    }),
    [accounts, reload, toast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useML() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useML must be used within MLProvider");
  return v;
}
