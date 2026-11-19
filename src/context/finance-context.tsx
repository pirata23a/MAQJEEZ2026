import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { entryMeta, type Supplier, type PayMethod, type EntryKind } from "@/data/finance";
import { api, ApiError } from "@/lib/api";
import { useProducts } from "@/context/products-context";
import { usePos } from "@/context/pos-context";
import { useToast } from "@/context/toast-context";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "No se pudo conectar con el servidor");

export type PurchaseLine = { productId: string; qty: number; unitCost: number };

export type FinanceEntry = {
  id: string;
  kind: Exclude<EntryKind, "venta">;
  concept: string;
  amount: number;
  method: PayMethod;
  supplierId?: string;
  onAccount: boolean;
  at: string;
};

export type LedgerItem = {
  id: string;
  kind: EntryKind;
  concept: string;
  amount: number;
  dir: "in" | "out";
  method?: PayMethod;
  at: string;
};

type FinanceState = {
  suppliers: Supplier[];
  entries: FinanceEntry[];
  ledger: LedgerItem[];
  totals: { income: number; expense: number; balance: number };
  addSupplier: (name: string, cuit: string) => Promise<void>;
  registerPurchase: (input: { supplierId: string; lines: PurchaseLine[]; method: PayMethod }) => Promise<void>;
  registerExpense: (input: { category: string; vendor?: string; description: string; amount: number; method: PayMethod }) => Promise<void>;
  payToSupplier: (input: { supplierId: string; amount: number; method: PayMethod }) => Promise<void>;
};

const Ctx = createContext<FinanceState | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { reload: reloadProducts } = useProducts();
  const { sales } = usePos();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);

  const reloadSuppliers = useCallback(() => api<Supplier[]>("/suppliers").then(setSuppliers), []);
  const reloadEntries = useCallback(() => api<FinanceEntry[]>("/finance/entries").then(setEntries), []);

  useEffect(() => {
    reloadSuppliers().catch(() => {});
    reloadEntries().catch(() => {});
  }, [reloadSuppliers, reloadEntries]);

  const value = useMemo<FinanceState>(() => {
    const saleItems: LedgerItem[] = sales.map((s) => ({
      id: s.id,
      kind: "venta",
      concept: `Venta local · ${s.lines.length} ítems`,
      amount: s.total,
      dir: "in",
      method: s.payment as PayMethod,
      at: s.at,
    }));
    const entryItems: LedgerItem[] = entries
      .filter((e) => !(e.kind === "compra" && e.onAccount))
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        concept: e.concept,
        amount: e.amount,
        dir: entryMeta[e.kind].dir,
        method: e.method,
        at: e.at,
      }));
    const ledger = [...saleItems, ...entryItems].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
    const income = ledger.filter((l) => l.dir === "in").reduce((a, l) => a + l.amount, 0);
    const expense = ledger.filter((l) => l.dir === "out").reduce((a, l) => a + l.amount, 0);

    return {
      suppliers,
      entries,
      ledger,
      totals: { income, expense, balance: income - expense },
      addSupplier: async (name, cuit) => {
        try {
          await api("/suppliers", { method: "POST", body: { name, cuit } });
          await reloadSuppliers();
          toast("Proveedor creado");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
      registerPurchase: async (input) => {
        try {
          await api("/finance/purchase", { method: "POST", body: input });
          await Promise.all([reloadSuppliers(), reloadEntries(), reloadProducts()]);
          toast("Compra registrada y stock cargado");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
      registerExpense: async (input) => {
        try {
          await api("/finance/expense", { method: "POST", body: input });
          await reloadEntries();
          toast("Gasto registrado");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
      payToSupplier: async (input) => {
        try {
          await api("/finance/supplier-payment", { method: "POST", body: input });
          await Promise.all([reloadSuppliers(), reloadEntries()]);
          toast("Pago registrado");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
    };
  }, [suppliers, entries, sales, reloadSuppliers, reloadEntries, reloadProducts, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinance() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFinance must be used within FinanceProvider");
  return v;
}
