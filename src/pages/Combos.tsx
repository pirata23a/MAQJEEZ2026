import { Layers, Info } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ChannelPills, Thumb } from "@/components/ChannelPills";
import { useProducts } from "@/context/products-context";
import { money, num, cn } from "@/lib/utils";

export function Combos() {
  const { combos, products, comboStock } = useProducts();
  const bySku = (sku: string) => products.find((p) => p.sku === sku);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Combos y packs"
        subtitle="Vendé productos agrupados. El stock disponible se calcula según los componentes."
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/[0.06] px-4 py-3 text-[13px] text-fg/80">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        Cada venta de un combo descuenta el stock de sus productos en todos los canales vinculados.
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {combos.map((combo) => {
          const available = comboStock(combo);
          const cost = combo.items.reduce(
            (a, it) => a + (bySku(it.sku)?.cost ?? 0) * it.qty,
            0,
          );
          const margin = combo.price > 0 ? Math.round(((combo.price - cost) / combo.price) * 100) : 0;
          return (
            <Card key={combo.id} className="flex flex-col">
              <CardBody className="flex-1">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/12 text-brand">
                      <Layers className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="font-semibold leading-tight text-fg">{combo.name}</p>
                      <p className="font-mono text-[11.5px] text-muted">{combo.sku}</p>
                    </div>
                  </div>
                  {available <= 0 ? (
                    <Badge tone="danger">Sin stock</Badge>
                  ) : available <= 3 ? (
                    <Badge tone="warning">{available} disp.</Badge>
                  ) : (
                    <Badge tone="success">{available} disp.</Badge>
                  )}
                </div>

                <ul className="space-y-2 rounded-xl border border-border bg-bg p-3">
                  {combo.items.map((it) => {
                    const p = bySku(it.sku);
                    if (!p) return null;
                    const limiting = Math.floor(p.stock / it.qty) === available;
                    return (
                      <li key={it.sku} className="flex items-center gap-2.5">
                        <Thumb name={p.name} category={p.category} image={p.image} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-fg">{p.name}</p>
                          <p className="text-[11.5px] text-muted tnum">
                            {p.stock} en stock · {it.qty} por combo
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[11px] font-semibold tnum",
                            limiting ? "bg-warning/12 text-warning" : "bg-surface-2 text-muted",
                          )}
                        >
                          ×{it.qty}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardBody>

              <div className="flex items-center justify-between border-t border-border px-5 py-4">
                <div>
                  <p className="text-lg font-bold text-fg tnum">{money(combo.price)}</p>
                  <p className="text-[12px] text-muted">
                    Margen <span className="font-semibold text-success tnum">{margin}%</span>
                  </p>
                </div>
                <ChannelPills channels={combo.channels} />
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[12.5px] text-muted">
        {num(combos.length)} combos activos
      </p>
    </div>
  );
}
