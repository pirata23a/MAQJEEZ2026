import { useState } from "react";
import { Plus, Building2, HandCoins } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HelpAccordion } from "@/components/HelpAccordion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SupplierDrawer, SupplierPaymentDrawer } from "@/components/FinanceDrawers";
import { useFinance } from "@/context/finance-context";
import { money, num, cn } from "@/lib/utils";

export function Proveedores() {
  const { suppliers } = useFinance();
  const [newOpen, setNewOpen] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);

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
            comprás y cuánto le debés. Las compras se cargan desde <em>Finanzas → Registrar compra</em>.
          </>
        }
        steps={[
          { title: "Cargá tus proveedores", desc: "Botón «Nuevo proveedor»: nombre y CUIT. Después aparecen acá con su saldo." },
          { title: "Seguí lo que debés", desc: "Cuando comprás en «cuenta corriente», el saldo del proveedor sube. Arriba ves el total que debés a todos." },
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

      <Card className="divide-y divide-border overflow-hidden">
        {suppliers.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center gap-4 px-4 py-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-[160px] flex-1">
              <p className="font-medium text-fg">{s.name}</p>
              <p className="font-mono text-[11.5px] text-muted">{s.cuit || "Sin CUIT"}</p>
            </div>
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

      <SupplierDrawer open={newOpen} onClose={() => setNewOpen(false)} />
      <SupplierPaymentDrawer open={payId !== null} supplierId={payId ?? undefined} onClose={() => setPayId(null)} />
    </div>
  );
}
