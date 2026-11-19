import { useState } from "react";
import { Check, Sparkles, FileText, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { plans } from "@/data/mock";
import { money, num, cn } from "@/lib/utils";

type Cycle = "mensual" | "semestral" | "anual";

const cycles: { id: Cycle; label: string; months: number; off: number }[] = [
  { id: "mensual", label: "Mensual", months: 1, off: 0 },
  { id: "semestral", label: "Semestral", months: 6, off: 0.15 },
  { id: "anual", label: "Anual", months: 12, off: 0.2 },
];

export function Suscripcion() {
  const [cycle, setCycle] = useState<Cycle>("anual");
  const [notice, setNotice] = useState("");
  const active = cycles.find((c) => c.id === cycle)!;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Suscripción"
        subtitle="Pagás según la cantidad de ventas o comprobantes de los últimos 30 días, tomando el mayor de ambos."
        actions={
          <Button variant="outline" onClick={() => setNotice("Todavía no hay facturas emitidas en tu cuenta.")}>
            <FileText className="h-4 w-4" />
            Descargar factura
          </Button>
        }
      />

      {notice && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/[0.08] px-4 py-3 text-[13px] text-fg">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Cerrar" className="text-muted hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* cycle toggle */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-border bg-surface p-1">
          {cycles.map((c) => (
            <button
              key={c.id}
              onClick={() => setCycle(c.id)}
              className={cn(
                "relative rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-150",
                cycle === c.id ? "bg-brand text-brand-fg" : "text-muted hover:text-fg",
              )}
            >
              {c.label}
              {c.off > 0 && (
                <span
                  className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    cycle === c.id ? "bg-brand-fg/20 text-brand-fg" : "bg-success/15 text-success",
                  )}
                >
                  -{c.off * 100}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* plans */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {plans.map((p) => {
          const perMonth = Math.round(p.monthly * (1 - active.off));
          const total = perMonth * active.months;
          const full = p.monthly * active.months;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-surface p-6 transition-shadow",
                p.highlight
                  ? "border-brand shadow-pop ring-1 ring-brand/30"
                  : "border-border shadow-card hover:shadow-pop",
              )}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[12px] font-semibold text-brand-fg shadow-card">
                  <Sparkles className="h-3.5 w-3.5" />
                  Más popular
                </span>
              )}

              <h3 className="text-lg font-bold tracking-tight text-fg">{p.name}</h3>

              <div className="mt-4 flex items-end gap-1">
                <span className="text-[34px] font-bold leading-none tracking-tight text-fg tnum">
                  {money(perMonth)}
                </span>
                <span className="mb-1 text-[13px] text-muted">+ IVA / mes</span>
              </div>

              {active.off > 0 ? (
                <p className="mt-2 text-[13px] text-muted">
                  <span className="text-muted/70 line-through tnum">{money(full)}</span>{" "}
                  Total {active.label.toLowerCase()}{" "}
                  <span className="font-semibold text-fg tnum">{money(total)}</span>
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-muted">Facturación mensual</p>
              )}

              <div className="my-5 h-px bg-border" />

              <ul className="space-y-2.5 text-sm">
                <Limit label="ventas / mes" value={p.limits.ventas} />
                <Limit label="comprobantes / mes" value={p.limits.comprobantes} />
                <Limit label="publicaciones" value={p.limits.publicaciones} />
              </ul>

              <ul className="mt-5 space-y-2 text-[13px]">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-fg/80">
                    <Check className="h-4 w-4 shrink-0 text-brand" />
                    {perk}
                  </li>
                ))}
              </ul>

              <Button
                variant={p.highlight ? "primary" : "outline"}
                size="lg"
                className="mt-6 w-full"
                onClick={() => setNotice(`Seleccionaste el plan ${p.name}. Un asesor te va a contactar para activarlo.`)}
              >
                Contratar {p.name}
              </Button>
            </div>
          );
        })}
      </div>

      {/* custom plan */}
      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-surface-2 p-6 sm:flex-row">
        <div>
          <p className="font-semibold text-fg">¿Superás los límites del plan Corporate?</p>
          <p className="text-sm text-muted">
            Contactanos para armar un plan a medida para tu operación.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setNotice("¡Gracias! Un asesor de AppJeez te va a contactar a la brevedad.")}>
          Contactar a ventas
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Badge tone="success">Activo</Badge> Plan Premium hasta el 11/12
        </span>
        <span className="hidden sm:inline tnum">+34M comprobantes emitidos</span>
      </div>
    </div>
  );
}

function Limit({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-baseline justify-between gap-2 text-fg/80">
      <span className="text-muted">Hasta</span>
      <span className="flex-1 border-b border-dashed border-border" />
      <span className="font-semibold text-fg tnum">{num(value)}</span>
      <span className="text-muted">{label}</span>
    </li>
  );
}
