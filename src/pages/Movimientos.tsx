import { useMemo, useState } from "react";
import { Plus, ArrowDown, ArrowUp, History } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Thumb } from "@/components/ChannelPills";
import { AdjustStockDrawer } from "@/components/AdjustStockDrawer";
import { useProducts, reasonLabel } from "@/context/products-context";
import { num, cn } from "@/lib/utils";

const timeFmt = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "short",
});

export function Movimientos() {
  const { movements, products } = useProducts();
  const [adjusting, setAdjusting] = useState(false);
  const byId = (id: string) => products.find((p) => p.id === id);

  const stats = useMemo(() => {
    const out = movements.filter((m) => m.delta < 0).reduce((a, m) => a - m.delta, 0);
    const inc = movements.filter((m) => m.delta > 0).reduce((a, m) => a + m.delta, 0);
    return { total: movements.length, out, inc };
  }, [movements]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Movimientos de stock"
        subtitle="Entradas y salidas manuales. Útil para cualquier comercio: uso en servicios, mermas, consumo interno, ventas de mostrador y ajustes."
        actions={
          <Button onClick={() => setAdjusting(true)}>
            <Plus className="h-4 w-4" />
            Ajuste manual
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Movimientos</p>
          <p className="mt-1 text-xl font-bold text-fg tnum">{num(stats.total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Unidades que salieron</p>
          <p className="mt-1 text-xl font-bold text-danger tnum">{num(stats.out)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] text-muted">Unidades que entraron</p>
          <p className="mt-1 text-xl font-bold text-success tnum">{num(stats.inc)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {movements.length === 0 ? (
          <div className="grid place-items-center gap-3 px-6 py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
              <History className="h-6 w-6" />
            </span>
            <h2 className="text-base font-semibold text-fg">Todavía no hay movimientos</h2>
            <p className="max-w-sm text-sm text-muted">
              Registrá un ajuste manual cuando uses un repuesto en una reparación, cargues mercadería
              o corrijas el inventario. Cada cambio queda acá con su motivo.
            </p>
            <Button className="mt-1" onClick={() => setAdjusting(true)}>
              <Plus className="h-4 w-4" />
              Registrar el primero
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted">
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Nota</th>
                  <th className="px-4 py-3 text-center font-medium">Movimiento</th>
                  <th className="px-4 py-3 text-center font-medium">Resultante</th>
                  <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">Cuándo</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const p = byId(m.productId);
                  const out = m.delta < 0;
                  return (
                    <tr key={m.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p && <Thumb name={p.name} category={p.category} image={p.image} />}
                          <div className="min-w-0">
                            <p className="truncate font-medium text-fg">{p?.name ?? "Producto"}</p>
                            <p className="truncate font-mono text-[11.5px] text-muted">{p?.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg/80">{reasonLabel(m.reason)}</td>
                      <td className="hidden max-w-[220px] truncate px-4 py-3 text-muted md:table-cell">
                        {m.note || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "mx-auto flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold tnum",
                            out ? "bg-danger/12 text-danger" : "bg-success/12 text-success",
                          )}
                        >
                          {out ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                          {out ? "" : "+"}
                          {m.delta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-fg tnum">{m.resulting}</td>
                      <td className="hidden px-4 py-3 text-right text-[12.5px] text-muted sm:table-cell tnum">
                        {timeFmt.format(new Date(m.at))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AdjustStockDrawer open={adjusting} onClose={() => setAdjusting(false)} />
    </div>
  );
}
