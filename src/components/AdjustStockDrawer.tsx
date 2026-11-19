import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useProducts, stockReasons, type StockReasonId } from "@/context/products-context";
import { cn } from "@/lib/utils";

type Dir = "out" | "in";

export function AdjustStockDrawer({
  open,
  onClose,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  productId?: string;
}) {
  const { products, adjustStock } = useProducts();
  const [selId, setSelId] = useState(productId ?? products[0]?.id ?? "");
  const [dir, setDir] = useState<Dir>("out");
  const [reason, setReason] = useState<StockReasonId>("uso-servicio");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  // reset on open / preselection change
  useEffect(() => {
    if (!open) return;
    setSelId(productId ?? products[0]?.id ?? "");
    setDir("out");
    setReason("uso-servicio");
    setQty(1);
    setNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId]);

  const product = products.find((p) => p.id === selId);
  const reasons = stockReasons.filter((r) => r.dir === dir || r.dir === "both");
  // keep reason valid for current direction
  useEffect(() => {
    if (!reasons.some((r) => r.id === reason)) setReason(reasons[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dir]);

  const signed = dir === "out" ? -Math.abs(qty) : Math.abs(qty);
  const resulting = product ? Math.max(0, product.stock + signed) : 0;
  const valid = product && qty > 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ajuste manual de stock"
      subtitle="Registrá una entrada o salida con su motivo. Sirve para cualquier comercio."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!valid}
            onClick={() => {
              if (!product) return;
              adjustStock(product.id, signed, reason, note.trim());
              onClose();
            }}
          >
            Registrar movimiento
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Producto">
          <Select value={selId} onChange={(e) => setSelId(e.target.value)} disabled={!!productId}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.sku}
              </option>
            ))}
          </Select>
        </Field>

        {/* direction toggle */}
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-fg">Tipo de movimiento</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDir("out")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                dir === "out"
                  ? "border-danger bg-danger/[0.08] text-danger"
                  : "border-border bg-bg text-muted hover:text-fg",
              )}
            >
              <ArrowDown className="h-4 w-4" />
              Salida (descontar)
            </button>
            <button
              type="button"
              onClick={() => setDir("in")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                dir === "in"
                  ? "border-success bg-success/[0.08] text-success"
                  : "border-border bg-bg text-muted hover:text-fg",
              )}
            >
              <ArrowUp className="h-4 w-4" />
              Entrada (sumar)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cantidad">
            <Input
              type="number"
              min={1}
              value={qty || ""}
              onChange={(e) => setQty(Math.max(0, +e.target.value))}
            />
          </Field>
          <Field label="Motivo">
            <Select value={reason} onChange={(e) => setReason(e.target.value as StockReasonId)}>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Nota" hint="Opcional. Ej: orden de reparación #1042, cliente, responsable.">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Detalle del movimiento" />
        </Field>

        {product && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-bg px-4 py-3 text-sm">
            <span className="text-muted">Stock resultante</span>
            <span className="flex items-center gap-2 font-semibold tnum">
              <span className="text-muted">{product.stock}</span>
              <span className="text-muted">→</span>
              <span className={cn(signed < 0 ? "text-danger" : "text-success")}>{resulting}</span>
            </span>
          </div>
        )}
      </div>
    </Drawer>
  );
}
