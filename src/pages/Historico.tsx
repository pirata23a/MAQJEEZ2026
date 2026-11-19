import { useMemo, useState } from "react";
import { Search, ArrowUpDown, History, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { ChannelPills, Thumb } from "@/components/ChannelPills";
import { useProducts } from "@/context/products-context";
import { usePos } from "@/context/pos-context";
import { money, num, cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" });
type SortKey = "total" | "since" | "revenue";

function monthsSince(iso: string) {
  const d = new Date(iso);
  return Math.max(1, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

export function Historico() {
  const { products } = useProducts();
  const { sales } = usePos();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("total");

  const rows = useMemo(() => {
    const live = new Map<string, number>();
    sales.forEach((s) =>
      s.lines.forEach((l) => live.set(l.productId, (live.get(l.productId) ?? 0) + l.qty)),
    );
    return products
      .map((p) => {
        const total = p.soldTotal + (live.get(p.id) ?? 0);
        const months = monthsSince(p.since);
        return {
          p,
          total,
          revenue: total * p.price,
          months,
          avg: Math.round(total / months),
        };
      })
      .filter((r) => {
        const q = query.trim().toLowerCase();
        return !q || r.p.name.toLowerCase().includes(q) || r.p.sku.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sort === "since") return new Date(a.p.since).getTime() - new Date(b.p.since).getTime();
        if (sort === "revenue") return b.revenue - a.revenue;
        return b.total - a.total;
      });
  }, [products, sales, query, sort]);

  const grandTotal = rows.reduce((a, r) => a + r.total, 0);
  const grandRevenue = rows.reduce((a, r) => a + r.revenue, 0);
  const maxTotal = Math.max(...rows.map((r) => r.total), 1);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Histórico por publicación"
        subtitle="Total de unidades vendidas de cada publicación desde su primera venta hasta hoy."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/12 text-brand">
            <History className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-fg tnum">{num(grandTotal)}</p>
            <p className="text-[12.5px] text-muted">Unidades vendidas (histórico)</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-success/12 text-success">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-fg tnum">{money(grandRevenue)}</p>
            <p className="text-[12.5px] text-muted">Facturación histórica estimada</p>
          </div>
        </Card>
        <Card className="hidden items-center gap-3 p-4 lg:flex">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-fg">
            <ArrowUpDown className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-fg tnum">{num(rows.length)}</p>
            <p className="text-[12.5px] text-muted">Publicaciones</p>
          </div>
        </Card>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar publicación…" className="pl-9" />
        </div>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {([
            { id: "total", label: "Más vendidos" },
            { id: "revenue", label: "Facturación" },
            { id: "since", label: "Antigüedad" },
          ] as { id: SortKey; label: string }[]).map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                sort === s.id ? "bg-brand/10 text-brand" : "text-muted hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted">
                <th className="px-4 py-3 font-medium">Publicación</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Publicada desde</th>
                <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Prom. mensual</th>
                <th className="px-4 py-3 text-right font-medium">Vendidos (histórico)</th>
                <th className="hidden px-4 py-3 text-right font-medium lg:table-cell">Facturación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.p.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Thumb name={r.p.name} category={r.p.category} image={r.p.image} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-fg">{r.p.name}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted">{r.p.sku}</span>
                          <ChannelPills channels={r.p.channels} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted md:table-cell">
                    <span className="tnum">{dateFmt.format(new Date(r.p.since))}</span>
                    <span className="block text-[11px] text-muted/80 tnum">{r.months} meses</span>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-muted sm:table-cell tnum">{num(r.avg)} u.</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-surface-2 sm:block">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, (r.total / maxTotal) * 100)}%` }} />
                      </div>
                      <span className="w-16 text-right text-base font-bold text-fg tnum">{num(r.total)}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-right font-medium text-fg lg:table-cell tnum">{money(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
