import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialCombos, type Product, type Combo } from "@/data/products";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/context/toast-context";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "No se pudo conectar con el servidor");

type NewProduct = Omit<Product, "id">;

export type PriceMode = "set" | "incPct" | "decPct" | "incAmt" | "decAmt";
export type BulkPatch = {
  price?: { mode: PriceMode; value: number };
  category?: string;
  minStock?: number;
  alertOn?: boolean;
};

export const stockReasons = [
  { id: "venta-mostrador", label: "Venta en mostrador", dir: "out" },
  { id: "uso-servicio", label: "Uso en servicio / reparación", dir: "out" },
  { id: "consumo-interno", label: "Consumo interno", dir: "out" },
  { id: "merma", label: "Merma / rotura / vencimiento", dir: "out" },
  { id: "muestra", label: "Muestra / obsequio", dir: "out" },
  { id: "reposicion", label: "Reposición / compra", dir: "in" },
  { id: "devolucion", label: "Devolución de cliente", dir: "in" },
  { id: "ajuste", label: "Ajuste de inventario", dir: "both" },
] as const;

export type StockReasonId = (typeof stockReasons)[number]["id"];
export const reasonLabel = (id: string) =>
  stockReasons.find((r) => r.id === id)?.label ?? id;

export type StockMovement = {
  id: string;
  productId: string;
  delta: number;
  reason: StockReasonId;
  note: string;
  at: string;
  by: string;
  resulting: number;
};

type ProductsState = {
  products: Product[];
  combos: Combo[];
  movements: StockMovement[];
  loading: boolean;
  reload: () => Promise<void>;
  addProduct: (p: NewProduct) => Promise<Product | null>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<void>;
  bulkUpdate: (ids: string[], patch: BulkPatch) => Promise<void>;
  adjustStock: (id: string, delta: number, reason: StockReasonId, note?: string) => Promise<void>;
  sellUnits: (id: string, qty: number) => Promise<void>;
  restock: (id: string, qty: number) => Promise<void>;
  comboStock: (combo: Combo) => number;
};

const Ctx = createContext<ProductsState | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [combos] = useState<Combo[]>(initialCombos);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [p, m] = await Promise.all([
      api<Product[]>("/products"),
      api<StockMovement[]>("/movements"),
    ]);
    setProducts(p);
    setMovements(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload().catch(() => setLoading(false));
  }, [reload]);

  const adjustStock = useCallback(
    async (id: string, delta: number, reason: StockReasonId, note = "") => {
      try {
        const r = await api<{ product: Product; movement: StockMovement | null }>(
          `/products/${id}/adjust`,
          { method: "POST", body: { delta, reason, note } },
        );
        setProducts((prev) => prev.map((p) => (p.id === id ? r.product : p)));
        if (r.movement) setMovements((prev) => [r.movement as StockMovement, ...prev]);
        toast("Stock actualizado");
      } catch (e) {
        toast(errMsg(e), "error");
      }
    },
    [toast],
  );

  const value = useMemo<ProductsState>(() => {
    return {
      products,
      combos,
      movements,
      loading,
      reload,
      addProduct: async (p) => {
        try {
          const created = await api<Product>("/products", { method: "POST", body: p });
          setProducts((prev) => [created, ...prev]);
          toast("Producto creado");
          return created;
        } catch (e) {
          toast(errMsg(e), "error");
          return null;
        }
      },
      updateProduct: async (id, patch) => {
        try {
          const updated = await api<Product>(`/products/${id}`, { method: "PATCH", body: patch });
          setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
          toast("Cambios guardados");
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
      bulkUpdate: async (ids, patch) => {
        try {
          const list = await api<Product[]>("/products/bulk", { method: "POST", body: { ids, ...patch } });
          setProducts(list);
          toast(`${ids.length} productos actualizados`);
        } catch (e) {
          toast(errMsg(e), "error");
        }
      },
      adjustStock,
      sellUnits: (id, qty) => adjustStock(id, -Math.abs(qty), "venta-mostrador"),
      restock: (id, qty) => adjustStock(id, Math.abs(qty), "reposicion"),
      comboStock: (combo) =>
        Math.min(
          ...combo.items.map((it) => {
            const p = products.find((x) => x.sku === it.sku);
            return p ? Math.floor(p.stock / it.qty) : 0;
          }),
        ),
    };
  }, [products, combos, movements, loading, reload, adjustStock]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProducts() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProducts must be used within ProductsProvider");
  return v;
}

export type StockLevel = "out" | "low" | "ok";
export function stockLevel(p: Product): StockLevel {
  if (p.stock <= 0) return "out";
  if (p.stock <= p.minStock) return "low";
  return "ok";
}
