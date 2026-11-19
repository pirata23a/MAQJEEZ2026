import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useProducts } from "@/context/products-context";
import { useFinance, type PurchaseLine } from "@/context/finance-context";
import { payMethods, expenseCategories, type PayMethod } from "@/data/finance";
import { money, cn } from "@/lib/utils";

/* ---------------- Compra + carga de stock ---------------- */
export function PurchaseDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products } = useProducts();
  const { suppliers, registerPurchase } = useFinance();
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [method, setMethod] = useState<PayMethod>("transferencia");
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [pid, setPid] = useState(products[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(products[0]?.cost ?? 0);

  useEffect(() => {
    if (!open) return;
    setSupplierId(suppliers[0]?.id ?? "");
    setMethod("transferencia");
    setLines([]);
    setPid(products[0]?.id ?? "");
    setQty(1);
    setCost(products[0]?.cost ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addLine = () => {
    if (!pid || qty <= 0) return;
    setLines((prev) => {
      const i = prev.findIndex((l) => l.productId === pid);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty, unitCost: cost };
        return copy;
      }
      return [...prev, { productId: pid, qty, unitCost: cost }];
    });
    setQty(1);
  };

  const total = lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
  const pname = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar compra"
      subtitle="Carga stock, suma el egreso y actualiza la cuenta del proveedor."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={lines.length === 0 || !supplierId}
            onClick={() => {
              registerPurchase({ supplierId, lines, method });
              onClose();
            }}
          >
            Registrar compra {money(total)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Proveedor">
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>

        <div className="rounded-xl border border-border bg-bg p-3">
          <p className="mb-2 text-[13px] font-medium text-fg">Agregar productos</p>
          <div className="grid grid-cols-[1fr_auto_auto] gap-2">
            <Select value={pid} onChange={(e) => { setPid(e.target.value); setCost(products.find((p) => p.id === e.target.value)?.cost ?? 0); }}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Input type="number" min={1} value={qty || ""} onChange={(e) => setQty(Math.max(0, +e.target.value))} className="w-16 text-center" />
            <Input type="number" min={0} value={cost || ""} onChange={(e) => setCost(Math.max(0, +e.target.value))} className="w-24 text-right" />
          </div>
          <Button size="sm" variant="secondary" className="mt-2 w-full" onClick={addLine}>
            <Plus className="h-4 w-4" /> Agregar ítem
          </Button>
        </div>

        {lines.length > 0 && (
          <div className="space-y-1 rounded-xl border border-border">
            {lines.map((l) => (
              <div key={l.productId} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-fg">{pname(l.productId)}</span>
                <span className="text-muted tnum">{l.qty} × {money(l.unitCost)}</span>
                <span className="w-24 text-right font-semibold text-fg tnum">{money(l.qty * l.unitCost)}</span>
                <button onClick={() => setLines((p) => p.filter((x) => x.productId !== l.productId))} className="text-muted hover:text-danger" aria-label="Quitar">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-border px-3 py-2 text-sm font-semibold">
              <span className="text-fg">Total</span>
              <span className="text-fg tnum">{money(total)}</span>
            </div>
          </div>
        )}

        <Field label="Forma de pago">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
            {payMethods.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </Select>
        </Field>
        {method === "cuenta-corriente" && (
          <p className="text-[12.5px] text-warning">
            Queda como deuda en la cuenta corriente del proveedor.
          </p>
        )}
      </div>
    </Drawer>
  );
}

/* ---------------- Gasto general ---------------- */
export function ExpenseDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { registerExpense } = useFinance();
  const [category, setCategory] = useState(expenseCategories[0]);
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PayMethod>("efectivo");

  useEffect(() => {
    if (!open) return;
    setCategory(expenseCategories[0]);
    setVendor("");
    setDescription("");
    setAmount(0);
    setMethod("efectivo");
  }, [open]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Registrar gasto / compra"
      subtitle="Cualquier gasto del comercio: mercadería, almacén, verdulería, servicios, sueldos, impuestos."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={amount <= 0} onClick={() => { registerExpense({ category, vendor, description, amount, method }); onClose(); }}>
            Registrar {money(amount)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Rubro">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {expenseCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Comercio / proveedor" hint="Opcional. Ej: Almacén Don José, Verdulería La Esquina">
          <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="¿A quién le compraste?" />
        </Field>
        <Field label="Detalle" hint="Opcional">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: cajones de fruta, factura de luz…" />
        </Field>
        <Field label="Importe">
          <Input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Math.max(0, +e.target.value))} />
        </Field>
        <Field label="Forma de pago">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
            {payMethods.filter((m) => m.id !== "cuenta-corriente").map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Pago a proveedor ---------------- */
export function SupplierPaymentDrawer({
  open,
  onClose,
  supplierId: preId,
}: {
  open: boolean;
  onClose: () => void;
  supplierId?: string;
}) {
  const { suppliers, payToSupplier } = useFinance();
  const [supplierId, setSupplierId] = useState(preId ?? suppliers[0]?.id ?? "");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PayMethod>("transferencia");

  const supplier = suppliers.find((s) => s.id === supplierId);

  useEffect(() => {
    if (!open) return;
    const id = preId ?? suppliers[0]?.id ?? "";
    setSupplierId(id);
    setAmount(suppliers.find((s) => s.id === id)?.balance ?? 0);
    setMethod("transferencia");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preId]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Pago a proveedor"
      subtitle="Registrá un pago y descontá el saldo de la cuenta corriente."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={amount <= 0 || !supplierId} onClick={() => { payToSupplier({ supplierId, amount, method }); onClose(); }}>
            Pagar {money(amount)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Proveedor">
          <Select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setAmount(suppliers.find((s) => s.id === e.target.value)?.balance ?? 0); }} disabled={!!preId}>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </Field>
        {supplier && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-bg px-4 py-3 text-sm">
            <span className="text-muted">Saldo en cuenta</span>
            <span className={cn("font-semibold tnum", supplier.balance > 0 ? "text-warning" : "text-success")}>
              {money(supplier.balance)}
            </span>
          </div>
        )}
        <Field label="Importe a pagar">
          <Input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Math.max(0, +e.target.value))} />
        </Field>
        <Field label="Forma de pago">
          <Select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
            {payMethods.filter((m) => m.id !== "cuenta-corriente").map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </Select>
        </Field>
      </div>
    </Drawer>
  );
}

/* ---------------- Alta de proveedor ---------------- */
export function SupplierDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addSupplier } = useFinance();
  const [name, setName] = useState("");
  const [cuit, setCuit] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setCuit("");
  }, [open]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nuevo proveedor"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!name.trim()} onClick={() => { addSupplier(name.trim(), cuit.trim()); onClose(); }}>
            Crear proveedor
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Razón social / nombre">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Distribuidora Ejemplo S.A." />
        </Field>
        <Field label="CUIT" hint="Opcional">
          <Input value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="30-00000000-0" />
        </Field>
      </div>
    </Drawer>
  );
}
