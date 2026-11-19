import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Receipt,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  Store,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HelpAccordion } from "@/components/HelpAccordion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Drawer";
import { ExpenseDrawer, PurchaseDrawer, SupplierPaymentDrawer } from "@/components/FinanceDrawers";
import { HandCoins } from "lucide-react";
import { usePos, paymentMethods, type PaymentMethod, type Sale } from "@/context/pos-context";
import { useFinance } from "@/context/finance-context";
import { money, num, cn } from "@/lib/utils";

type Panel = null | "venta" | "gasto" | "compra" | "pago";

function isToday(at: string) {
  const d = new Date(at.includes("T") ? at : at.replace(" ", "T"));
  return d.toDateString() === new Date().toDateString();
}

export function LocalFisico() {
  const { sales, todayTotal } = usePos();
  const { ledger } = useFinance();
  const [panel, setPanel] = useState<Panel>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const hoy = useMemo(() => {
    const ventasHoy = sales.filter((s) => s.status !== "anulada" && isToday(s.at));
    const egresosHoy = ledger.filter((l) => l.dir === "out" && isToday(l.at));
    return {
      ventasCount: ventasHoy.length,
      ventasTotal: ventasHoy.reduce((a, s) => a + s.total, 0),
      gastosTotal: egresosHoy.reduce((a, l) => a + l.amount, 0),
    };
  }, [sales, ledger]);

  const actions = [
    {
      id: "venta" as const,
      icon: ShoppingCart,
      tone: "success",
      title: "Registrar venta",
      desc: "Cargá una venta del mostrador y cobrá (efectivo, débito, etc.).",
    },
    {
      id: "gasto" as const,
      icon: Receipt,
      tone: "danger",
      title: "Registrar gasto",
      desc: "Gastos del día: mercadería, servicios, sueldos, lo que sea.",
    },
    {
      id: "compra" as const,
      icon: ShoppingBag,
      tone: "brand",
      title: "Compra a proveedor",
      desc: "Mercadería que le comprás a un proveedor (suma stock).",
    },
    {
      id: "pago" as const,
      icon: HandCoins,
      tone: "warning",
      title: "Pago a proveedor",
      desc: "Pagás a un proveedor y se descuenta de su saldo (cuenta corriente).",
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Local físico · Caja del día"
        subtitle="Cargá lo del día: ventas, gastos y compras a proveedores."
        actions={
          <div className="hidden text-right sm:block">
            <p className="text-[12px] text-muted">Ventas de hoy</p>
            <p className="font-bold text-fg tnum">
              {money(todayTotal || hoy.ventasTotal)}{" "}
              <span className="text-[12px] font-normal text-muted">· {num(hoy.ventasCount)} tickets</span>
            </p>
          </div>
        }
      />

      <HelpAccordion
        title="¿Qué cargo desde el Local?"
        intro={
          <>
            Esta es tu <strong className="text-fg">caja diaria</strong>. Elegí qué querés cargar: una
            venta, un gasto o una compra a proveedor. Todo queda registrado en Ventas y en Finanzas.
          </>
        }
        steps={[
          { title: "Registrar venta", desc: "Cargás los ítems (concepto y precio), elegís el pago y cobrás. Queda en Ventas." },
          { title: "Registrar gasto", desc: "Cualquier gasto del día (mercadería, servicios, etc.). Queda en Finanzas como egreso." },
          { title: "Compra a proveedor", desc: "Lo que le comprás a un proveedor: suma stock y registra el egreso (o cuenta corriente)." },
        ]}
      />

      {/* 3 acciones */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => setPanel(a.id)}
            className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-surface p-6 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop"
          >
            <span
              className={cn(
                "grid h-12 w-12 place-items-center rounded-xl",
                a.tone === "success" && "bg-success/12 text-success",
                a.tone === "danger" && "bg-danger/12 text-danger",
                a.tone === "brand" && "bg-brand/12 text-brand",
              )}
            >
              <a.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-[15px] font-semibold text-fg">
                {a.title}
                <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
              </p>
              <p className="mt-1 text-[13px] leading-snug text-muted">{a.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* resumen de hoy */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-[13px] text-muted">Ventas de hoy</p>
          <p className="mt-1 text-2xl font-bold text-success tnum">{money(hoy.ventasTotal)}</p>
          <p className="text-[12px] text-muted tnum">{num(hoy.ventasCount)} tickets</p>
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted">Gastos de hoy</p>
          <p className="mt-1 text-2xl font-bold text-danger tnum">{money(hoy.gastosTotal)}</p>
          <p className="text-[12px] text-muted">salidas de caja</p>
        </Card>
        <Card className="col-span-2 p-5 lg:col-span-1">
          <p className="text-[13px] text-muted">Resultado del día</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold tnum",
              hoy.ventasTotal - hoy.gastosTotal < 0 ? "text-danger" : "text-fg",
            )}
          >
            {money(hoy.ventasTotal - hoy.gastosTotal)}
          </p>
          <p className="text-[12px] text-muted">ventas menos gastos</p>
        </Card>
      </div>

      {lastSale && (
        <div className="mt-4">
          <SaleSuccess sale={lastSale} onClose={() => setLastSale(null)} />
        </div>
      )}

      <VentaRapidaDrawer
        open={panel === "venta"}
        onClose={() => setPanel(null)}
        onDone={(s) => {
          setLastSale(s);
          setPanel(null);
        }}
      />
      <ExpenseDrawer open={panel === "gasto"} onClose={() => setPanel(null)} />
      <PurchaseDrawer open={panel === "compra"} onClose={() => setPanel(null)} />
      <SupplierPaymentDrawer open={panel === "pago"} onClose={() => setPanel(null)} />
    </div>
  );
}

/* ---------- Venta rápida (sin catálogo) ---------- */
type Line = { name: string; qty: number; price: number };

function VentaRapidaDrawer({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (s: Sale) => void;
}) {
  const { registerSale } = usePos();
  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");
  const [paidWith, setPaidWith] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLines([]);
    setName("");
    setQty(1);
    setPrice(0);
    setPayment("efectivo");
    setPaidWith("");
  }, [open]);

  const addLine = () => {
    if (!name.trim() || price <= 0) return;
    setLines((l) => [...l, { name: name.trim(), qty: Math.max(1, qty), price }]);
    setName("");
    setQty(1);
    setPrice(0);
  };

  const total = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const paid = parseInt(paidWith || "0", 10) || 0;
  const change = payment === "efectivo" && paid > 0 ? Math.max(0, paid - total) : 0;
  const cashShort = payment === "efectivo" && paid > 0 && paid < total;

  const cobrar = async () => {
    if (lines.length === 0) return;
    setBusy(true);
    try {
      const sale = await registerSale({
        lines: lines.map((l) => ({ productId: "", name: l.name, qty: l.qty, price: l.price })),
        discount: 0,
        payment,
        paidWith: payment === "efectivo" && paid > 0 ? paid : null,
      });
      onDone(sale);
    } catch {
      /* toast de error ya mostrado */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar venta"
      subtitle="Cargá los ítems de la venta y cobrá. No hace falta que estén en el catálogo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={lines.length === 0 || cashShort || busy} onClick={cobrar}>
            Cobrar {money(total)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-bg p-3">
          <p className="mb-2 text-[13px] font-medium text-fg">Agregar ítem</p>
          <Field label="Concepto / producto">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Repuesto, mano de obra, varios…" />
          </Field>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="Cantidad">
              <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} />
            </Field>
            <Field label="Precio unitario">
              <Input type="number" min={0} value={price || ""} onChange={(e) => setPrice(Math.max(0, +e.target.value))} />
            </Field>
          </div>
          <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={addLine}>
            <Plus className="h-4 w-4" /> Agregar artículo
          </Button>
        </div>

        {lines.length > 0 && (
          <div className="space-y-1 rounded-xl border border-border">
            {lines.map((l, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-fg">{l.name}</span>
                <span className="text-muted tnum">{l.qty} × {money(l.price)}</span>
                <span className="w-20 text-right font-semibold text-fg tnum">{money(l.price * l.qty)}</span>
                <button onClick={() => setLines((p) => p.filter((_, x) => x !== i))} className="text-muted hover:text-danger" aria-label="Quitar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border px-3 py-2">
              <span className="font-medium text-fg">Total</span>
              <span className="text-lg font-bold text-fg tnum">{money(total)}</span>
            </div>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-fg">Medio de pago</p>
          <div className="flex flex-wrap gap-1.5">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayment(m.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  payment === m.id ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface text-muted hover:text-fg",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {payment === "efectivo" && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[13px] text-muted">
              Paga con <span>$</span>
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
      </div>
    </Drawer>
  );
}

function SaleSuccess({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <Card className="flex flex-col items-center px-6 py-7 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-success/12 text-success">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <h2 className="mt-3 text-lg font-semibold text-fg">Venta registrada</h2>
      <p className="font-mono text-[13px] text-muted">{sale.id}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-2xl font-bold text-fg tnum">{money(sale.total)}</span>
        {sale.paidWith != null && (
          <span className="mb-1 text-[13px] text-success">vuelto {money(sale.change)}</span>
        )}
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="outline" onClick={onClose}>
          <Store className="h-4 w-4" /> Facturar
        </Button>
        <Button onClick={onClose}>Listo</Button>
      </div>
    </Card>
  );
}
