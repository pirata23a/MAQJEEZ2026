import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api";
import { useProducts } from "@/context/products-context";
import { useToast } from "@/context/toast-context";

export type PaymentMethod = "efectivo" | "debito" | "credito" | "mercadopago" | "transferencia";

export const paymentMethods: { id: PaymentMethod; label: string }[] = [
  { id: "efectivo", label: "Efectivo" },
  { id: "debito", label: "Débito" },
  { id: "credito", label: "Crédito" },
  { id: "mercadopago", label: "Mercado Pago" },
  { id: "transferencia", label: "Transferencia" },
];

export type SaleLine = { productId: string; name: string; qty: number; price: number };

export type Sale = {
  id: string;
  saleId?: string;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  total: number;
  payment: PaymentMethod;
  paidWith: number | null;
  change: number;
  status: "activa" | "anulada";
  at: string;
};

type PosState = {
  sales: Sale[];
  todayTotal: number;
  registerSale: (input: {
    lines: SaleLine[];
    discount: number;
    payment: PaymentMethod;
    paidWith: number | null;
  }) => Promise<Sale>;
  cancelSale: (saleId: string) => Promise<void>;
};

const Ctx = createContext<PosState | null>(null);

export function PosProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { reload: reloadProducts } = useProducts();
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    api<Sale[]>("/sales").then(setSales).catch(() => {});
  }, []);

  const value = useMemo<PosState>(
    () => ({
      sales,
      todayTotal: sales
        .filter((s) => s.status !== "anulada")
        .reduce((a, s) => a + s.total, 0),
      registerSale: async (input) => {
        try {
          const sale = await api<Sale>("/sales", { method: "POST", body: input });
          setSales((prev) => [sale, ...prev]);
          reloadProducts().catch(() => {});
          return sale;
        } catch (e) {
          toast(e instanceof ApiError ? e.message : "No se pudo registrar la venta", "error");
          throw e;
        }
      },
      cancelSale: async (saleId) => {
        try {
          const updated = await api<Sale>(`/sales/${saleId}/cancel`, { method: "POST" });
          setSales((prev) => prev.map((s) => (s.saleId === saleId ? { ...s, status: updated.status } : s)));
          reloadProducts().catch(() => {});
          toast("Venta anulada y stock devuelto");
        } catch (e) {
          toast(e instanceof ApiError ? e.message : "No se pudo anular la venta", "error");
        }
      },
    }),
    [sales, reloadProducts, toast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePos() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePos must be used within PosProvider");
  return v;
}
