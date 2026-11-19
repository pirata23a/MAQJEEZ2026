import { useMemo, useState } from "react";
import { Receipt, Ban, PackageX, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { usePos, paymentMethods } from "@/context/pos-context";
import { money, num, cn } from "@/lib/utils";

const methodLabel = (id: string) => paymentMethods.find((m) => m.id === id)?.label ?? id;
const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type PeriodId = "dia" | "semana" | "mes" | "anio" | "todo";
const periods: { id: PeriodId; label: string }[] = [
  { id: "dia", label: "Diario" },
  { id: "semana", label: "Semanal" },
  { id: "mes", label: "Mensual" },
  { id: "anio", label: "Anual" },
  { id: "todo", label: "Todo" },
];

function inPeriod(at: string, period: PeriodId): boolean {
  if (period === "todo") return true;
  const d = new Date(at.includes("T") ? at : at.replace(" ", "T"));
  const now = new Date();
  if (period === "dia") return d.toDateString() === now.toDateString();
  const days = period === "semana" ? 7 : period === "mes" ? 30 : 365;
  const cutoff = new Date(now.getTime() - days * 86400000);
  return d >= cutoff;
}

export function Ventas() {
  const { sales, cancelSale } = usePos();
  const [period, setPeriod] = useState<PeriodId>("dia");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const rows = useMemo(
    () => sales.filter((s) => inPeriod(s.at, period)),
    [sales, period],
  );
  const activas = rows.filter((s) => s.status !== "anulada");
  const total = activas.reduce((a, s) => a + s.total, 0);
  const promedio = activas.length ? Math.round(total / activas.length) : 0;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Ventas"
        subtitle="Todas tus ventas del local. Filtrá por período y anulá si hace falta (devuelve el stock)."
      />

      {/* period filter */}
      <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              period === p.id ? "bg-brand/10 text-brand" : "text-muted hover:text-fg",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Ventas</p>
          <p className="mt-1 text-xl font-bold text-fg tnum">{num(activas.length)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Facturado</p>
          <p className="mt-1 text-xl font-bold text-success tnum">{money(total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Ticket promedio</p>
          <p className="mt-1 text-xl font-bold text-fg tnum">{money(promedio)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="grid place-items-center gap-2 px-6 py-16 text-center">
            <PackageX className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">No hay ventas en este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted">
                  <th className="px-4 py-3 font-medium">Ticket</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Fecha</th>
                  <th className="px-4 py-3 font-medium">Ítems</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const anulada = s.status === "anulada";
                  const confirming = confirmId === s.saleId;
                  return (
                    <tr
                      key={s.saleId ?? s.id}
                      className={cn(
                        "border-b border-border/60 last:border-0 hover:bg-surface-2",
                        anulada && "opacity-55",
                      )}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12.5px] font-medium text-fg">{s.id}</span>
                        {anulada && <Badge tone="danger" className="ml-2">Anulada</Badge>}
                      </td>
                      <td className="hidden px-4 py-3 text-muted sm:table-cell tnum">{dateFmt.format(new Date(s.at.replace(" ", "T")))}</td>
                      <td className="px-4 py-3 text-muted tnum">{s.lines.length}</td>
                      <td className="hidden px-4 py-3 text-muted md:table-cell">{methodLabel(s.payment)}</td>
                      <td className={cn("px-4 py-3 text-right font-semibold tnum", anulada ? "text-muted line-through" : "text-fg")}>
                        {money(s.total)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {anulada ? (
                            <span className="text-[12px] text-muted">—</span>
                          ) : confirming ? (
                            <>
                              <Button
                                size="sm"
                                className="!bg-danger"
                                onClick={() => {
                                  if (s.saleId) cancelSale(s.saleId);
                                  setConfirmId(null);
                                }}
                              >
                                <Check className="h-3.5 w-3.5" /> Confirmar
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                                No
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setConfirmId(s.saleId ?? null)}>
                              <Ban className="h-3.5 w-3.5" /> Anular
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[12.5px] text-muted">
        <Receipt className="h-3.5 w-3.5" />
        Anular una venta devuelve las unidades al stock y queda registrada como movimiento.
      </p>
    </div>
  );
}
