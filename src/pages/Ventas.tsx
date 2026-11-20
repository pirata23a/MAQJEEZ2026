import { useEffect, useMemo, useState } from "react";
import { Receipt, Ban, PackageX, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HelpAccordion } from "@/components/HelpAccordion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input } from "@/components/ui/Field";
import { usePos, paymentMethods, saleChannels, channelOf, type PaymentMethod, type Sale, type SaleLine } from "@/context/pos-context";
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
  const [editSaleData, setEditSaleData] = useState<Sale | null>(null);

  const rows = useMemo(
    () => sales.filter((s) => inPeriod(s.at, period)),
    [sales, period],
  );
  const activas = rows.filter((s) => s.status !== "anulada");
  const total = activas.reduce((a, s) => a + s.total, 0);
  const promedio = activas.length ? Math.round(total / activas.length) : 0;
  const byChannel = saleChannels.map((c) => {
    const items = activas.filter((s) => (s.channel ?? "local") === c.id);
    return { ...c, count: items.length, total: items.reduce((a, s) => a + s.total, 0) };
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Ventas"
        subtitle="Todas tus ventas del local. Filtrá por período y anulá si hace falta (devuelve el stock)."
      />

      <HelpAccordion
        intro={
          <>
            Acá ves el <strong className="text-fg">historial</strong> de las ventas hechas en el local.
            Para <strong className="text-fg">cobrar una venta nueva</strong>, andá a <em>Local físico</em>.
          </>
        }
        steps={[
          { title: "Elegí el período", desc: "Diario, Semanal, Mensual o Anual. El resumen de arriba se ajusta a lo que elijas." },
          { title: "Mirá el resumen", desc: "Cantidad de ventas, total facturado y ticket promedio. Las ventas anuladas no suman." },
          { title: "Anulá una venta", desc: "El botón Anular revierte la venta: devuelve las unidades al stock y la saca de los totales." },
        ]}
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

      {/* desglose por canal */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {byChannel.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center justify-between">
              <Badge tone={c.tone as "success" | "warning" | "brand"}>{c.label}</Badge>
              <span className="text-[12px] text-muted tnum">{num(c.count)} {c.count === 1 ? "venta" : "ventas"}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-fg tnum">{money(c.total)}</p>
            <p className="text-[11.5px] text-muted">
              {total > 0 ? Math.round((c.total / total) * 100) : 0}% del total
            </p>
          </Card>
        ))}
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
                  <th className="px-4 py-3 font-medium">Canal</th>
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
                      <td className="px-4 py-3">
                        {(() => {
                          const ch = channelOf(s.channel ?? "local");
                          return <Badge tone={ch.tone as "success" | "warning" | "brand"}>{ch.short}</Badge>;
                        })()}
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
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditSaleData(s)}>
                                <Pencil className="h-3.5 w-3.5" /> Editar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setConfirmId(s.saleId ?? null)}>
                                <Ban className="h-3.5 w-3.5" /> Anular
                              </Button>
                            </>
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
        Podés editar o anular una venta. Al anular, se devuelven las unidades al stock.
      </p>

      <EditSaleDrawer sale={editSaleData} onClose={() => setEditSaleData(null)} />
    </div>
  );
}

/* ---------------- Editar venta registrada ---------------- */
function EditSaleDrawer({ sale, onClose }: { sale: Sale | null; onClose: () => void }) {
  const { editSale } = usePos();
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [payment, setPayment] = useState<PaymentMethod>("efectivo");
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!sale) return;
    setLines(sale.lines.map((l) => ({ ...l })));
    setPayment(sale.payment);
    setName(""); setQty(1); setPrice(0);
  }, [sale]);

  const total = lines.reduce((a, l) => a + l.price * l.qty, 0);

  const setLine = (i: number, patch: Partial<SaleLine>) =>
    setLines((p) => p.map((l, x) => (x === i ? { ...l, ...patch } : l)));
  const addLine = () => {
    if (!name.trim() || price <= 0) return;
    setLines((l) => [...l, { productId: "", name: name.trim(), qty: Math.max(1, qty), price }]);
    setName(""); setQty(1); setPrice(0);
  };

  const guardar = async () => {
    if (!sale?.saleId || lines.length === 0) return;
    setBusy(true);
    try {
      await editSale(sale.saleId, { lines, payment, paidWith: null });
      onClose();
    } catch { /* toast ya mostrado */ } finally { setBusy(false); }
  };

  return (
    <Drawer
      open={!!sale}
      onClose={onClose}
      title={sale ? `Editar venta ${sale.id}` : "Editar venta"}
      subtitle="Cambiá cantidades, precios, ítems o el medio de pago. El stock se ajusta solo."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={busy || lines.length === 0} onClick={guardar}>Guardar cambios {money(total)}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {lines.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-border p-2">
            {lines.map((l, i) => (
              <div key={i} className="rounded-lg bg-bg p-2.5">
                <div className="flex items-center gap-2">
                  <input
                    value={l.name}
                    onChange={(e) => setLine(i, { name: e.target.value })}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-fg outline-none"
                  />
                  <button onClick={() => setLines((p) => p.filter((_, x) => x !== i))} className="text-muted hover:text-danger" aria-label="Quitar">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[12px] text-muted">
                    Cant.
                    <Input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: Math.max(1, +e.target.value) })} className="h-8 w-16 text-center" />
                  </label>
                  <label className="flex items-center gap-1 text-[12px] text-muted">
                    $
                    <Input type="number" min={0} value={l.price || ""} onChange={(e) => setLine(i, { price: Math.max(0, +e.target.value) })} className="h-8 w-24 text-right" />
                  </label>
                  <span className="ml-auto font-semibold text-fg tnum">{money(l.price * l.qty)}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="font-medium text-fg">Total</span>
              <span className="text-lg font-bold text-fg tnum">{money(total)}</span>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-[13px] text-warning">
            La venta no puede quedar vacía. Agregá al menos un ítem.
          </p>
        )}

        <div className="rounded-xl border border-border bg-bg p-3">
          <p className="mb-2 text-[13px] font-medium text-fg">Agregar ítem</p>
          <Field label="Concepto"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Repuesto, mano de obra…" /></Field>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Field label="Cantidad"><Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} /></Field>
            <Field label="Precio unitario"><Input type="number" min={0} value={price || ""} onChange={(e) => setPrice(Math.max(0, +e.target.value))} /></Field>
          </div>
          <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={addLine}>
            <Plus className="h-4 w-4" /> Agregar ítem
          </Button>
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-fg">Medio de pago</p>
          <div className="flex flex-wrap gap-1.5">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayment(m.id)}
                className={cn("rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  payment === m.id ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface text-muted hover:text-fg")}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
