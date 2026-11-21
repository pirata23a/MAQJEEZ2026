import { useMemo } from "react";
import { TrendingUp, TrendingDown, Trophy, Boxes, PieChart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Thumb } from "@/components/ChannelPills";
import { useProducts } from "@/context/products-context";
import { usePos, saleChannels } from "@/context/pos-context";
import { money, num, cn } from "@/lib/utils";

// color CSS por tono de canal (orden categórico fijo: local=verde, meli=ámbar, taller=cobalto)
const toneToken = (t: string) =>
  t === "success" ? "--success" : t === "warning" ? "--warning" : t === "danger" ? "--danger" : "--brand";

export function Metricas() {
  const { products } = useProducts();
  const { sales } = usePos();

  const ranked = useMemo(() => {
    const liveByProduct = new Map<string, number>();
    sales.forEach((s) =>
      s.lines.forEach((l) =>
        liveByProduct.set(l.productId, (liveByProduct.get(l.productId) ?? 0) + l.qty),
      ),
    );
    return products
      .map((p) => {
        const units = p.sold30 + (liveByProduct.get(p.id) ?? 0);
        return { p, units, revenue: units * p.price };
      })
      .sort((a, b) => b.units - a.units);
  }, [products, sales]);

  const totalUnits = ranked.reduce((a, r) => a + r.units, 0);
  const totalRevenue = ranked.reduce((a, r) => a + r.revenue, 0);
  const star = ranked[0];
  const max = ranked[0]?.units || 1;

  const top = ranked.slice(0, 5);
  const bottom = [...ranked].reverse().slice(0, 5);

  // Ventas por sector (canal): datos reales de ventas, últimos 30 días
  const sector = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    const activas = sales.filter((s) => s.status !== "anulada");
    const recientes = activas.filter((s) => {
      const d = new Date(s.at.includes("T") ? s.at : s.at.replace(" ", "T"));
      return d.getTime() >= cutoff;
    });
    const base = recientes.length ? recientes : activas;
    const tot = base.reduce((a, s) => a + s.total, 0);
    const rows = saleChannels.map((c) => {
      const items = base.filter((s) => (s.channel ?? "local") === c.id);
      const monto = items.reduce((a, s) => a + s.total, 0);
      return { ...c, monto, count: items.length, pct: tot > 0 ? monto / tot : 0 };
    });
    return { total: tot, rows };
  }, [sales]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Métricas"
        subtitle="Rendimiento de ventas de los últimos 30 días, incluyendo las ventas del local."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Boxes} label="Unidades vendidas" value={num(totalUnits)} />
        <Kpi icon={TrendingUp} label="Facturación estimada" value={money(totalRevenue)} />
        <Kpi icon={Trophy} label="Producto estrella" value={star?.p.name ?? "—"} small />
        <Kpi icon={Boxes} label="Productos activos" value={num(products.length)} />
      </div>

      {/* Ventas por sector (canal) */}
      <Card className="mb-5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-[18px] w-[18px] text-brand" />
            Ventas por sector
          </CardTitle>
          <span className="text-[12.5px] text-muted">Últimos 30 días</span>
        </CardHeader>
        <CardBody>
          {sector.total <= 0 ? (
            <p className="py-6 text-center text-[13px] text-muted">
              Todavía no hay ventas para mostrar el reparto por sector.
            </p>
          ) : (
            <>
              {/* barra apilada 100% — una barra, segmentos por canal con separación de 2px */}
              <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
                {sector.rows
                  .filter((r) => r.pct > 0)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        width: `${r.pct * 100}%`,
                        background: `rgb(var(${toneToken(r.tone)}))`,
                        boxShadow: "inset -2px 0 0 rgb(var(--surface))",
                      }}
                      title={`${r.label}: ${money(r.monto)}`}
                    />
                  ))}
              </div>

              {/* leyenda + detalle por sector */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {sector.rows.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-bg p-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: `rgb(var(${toneToken(r.tone)}))` }}
                      />
                      <span className="text-[13px] font-medium text-fg">{r.label}</span>
                      <span className="ml-auto text-[12px] text-muted tnum">
                        {Math.round(r.pct * 100)}%
                      </span>
                    </div>
                    <p className="mt-1.5 text-lg font-bold text-fg tnum">{money(r.monto)}</p>
                    <p className="text-[12px] text-muted tnum">
                      {num(r.count)} {r.count === 1 ? "venta" : "ventas"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-[18px] w-[18px] text-success" />
              Más vendidos
            </CardTitle>
            <Badge tone="success">Top 5</Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            {top.map((r, i) => (
              <RankRow key={r.p.id} rank={i + 1} name={r.p.name} category={r.p.category} image={r.p.image} units={r.units} revenue={r.revenue} pct={r.units / max} tone="success" />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-[18px] w-[18px] text-danger" />
              Menos vendidos
            </CardTitle>
            <Badge tone="danger">Bottom 5</Badge>
          </CardHeader>
          <CardBody className="space-y-3">
            {bottom.map((r, i) => (
              <RankRow key={r.p.id} rank={i + 1} name={r.p.name} category={r.p.category} image={r.p.image} units={r.units} revenue={r.revenue} pct={r.units / max} tone="danger" />
            ))}
          </CardBody>
        </Card>
      </div>

      <p className="mt-4 text-center text-[12.5px] text-muted">
        Los productos de baja rotación son candidatos para promociones o descontinuar.
      </p>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  small,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-[12.5px]">{label}</span>
      </div>
      <p className={cn("font-bold tracking-tight text-fg", small ? "truncate text-[15px]" : "text-xl tnum")}>
        {value}
      </p>
    </Card>
  );
}

function RankRow({
  rank,
  name,
  category,
  image,
  units,
  revenue,
  pct,
  tone,
}: {
  rank: number;
  name: string;
  category: string;
  image?: string | null;
  units: number;
  revenue: number;
  pct: number;
  tone: "success" | "danger";
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 text-center text-[13px] font-bold text-muted tnum">{rank}</span>
      <Thumb name={name} category={category} image={image} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="truncate text-[13.5px] font-medium text-fg">{name}</p>
          <span className="shrink-0 text-[12.5px] text-muted tnum">{money(revenue)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn("h-full rounded-full", tone === "success" ? "bg-success" : "bg-danger/70")}
              style={{ width: `${Math.max(4, pct * 100)}%` }}
            />
          </div>
          <span className="w-16 shrink-0 text-right text-[12px] font-semibold text-fg tnum">
            {num(units)} u.
          </span>
        </div>
      </div>
    </div>
  );
}
