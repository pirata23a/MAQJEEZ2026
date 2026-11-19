import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Plus, Loader2, PackageX } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AreaChart } from "@/components/AreaChart";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { money, num, cn } from "@/lib/utils";

type Dash = {
  kpis: { ventasHoy: number; ticketsHoy: number; ticketProm: number; sinStock: number; stockBajo: number };
  series: { date: string; total: number }[];
  periodTotal: number;
  byMethod: { payment: string; total: number; n: number }[];
  recent: { id: string; total: number; payment: string; at: string; items: number }[];
  pending: { preguntasML: number; quiebre: number; stockBajo: number };
};

const methodLabel: Record<string, string> = {
  efectivo: "Efectivo",
  debito: "Débito",
  credito: "Crédito",
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
};
const methodColor = ["bg-brand", "bg-success", "bg-warning", "bg-muted", "bg-danger"];
const timeFmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [d, setD] = useState<Dash | null>(null);

  useEffect(() => {
    api<Dash>("/dashboard").then(setD).catch(() => {});
  }, []);

  const exportCsv = () => {
    if (!d) return;
    const rows = [
      ["Ticket", "Fecha", "Items", "Medio de pago", "Total"],
      ...d.recent.map((o) => [o.id, o.at, String(o.items), o.payment, String(o.total)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `appjeez-ventas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const firstName = (user?.name || "").split(" ")[0] || "";

  if (!d)
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );

  const maxMethod = Math.max(...d.byMethod.map((m) => m.total), 1);
  const pending = [
    { label: "Preguntas de Mercado Libre sin responder", count: d.pending.preguntasML, tone: "brand" as const },
    { label: "Productos en quiebre de stock", count: d.pending.quiebre, tone: "danger" as const },
    { label: "Productos bajo el stock mínimo", count: d.pending.stockBajo, tone: "warning" as const },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={`Buenas, ${firstName} 👋`}
        subtitle="Esto es lo que está pasando en tu comercio."
        actions={
          <>
            <Button variant="outline" size="md" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button size="md" onClick={() => navigate("/local-fisico")}>
              <Plus className="h-4 w-4" />
              Nueva venta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Ventas de hoy" value={money(d.kpis.ventasHoy)} hint={`${num(d.kpis.ticketsHoy)} tickets`} />
        <Kpi label="Ticket promedio" value={money(d.kpis.ticketProm)} hint="histórico" />
        <Kpi label="Stock bajo mínimo" value={num(d.kpis.stockBajo)} hint="requieren reposición" tone={d.kpis.stockBajo > 0 ? "warning" : undefined} />
        <Kpi label="Productos sin stock" value={num(d.kpis.sinStock)} hint="en quiebre" tone={d.kpis.sinStock > 0 ? "danger" : undefined} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Ventas de los últimos 14 días</CardTitle>
              <p className="mt-1 text-[13px] text-muted">
                Total <span className="font-semibold text-fg tnum">{money(d.periodTotal)}</span> en el período
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {d.series.some((s) => s.total > 0) ? (
              <AreaChart data={d.series.map((s) => s.total)} height={200} className="h-[200px] w-full" />
            ) : (
              <div className="grid h-[200px] place-items-center text-sm text-muted">
                Todavía no hay ventas en el período.
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pendientes</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {pending.map((t) => (
              <div
                key={t.label}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg px-3 py-3 text-left"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[15px] font-bold tnum",
                    t.tone === "brand" && "bg-brand/12 text-brand",
                    t.tone === "warning" && "bg-warning/12 text-warning",
                    t.tone === "danger" && "bg-danger/12 text-danger",
                  )}
                >
                  {t.count}
                </span>
                <span className="text-[13px] font-medium leading-snug text-fg">{t.label}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por medio de pago</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {d.byMethod.length === 0 && <p className="text-sm text-muted">Sin ventas todavía.</p>}
            {d.byMethod.map((m, i) => (
              <div key={m.payment}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-fg">{methodLabel[m.payment] ?? m.payment}</span>
                  <span className="text-muted tnum">{money(m.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className={cn("h-full rounded-full", methodColor[i % methodColor.length])} style={{ width: `${(m.total / maxMethod) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Ventas recientes</CardTitle>
          </CardHeader>
          {d.recent.length === 0 ? (
            <div className="grid place-items-center gap-2 px-6 py-12 text-center">
              <PackageX className="h-7 w-7 text-muted" />
              <p className="text-sm text-muted">Todavía no registraste ventas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[12px] text-muted">
                    <th className="px-5 py-2.5 font-medium">Ticket</th>
                    <th className="px-5 py-2.5 font-medium">Ítems</th>
                    <th className="px-5 py-2.5 font-medium">Pago</th>
                    <th className="px-5 py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recent.map((o) => (
                    <tr key={o.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-surface-2">
                      <td className="px-5 py-3">
                        <span className="font-mono text-[12.5px] font-medium text-fg">{o.id}</span>
                        <span className="block text-[11px] text-muted tnum">{timeFmt.format(new Date(o.at))}</span>
                      </td>
                      <td className="px-5 py-3 text-muted tnum">{o.items}</td>
                      <td className="px-5 py-3">
                        <Badge tone="muted">{methodLabel[o.payment] ?? o.payment}</Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-fg tnum">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "warning" | "danger";
}) {
  return (
    <Card className="p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p
        className={cn(
          "mt-2 text-[26px] font-bold tracking-tight tnum",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          !tone && "text-fg",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[12px] text-muted">{hint}</p>
    </Card>
  );
}
