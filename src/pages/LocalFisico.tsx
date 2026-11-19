import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  Store,
  Receipt,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Field, Select } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Drawer";
import { Thumb } from "@/components/ChannelPills";
import { useProducts, stockLevel } from "@/context/products-context";
import { usePos, paymentMethods, type PaymentMethod, type Sale } from "@/context/pos-context";
import { categories } from "@/data/products";
import { money, num, cn } from "@/lib/utils";

type Cart = Record<string, number>;

export function LocalFisico() {
  const { products, addProduct } = useProducts();
  const { registerSale, sales, todayTotal } = usePos();

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState<Cart>({});
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");
  const [paidWith, setPaidWith] = useState("");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (cat !== "all" && p.category !== cat) return false;
        const q = query.trim().toLowerCase();
        if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q))
          return false;
        return true;
      }),
    [products, cat, query],
  );

  const add = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setCart((c) => {
      const next = (c[id] ?? 0) + 1;
      if (next > p.stock) return c;
      return { ...c, [id]: next };
    });
  };
  const dec = (id: string) =>
    setCart((c) => {
      const next = (c[id] ?? 0) - 1;
      const copy = { ...c };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  const removeLine = (id: string) =>
    setCart((c) => {
      const copy = { ...c };
      delete copy[id];
      return copy;
    });

  const lines = Object.entries(cart).map(([id, qty]) => {
    const p = products.find((x) => x.id === id)!;
    return { productId: id, name: p.name, qty, price: p.price, category: p.category };
  });
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const paid = parseInt(paidWith || "0", 10) || 0;
  const change = payment === "efectivo" && paid > 0 ? Math.max(0, paid - total) : 0;
  const cashShort = payment === "efectivo" && paid > 0 && paid < total;

  const createQuick = async (draft: Parameters<typeof addProduct>[0]) => {
    const created = await addProduct(draft);
    if (created) {
      setCart((c) => ({ ...c, [created.id]: 1 }));
      setQuickOpen(false);
    }
  };

  const checkout = async () => {
    if (lines.length === 0) return;
    try {
      const sale = await registerSale({
        lines: lines.map(({ productId, name, qty, price }) => ({ productId, name, qty, price })),
        discount,
        payment,
        paidWith: payment === "efectivo" && paid > 0 ? paid : null,
      });
      setLastSale(sale);
      setCart({});
      setDiscount(0);
      setPaidWith("");
    } catch {
      /* el toast de error ya se mostró */
    }
  };

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Local físico · Punto de venta"
        subtitle="Vendé en el mostrador. Cada venta descuenta stock y queda registrada."
        actions={
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right">
              <p className="text-[12px] text-muted">Ventas de hoy</p>
              <p className="font-bold text-fg tnum">
                {money(todayTotal)} <span className="text-[12px] font-normal text-muted">· {num(sales.length)} tickets</span>
              </p>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* picker */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar producto o escanear SKU…"
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={() => setQuickOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4" />
              Producto nuevo
            </Button>
          </div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {["all", ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors",
                  cat === c
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border bg-surface text-muted hover:text-fg",
                )}
              >
                {c === "all" ? "Todos" : c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const out = p.stock <= 0;
              const inCart = cart[p.id] ?? 0;
              return (
                <button
                  key={p.id}
                  disabled={out}
                  onClick={() => add(p.id)}
                  className={cn(
                    "group relative flex flex-col rounded-2xl border border-border bg-surface p-3 text-left transition-all",
                    out
                      ? "cursor-not-allowed opacity-55"
                      : "hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop active:scale-[0.98]",
                  )}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <Thumb name={p.name} category={p.category} image={p.image} />
                    {inCart > 0 && (
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand px-1.5 text-[12px] font-bold text-brand-fg tnum">
                        {inCart}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 min-h-[2.5em] text-[13px] font-medium leading-tight text-fg">
                    {p.name}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-semibold text-fg tnum">{money(p.price)}</span>
                    {out ? (
                      <Badge tone="danger">Sin stock</Badge>
                    ) : stockLevel(p) === "low" ? (
                      <Badge tone="warning">{p.stock}</Badge>
                    ) : (
                      <span className="text-[12px] text-muted tnum">{p.stock} u.</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ticket */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {lastSale ? (
            <SaleSuccess sale={lastSale} onNew={() => setLastSale(null)} />
          ) : (
            <Card className="flex max-h-[calc(100dvh-8rem)] flex-col">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h2 className="flex items-center gap-2 font-semibold text-fg">
                  <Receipt className="h-[18px] w-[18px] text-brand" />
                  Ticket
                </h2>
                {lines.length > 0 && (
                  <button
                    onClick={() => setCart({})}
                    className="text-[13px] font-medium text-muted hover:text-danger"
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {lines.length === 0 ? (
                <div className="grid flex-1 place-items-center gap-2 px-6 py-14 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted" />
                  <p className="text-sm text-muted">Tocá un producto para agregarlo al ticket.</p>
                </div>
              ) : (
                <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
                  {lines.map((l) => (
                    <div key={l.productId} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-surface-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-fg">{l.name}</p>
                        <p className="text-[12px] text-muted tnum">
                          {l.qty} × {money(l.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <StepBtn onClick={() => dec(l.productId)}>
                          <Minus className="h-3.5 w-3.5" />
                        </StepBtn>
                        <span className="w-6 text-center text-sm font-semibold tnum">{l.qty}</span>
                        <StepBtn onClick={() => add(l.productId)}>
                          <Plus className="h-3.5 w-3.5" />
                        </StepBtn>
                        <button
                          onClick={() => removeLine(l.productId)}
                          className="ml-1 grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger"
                          aria-label="Quitar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="w-20 text-right text-[13px] font-semibold text-fg tnum">
                        {money(l.price * l.qty)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {lines.length > 0 && (
                <div className="space-y-3 border-t border-border px-5 py-4">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-medium text-fg tnum">{money(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted">Descuento</span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted">$</span>
                      <input
                        type="number"
                        min={0}
                        value={discount || ""}
                        onChange={(e) => setDiscount(Math.max(0, +e.target.value))}
                        placeholder="0"
                        className="h-8 w-24 rounded-lg border border-border bg-bg px-2 text-right text-sm text-fg tnum focus:border-brand focus:bg-surface"
                      />
                    </div>
                  </div>
                  <div className="flex items-end justify-between border-t border-border pt-3">
                    <span className="font-medium text-fg">Total</span>
                    <span className="text-2xl font-bold tracking-tight text-fg tnum">{money(total)}</span>
                  </div>

                  {/* payment */}
                  <div className="flex flex-wrap gap-1.5">
                    {paymentMethods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPayment(m.id)}
                        className={cn(
                          "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                          payment === m.id
                            ? "border-brand bg-brand/10 text-brand"
                            : "border-border bg-surface text-muted hover:text-fg",
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {payment === "efectivo" && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[13px] text-muted">
                        Paga con
                        <span>$</span>
                        <input
                          type="number"
                          min={0}
                          value={paidWith}
                          onChange={(e) => setPaidWith(e.target.value)}
                          placeholder="0"
                          className="h-8 w-24 rounded-lg border border-border bg-bg px-2 text-right text-sm text-fg tnum focus:border-brand focus:bg-surface"
                        />
                      </div>
                      <span className={cn("text-[13px] font-semibold tnum", cashShort ? "text-danger" : "text-success")}>
                        {cashShort ? "Falta " : "Vuelto "}
                        {money(cashShort ? total - paid : change)}
                      </span>
                    </div>
                  )}

                  <Button size="lg" className="w-full" disabled={cashShort} onClick={checkout}>
                    Cobrar {money(total)}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <QuickProductDrawer open={quickOpen} onClose={() => setQuickOpen(false)} onCreate={createQuick} />
    </div>
  );
}

function QuickProductDrawer({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: Parameters<ReturnType<typeof useProducts>["addProduct"]>[0]) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("Varios");
  const [stock, setStock] = useState(1);

  useEffect(() => {
    if (!open) return;
    setName("");
    setPrice(0);
    setCategory("Varios");
    setStock(1);
  }, [open]);

  const valid = name.trim() && price > 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Producto nuevo"
      subtitle="Cargá un producto que no está en el catálogo y se agrega al ticket."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            onClick={() =>
              onCreate({
                sku: `RAP-${Date.now().toString().slice(-6)}`,
                name: name.trim(),
                category,
                price,
                cost: Math.round(price * 0.66),
                stock: Math.max(1, stock),
                minStock: 0,
                alertOn: false,
                sold30: 0,
                soldTotal: 0,
                since: new Date().toISOString().slice(0, 10),
                channels: ["local"],
                image: null,
              })
            }
          >
            Crear y agregar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre del producto">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Repuesto varios" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio de venta">
            <Input type="number" min={0} value={price || ""} onChange={(e) => setPrice(Math.max(0, +e.target.value))} />
          </Field>
          <Field label="Stock inicial">
            <Input type="number" min={1} value={stock} onChange={(e) => setStock(Math.max(1, +e.target.value))} />
          </Field>
        </div>
        <Field label="Rubro">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <p className="rounded-lg border border-border bg-bg px-3 py-2 text-[12.5px] text-muted">
          Queda guardado en tu catálogo (Productos) y disponible para próximas ventas.
        </p>
      </div>
    </Drawer>
  );
}

function StepBtn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-lg border border-border text-fg/70 transition-colors hover:bg-surface-2 hover:text-fg active:scale-95"
    >
      {children}
    </button>
  );
}

function SaleSuccess({ sale, onNew }: { sale: Sale; onNew: () => void }) {
  const [facturaNote, setFacturaNote] = useState(false);
  return (
    <Card className="flex flex-col items-center px-6 py-8 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-success/12 text-success">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-fg">Venta registrada</h2>
      <p className="font-mono text-[13px] text-muted">{sale.id}</p>

      <div className="mt-5 w-full space-y-2 rounded-xl border border-border bg-bg p-4 text-left text-[13px]">
        {sale.lines.map((l) => (
          <div key={l.productId} className="flex justify-between">
            <span className="truncate pr-2 text-fg/80">
              {l.qty}× {l.name}
            </span>
            <span className="text-fg tnum">{money(l.price * l.qty)}</span>
          </div>
        ))}
        {sale.discount > 0 && (
          <div className="flex justify-between text-muted">
            <span>Descuento</span>
            <span className="tnum">-{money(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-fg">
          <span>Total</span>
          <span className="tnum">{money(sale.total)}</span>
        </div>
        {sale.paidWith != null && (
          <div className="flex justify-between text-success">
            <span>Vuelto</span>
            <span className="tnum">{money(sale.change)}</span>
          </div>
        )}
      </div>

      {facturaNote && (
        <p className="mt-4 w-full rounded-lg border border-border bg-bg px-3 py-2 text-[12.5px] text-muted">
          La facturación AFIP se habilita en la etapa final. La venta ya quedó registrada.
        </p>
      )}

      <div className="mt-5 flex w-full gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setFacturaNote(true)}>
          <Store className="h-4 w-4" />
          Facturar
        </Button>
        <Button className="flex-1" onClick={onNew}>
          Nueva venta
        </Button>
      </div>
    </Card>
  );
}
