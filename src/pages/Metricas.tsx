import { useMemo } from "react";
import { TrendingUp, TrendingDown, Trophy, Boxes } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Thumb } from "@/components/ChannelPills";
import { useProducts } from "@/context/products-context";
import { usePos } from "@/context/pos-context";
import { money, num, cn } from "@/lib/utils";

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
