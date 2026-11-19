import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, PackageX, ShoppingBag, BellOff, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Thumb } from "@/components/ChannelPills";
import { useProducts, stockLevel } from "@/context/products-context";
import type { Product } from "@/data/products";
import { num, cn } from "@/lib/utils";

/** Suggested reorder qty: cover ~1.5 months of demand, at least to the warning limit. */
function suggested(p: Product) {
  const target = Math.max(p.minStock, Math.ceil(p.sold30 * 1.5));
  return Math.max(0, target - p.stock);
}

export function Alertas() {
  const { products, updateProduct, adjustStock } = useProducts();

  const flagged = useMemo(
    () =>
      products
        .filter((p) => stockLevel(p) !== "ok")
        .sort((a, b) => a.stock - b.stock),
    [products],
  );

  const out = flagged.filter((p) => p.stock <= 0);
  const low = flagged.filter((p) => p.stock > 0);
  const activeAlarms = products.filter((p) => p.alertOn).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Alertas de stock"
        subtitle="Definí el límite de aviso de compra de cada producto y enterate antes de quedarte sin stock."
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={PackageX} tone="danger" label="En quiebre" value={num(out.length)} hint="Sin stock" />
        <StatCard icon={AlertTriangle} tone="warning" label="Por reponer" value={num(low.length)} hint="Bajo el mínimo" />
        <StatCard icon={ShieldCheck} tone="brand" label="Alarmas activas" value={num(activeAlarms)} hint={`de ${products.length} productos`} />
      </div>

      {flagged.length === 0 ? (
        <Card className="grid place-items-center gap-2 px-6 py-20 text-center">
          <ShieldCheck className="h-9 w-9 text-success" />
          <h2 className="text-base font-semibold text-fg">Todo bajo control</h2>
          <p className="max-w-sm text-sm text-muted">
            Ningún producto está por debajo de su límite de aviso. Te avisamos acá cuando eso cambie.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {out.length > 0 && (
            <Group title="Quiebre de stock" tone="danger" count={out.length}>
              {out.map((p) => (
                <AlertRow key={p.id} p={p} onLimit={(v) => updateProduct(p.id, { minStock: v })} onToggle={() => updateProduct(p.id, { alertOn: !p.alertOn })} onReponer={() => adjustStock(p.id, suggested(p), "reposicion", "Reposición desde alertas")} />
              ))}
            </Group>
          )}
          {low.length > 0 && (
            <Group title="Por debajo del mínimo" tone="warning" count={low.length}>
              {low.map((p) => (
                <AlertRow key={p.id} p={p} onLimit={(v) => updateProduct(p.id, { minStock: v })} onToggle={() => updateProduct(p.id, { alertOn: !p.alertOn })} onReponer={() => adjustStock(p.id, suggested(p), "reposicion", "Reposición desde alertas")} />
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: typeof PackageX;
  tone: "danger" | "warning" | "brand";
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
          tone === "danger" && "bg-danger/12 text-danger",
          tone === "warning" && "bg-warning/12 text-warning",
          tone === "brand" && "bg-brand/12 text-brand",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xl font-bold tracking-tight text-fg tnum">{value}</p>
        <p className="text-[12.5px] text-muted">
          {label} · {hint}
        </p>
      </div>
    </Card>
  );
}

function Group({
  title,
  tone,
  count,
  children,
}: {
  title: string;
  tone: "danger" | "warning";
  count: number;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", tone === "danger" ? "bg-danger" : "bg-warning")} />
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
        <Badge tone={tone}>{count}</Badge>
      </div>
      <Card className="divide-y divide-border overflow-hidden">{children}</Card>
    </section>
  );
}

function AlertRow({
  p,
  onLimit,
  onToggle,
  onReponer,
}: {
  p: Product;
  onLimit: (v: number) => void;
  onToggle: () => void;
  onReponer: () => void;
}) {
  const sug = suggested(p);
  const [limit, setLimit] = useState(p.minStock);
  useEffect(() => setLimit(p.minStock), [p.minStock]);
  const commitLimit = () => {
    if (limit !== p.minStock) onLimit(limit);
  };
  return (
    <div className={cn("flex flex-wrap items-center gap-4 px-4 py-3.5", !p.alertOn && "opacity-60")}>
      <div className="flex min-w-[200px] flex-1 items-center gap-3">
        <Thumb name={p.name} category={p.category} image={p.image} />
        <div className="min-w-0">
          <p className="truncate font-medium text-fg">{p.name}</p>
          <p className="truncate font-mono text-[11.5px] text-muted">{p.sku}</p>
        </div>
      </div>

      <div className="text-center">
        <p className={cn("text-lg font-bold tnum", p.stock <= 0 ? "text-danger" : "text-warning")}>{p.stock}</p>
        <p className="text-[11px] text-muted">en stock</p>
      </div>

      <label className="text-center">
        <span className="mb-1 block text-[11px] text-muted">Límite de aviso</span>
        <input
          type="number"
          min={0}
          value={limit}
          onChange={(e) => setLimit(Math.max(0, +e.target.value))}
          onBlur={commitLimit}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className="h-9 w-20 rounded-lg border border-border bg-bg px-2 text-center text-sm font-semibold text-fg tnum focus:border-brand focus:bg-surface"
        />
      </label>

      <div className="text-center">
        <p className="text-[11px] text-muted">Sugerido comprar</p>
        <p className="mt-0.5 flex items-center gap-1 font-semibold text-brand tnum">
          <ShoppingBag className="h-3.5 w-3.5" />+{num(sug)}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={sug <= 0} onClick={onReponer}>Reponer</Button>
        <button
          onClick={onToggle}
          title={p.alertOn ? "Silenciar alarma" : "Activar alarma"}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-lg border transition-colors",
            p.alertOn
              ? "border-brand/40 bg-brand/10 text-brand"
              : "border-border text-muted hover:text-fg",
          )}
        >
          {p.alertOn ? <ShieldCheck className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
