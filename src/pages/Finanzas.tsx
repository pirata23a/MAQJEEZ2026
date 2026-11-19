import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  ShoppingCart,
  Receipt,
  HandCoins,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HelpAccordion } from "@/components/HelpAccordion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  PurchaseDrawer,
  ExpenseDrawer,
  SupplierPaymentDrawer,
} from "@/components/FinanceDrawers";
import { useFinance } from "@/context/finance-context";
import { entryMeta, payMethods, type EntryKind } from "@/data/finance";
import { money, cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const methodLabel = (id?: string) => payMethods.find((m) => m.id === id)?.label ?? "—";

const filters: { id: EntryKind | "all"; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "venta", label: "Ventas" },
  { id: "compra", label: "Compras" },
  { id: "gasto", label: "Gastos" },
  { id: "pago-proveedor", label: "Pagos" },
];

export function Finanzas() {
  const { ledger, totals, suppliers } = useFinance();
  const [drawer, setDrawer] = useState<null | "purchase" | "expense" | "payment">(null);
  const [filter, setFilter] = useState<EntryKind | "all">("all");

  const owed = suppliers.reduce((a, s) => a + s.balance, 0);
  const rows = useMemo(
    () => (filter === "all" ? ledger : ledger.filter((l) => l.kind === filter)),
    [ledger, filter],
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Finanzas · Caja"
        subtitle="Registro de ingresos y egresos: ventas, compras, gastos y pagos a proveedores."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setDrawer("expense")}>
              <Receipt className="h-4 w-4" /> Gasto
            </Button>
            <Button variant="outline" onClick={() => setDrawer("payment")}>
              <HandCoins className="h-4 w-4" /> Pago proveedor
            </Button>
            <Button onClick={() => setDrawer("purchase")}>
              <ShoppingCart className="h-4 w-4" /> Registrar compra
            </Button>
          </div>
        }
      />

      <HelpAccordion
        title="¿Cómo llevar la caja y los gastos?"
        intro={
          <>
            Acá controlás la plata del negocio: lo que <strong className="text-success">entra</strong> (ventas)
            y lo que <strong className="text-danger">sale</strong> (gastos, compras y pagos). Todo queda en el libro de abajo.
          </>
        }
        steps={[
          { title: "Gasto (gastos diarios)", desc: "Botón «Gasto»: cargás cualquier gasto del día — mercadería, almacén, verdulería, luz, sueldos, impuestos. Elegís el rubro y a quién le compraste." },
          { title: "Registrar compra", desc: "Botón «Registrar compra»: mercadería que le comprás a un proveedor. Suma el stock y registra el egreso (o queda en cuenta corriente)." },
          { title: "Pago proveedor", desc: "Botón «Pago proveedor»: le pagás a un proveedor y baja lo que le debés (lo ves en la sección Proveedores)." },
          { title: "El libro", desc: "Abajo listás todo como ingreso (verde) o egreso (rojo). Filtralo por tipo: Ventas, Compras, Gastos o Pagos." },
        ]}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={ArrowUpCircle} tone="success" label="Ingresos" value={money(totals.income)} />
        <KpiCard icon={ArrowDownCircle} tone="danger" label="Egresos" value={money(totals.expense)} />
        <KpiCard icon={Scale} tone="brand" label="Balance" value={money(totals.balance)} signed={totals.balance} />
        <KpiCard icon={Wallet} tone="warning" label="Por pagar a proveedores" value={money(owed)} />
      </div>

      <div className="mb-3 flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              filter === f.id ? "bg-brand/10 text-brand" : "text-muted hover:text-fg",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="grid place-items-center gap-3 px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Scale className="h-6 w-6" />
            </span>
            <h2 className="text-base font-semibold text-fg">Sin movimientos todavía</h2>
            <p className="max-w-sm text-sm text-muted">
              Registrá una compra, un gasto o un pago, o cobrá en el local. Todo aparece acá como
              ingreso o egreso.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted">
                  <th className="px-4 py-3 font-medium">Concepto</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                  <th className="hidden px-4 py-3 text-right font-medium md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const meta = entryMeta[l.kind];
                  return (
                    <tr key={l.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2">
                      <td className="px-4 py-3 text-fg">{l.concept}</td>
                      <td className="px-4 py-3">
                        <Badge tone={meta.tone as "success" | "warning" | "danger" | "brand"}>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell">{methodLabel(l.method)}</td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-semibold tnum",
                          l.dir === "in" ? "text-success" : "text-danger",
                        )}
                      >
                        {l.dir === "in" ? "+" : "-"}
                        {money(l.amount)}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-[12.5px] text-muted md:table-cell tnum">
                        {dateFmt.format(new Date(l.at))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PurchaseDrawer open={drawer === "purchase"} onClose={() => setDrawer(null)} />
      <ExpenseDrawer open={drawer === "expense"} onClose={() => setDrawer(null)} />
      <SupplierPaymentDrawer open={drawer === "payment"} onClose={() => setDrawer(null)} />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  signed,
}: {
  icon: typeof Scale;
  tone: "success" | "danger" | "brand" | "warning";
  label: string;
  value: string;
  signed?: number;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg",
            tone === "success" && "bg-success/12 text-success",
            tone === "danger" && "bg-danger/12 text-danger",
            tone === "brand" && "bg-brand/12 text-brand",
            tone === "warning" && "bg-warning/12 text-warning",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[12.5px] text-muted">{label}</span>
      </div>
      <p
        className={cn(
          "text-xl font-bold tracking-tight tnum",
          signed != null && signed < 0 ? "text-danger" : "text-fg",
        )}
      >
        {value}
      </p>
    </Card>
  );
}
