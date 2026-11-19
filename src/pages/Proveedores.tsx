import { useMemo, useState } from "react";
import { Plus, Building2, HandCoins, ChevronRight, ShoppingCart, Receipt } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HelpAccordion } from "@/components/HelpAccordion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { SupplierDrawer, SupplierPaymentDrawer } from "@/components/FinanceDrawers";
import { useFinance } from "@/context/finance-context";
import { money, num, cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function Proveedores() {
  const { suppliers } = useFinance();
  const [newOpen, setNewOpen] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const owed = suppliers.reduce((a, s) => a + s.balance, 0);
  const withDebt = suppliers.filter((s) => s.balance > 0).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Proveedores"
        subtitle="Cuenta corriente de cada proveedor. Registrá pagos y seguí lo que debés."
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </Button>
        }
      />

      <HelpAccordion
        title="¿Cómo manejar los proveedores?"
        intro={
          <>
            La <strong className="text-fg">cuenta corriente</strong> de cada proveedor: cuánto le
            comprás y cuánto le debés. Las compras se cargan desde <em>Finanzas → Registrar compra</em> o
            desde <em>Local físico</em>.
          </>
        }
        steps={[
          { title: "Cargá tus proveedores", desc: "Botón «Nuevo proveedor»: nombre y CUIT. Después aparecen acá con su saldo." },
          { title: "Seguí lo que debés", desc: "Cuando comprás en «cuenta corriente», el saldo del proveedor sube. Arriba ves el total que debés a todos." },
          { title: "Balance individual", desc: "Tocá un proveedor para ver su cuenta: todas las compras que le hiciste y los pagos, con el saldo actual." },
          { title: "Pagá", desc: "El botón «Pagar» registra el pago y baja el saldo. Ese pago también queda en Finanzas." },
        ]}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Proveedores</p>
          <p className="mt-1 text-xl font-bold text-fg tnum">{num(suppliers.length)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Con saldo pendiente</p>
          <p className="mt-1 text-xl font-bold text-warning tnum">{num(withDebt)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Total a pagar</p>
          <p className="mt-1 text-xl font-bold text-danger tnum">{money(owed)}</p>
        </Card>
      </div>

      {suppliers.length === 0 ? (
        <Card className="grid place-items-center gap-3 px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Building2 className="h-6 w-6" />
          </span>
          <h2 className="text-base font-semibold text-fg">Todavía no cargaste proveedores</h2>
          <p className="max-w-sm text-sm text-muted">
            Agregá tus proveedores para llevar la cuenta corriente de cada uno: lo que les comprás y
            lo que les pagás.
          </p>
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </Button>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {suppliers.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 px-4 py-3.5">
              <button
                onClick={() => setDetailId(s.id)}
                className="flex min-w-[160px] flex-1 items-center gap-4 text-left"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-medium text-fg">
                    {s.name}
                    <ChevronRight className="h-3.5 w-3.5 text-muted" />
                  </p>
                  <p className="font-mono text-[11.5px] text-muted">{s.cuit || "Sin CUIT"}</p>
                </div>
              </button>
              <div className="text-right">
                <p className="text-[11px] text-muted">Saldo</p>
                <p className={cn("font-bold tnum", s.balance > 0 ? "text-warning" : "text-success")}>
                  {money(s.balance)}
                </p>
              </div>
              {s.balance > 0 ? (
                <Button size="sm" onClick={() => setPayId(s.id)}>
                  <HandCoins className="h-3.5 w-3.5" /> Pagar
                </Button>
              ) : (
                <Badge tone="success">Al día</Badge>
              )}
            </div>
          ))}
        </Card>
      )}

      <SupplierDrawer open={newOpen} onClose={() => setNewOpen(false)} />
      <SupplierPaymentDrawer open={payId !== null} supplierId={payId ?? undefined} onClose={() => setPayId(null)} />
      <SupplierDetailDrawer
        supplierId={detailId}
        onClose={() => setDetailId(null)}
        onPay={(id) => { setDetailId(null); setPayId(id); }}
      />
    </div>
  );
}

/* ---------------- Balance individual del proveedor ---------------- */
function SupplierDetailDrawer({
  supplierId,
  onClose,
  onPay,
}: {
  supplierId: string | null;
  onClose: () => void;
  onPay: (id: string) => void;
}) {
  const { suppliers, entries } = useFinance();
  const supplier = suppliers.find((s) => s.id === supplierId);

  const movs = useMemo(() => {
    if (!supplierId) return [];
    return entries
      .filter((e) => e.supplierId === supplierId && (e.kind === "compra" || e.kind === "pago-proveedor"))
      .slice()
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [entries, supplierId]);

  const totalCompras = movs
    .filter((m) => m.kind === "compra")
    .reduce((a, m) => a + m.amount, 0);
  const totalPagos = movs
    .filter((m) => m.kind === "pago-proveedor")
    .reduce((a, m) => a + m.amount, 0);

  return (
    <Drawer
      open={supplierId !== null}
      onClose={onClose}
      title={supplier?.name ?? "Proveedor"}
      subtitle={supplier?.cuit || "Cuenta corriente"}
      footer={
        supplier && supplier.balance > 0 ? (
          <>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            <Button onClick={() => onPay(supplier.id)}>
              <HandCoins className="h-4 w-4" /> Registrar pago
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        )
      }
    >
      {supplier && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-bg p-4">
            <p className="text-[12.5px] text-muted">Saldo actual (lo que le debés)</p>
            <p className={cn("mt-1 text-2xl font-bold tnum", supplier.balance > 0 ? "text-warning" : "text-success")}>
              {money(supplier.balance)}
            </p>
            {supplier.balance <= 0 && <Badge tone="success" className="mt-2">Cuenta al día</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border p-3">
              <p className="text-[11.5px] text-muted">Total comprado</p>
              <p className="mt-0.5 font-bold text-fg tnum">{money(totalCompras)}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-[11.5px] text-muted">Total pagado</p>
              <p className="mt-0.5 font-bold text-success tnum">{money(totalPagos)}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-fg">Movimientos de la cuenta</p>
            {movs.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted">
                Sin movimientos en cuenta corriente. Las compras «en cuenta corriente» y los pagos
                aparecen acá.
              </p>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {movs.map((m) => {
                  const isPago = m.kind === "pago-proveedor";
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                          isPago ? "bg-success/12 text-success" : "bg-warning/12 text-warning",
                        )}
                      >
                        {isPago ? <Receipt className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-fg">{isPago ? "Pago" : "Compra"}</p>
                        <p className="text-[11.5px] text-muted tnum">{dateFmt.format(new Date(m.at.replace(" ", "T")))}</p>
                      </div>
                      <span className={cn("font-semibold tnum", isPago ? "text-success" : "text-warning")}>
                        {isPago ? "-" : "+"}{money(m.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
