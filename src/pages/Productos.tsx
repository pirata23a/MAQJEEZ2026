import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search, Minus, PackageX, PackagePlus, Pencil, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Field";
import { ChannelPills, Thumb } from "@/components/ChannelPills";
import { AdjustStockDrawer } from "@/components/AdjustStockDrawer";
import { useProducts, stockLevel } from "@/context/products-context";
import { categories, channelMeta, type Channel, type Product } from "@/data/products";
import { money, num, cn } from "@/lib/utils";

const allChannels: Channel[] = ["ml", "tn", "local", "woo"];
const statusFilters = [
  { id: "all", label: "Todos" },
  { id: "ok", label: "Con stock" },
  { id: "low", label: "Stock bajo" },
  { id: "out", label: "Sin stock" },
] as const;

type Editing = Product | "new" | null;

const emptyDraft: Omit<Product, "id"> = {
  sku: "",
  name: "",
  category: categories[0],
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 5,
  alertOn: true,
  sold30: 0,
  soldTotal: 0,
  since: new Date().toISOString().slice(0, 10),
  channels: ["local"],
  image: null,
};

export function Productos() {
  const { products, addProduct, updateProduct, bulkUpdate, sellUnits, restock } = useProducts();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<(typeof statusFilters)[number]["id"]>("all");
  const [editing, setEditing] = useState<Editing>(null);
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const toggleSel = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const clearSel = () => setSelected(new Set());

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (cat !== "all" && p.category !== cat) return false;
        if (status !== "all" && stockLevel(p) !== status) return false;
        const q = query.trim().toLowerCase();
        if (q && !p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q))
          return false;
        return true;
      }),
    [products, cat, status, query],
  );

  const cats = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const stats = useMemo(() => {
    const value = products.reduce((a, p) => a + p.cost * p.stock, 0);
    const out = products.filter((p) => stockLevel(p) === "out").length;
    const low = products.filter((p) => stockLevel(p) === "low").length;
    return { total: products.length, value, out, low };
  }, [products]);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Productos"
        subtitle="Catálogo único. El stock se descuenta automáticamente en todos los canales con cada venta."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        }
      />

      {/* stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Productos" value={num(stats.total)} />
        <Stat label="Valor de inventario" value={money(stats.value)} />
        <Stat label="Stock bajo" value={num(stats.low)} tone="warning" />
        <Stat label="Sin stock" value={num(stats.out)} tone="danger" />
      </div>

      {/* toolbar */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="pl-9"
          />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="sm:w-56">
          <option value="all">Todos los rubros</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          {statusFilters.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                status === s.id ? "bg-brand/10 text-brand" : "text-muted hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-brand/30 bg-brand/[0.06] px-4 py-2.5">
          <span className="text-[13px] font-semibold text-brand tnum">{selected.size} seleccionados</span>
          <Button size="sm" onClick={() => setBulkOpen(true)}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Editar en masa
          </Button>
          <button onClick={clearSel} className="text-[13px] font-medium text-muted hover:text-fg">
            Limpiar
          </button>
        </div>
      )}

      {/* table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todos"
                    checked={filtered.length > 0 && filtered.every((p) => selected.has(p.id))}
                    onChange={(e) =>
                      setSelected((s) => {
                        const n = new Set(s);
                        if (e.target.checked) filtered.forEach((p) => n.add(p.id));
                        else filtered.forEach((p) => n.delete(p.id));
                        return n;
                      })
                    }
                    className="h-4 w-4 accent-[rgb(var(--brand))]"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Canales</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-center font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const lvl = stockLevel(p);
                return (
                  <tr
                    key={p.id}
                    className={cn(
                      "group border-b border-border/60 last:border-0 transition-colors hover:bg-surface-2",
                      selected.has(p.id) && "bg-brand/[0.04]",
                    )}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Seleccionar ${p.name}`}
                        checked={selected.has(p.id)}
                        onChange={() => toggleSel(p.id)}
                        className="h-4 w-4 accent-[rgb(var(--brand))]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb name={p.name} category={p.category} image={p.image} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">{p.name}</p>
                          <p className="truncate font-mono text-[11.5px] text-muted">
                            {p.sku} · {p.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <ChannelPills channels={p.channels} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-fg tnum">{money(p.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-fg tnum">{p.stock}</span>
                        {lvl === "out" && <Badge tone="danger">Sin stock</Badge>}
                        {lvl === "low" && <Badge tone="warning">Bajo</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn
                          label="Registrar venta (-1)"
                          disabled={p.stock <= 0}
                          onClick={() => sellUnits(p.id, 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Reponer (+1)" onClick={() => restock(p.id, 1)}>
                          <PackagePlus className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Ajuste manual" onClick={() => setAdjustId(p.id)}>
                          <SlidersHorizontal className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn label="Editar" onClick={() => setEditing(p)}>
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="grid place-items-center gap-2 px-6 py-16 text-center">
            <PackageX className="h-8 w-8 text-muted" />
            <p className="text-sm text-muted">No hay productos que coincidan con el filtro.</p>
          </div>
        )}
      </Card>

      <ProductDrawer
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={(draft, id) => {
          if (id) updateProduct(id, draft);
          else addProduct(draft);
          setEditing(null);
        }}
      />

      <AdjustStockDrawer
        open={adjustId !== null}
        productId={adjustId ?? undefined}
        onClose={() => setAdjustId(null)}
      />

      <BulkDrawer
        open={bulkOpen}
        count={selected.size}
        onClose={() => setBulkOpen(false)}
        cats={cats}
        onApply={(patch) => {
          bulkUpdate([...selected], patch);
          setBulkOpen(false);
          clearSel();
        }}
      />
    </div>
  );
}

function BulkDrawer({
  open,
  count,
  cats,
  onClose,
  onApply,
}: {
  open: boolean;
  count: number;
  cats: string[];
  onClose: () => void;
  onApply: (patch: import("@/context/products-context").BulkPatch) => void;
}) {
  const [mode, setMode] = useState<"none" | "set" | "incPct" | "decPct" | "incAmt" | "decAmt">("none");
  const [value, setValue] = useState(0);
  const [category, setCategory] = useState("");
  const [minStock, setMinStock] = useState("");

  const reset = () => {
    setMode("none");
    setValue(0);
    setCategory("");
    setMinStock("");
  };

  const hasChange = mode !== "none" || category !== "" || minStock !== "";

  return (
    <Drawer
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Editar en masa"
      subtitle={`${count} productos seleccionados. Solo se cambia lo que completes.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancelar</Button>
          <Button
            disabled={!hasChange}
            onClick={() => {
              const patch: import("@/context/products-context").BulkPatch = {};
              if (mode !== "none") patch.price = { mode, value };
              if (category) patch.category = category;
              if (minStock !== "") patch.minStock = Math.max(0, +minStock);
              onApply(patch);
              reset();
            }}
          >
            Aplicar a {count}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-fg">Precio</p>
          <div className="grid grid-cols-2 gap-2">
            <Select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
              <option value="none">No cambiar</option>
              <option value="incPct">Aumentar %</option>
              <option value="decPct">Bajar %</option>
              <option value="incAmt">Aumentar $</option>
              <option value="decAmt">Bajar $</option>
              <option value="set">Fijar en $</option>
            </Select>
            <Input
              type="number"
              min={0}
              disabled={mode === "none"}
              value={mode === "none" ? "" : value || ""}
              onChange={(e) => setValue(Math.max(0, +e.target.value))}
              placeholder={mode.includes("Pct") ? "%" : "$"}
            />
          </div>
        </div>
        <Field label="Rubro" hint="Opcional">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">No cambiar</option>
            {cats.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Stock mínimo (aviso de compra)" hint="Opcional">
          <Input type="number" min={0} value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="No cambiar" />
        </Field>
      </div>
    </Drawer>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warning" | "danger";
}) {
  return (
    <Card className="p-4">
      <p className="text-[12.5px] text-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-bold tracking-tight tnum",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
          !tone && "text-fg",
        )}
      >
        {value}
      </p>
    </Card>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function ProductDrawer({
  editing,
  onClose,
  onSave,
}: {
  editing: Editing;
  onClose: () => void;
  onSave: (draft: Omit<Product, "id">, id?: string) => void;
}) {
  const open = editing !== null;
  const existing = editing && editing !== "new" ? editing : null;
  const [draft, setDraft] = useState<Omit<Product, "id">>(emptyDraft);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // sync draft when target changes
  const targetKey = existing ? existing.id : editing === "new" ? "new" : null;
  if (open && targetKey !== loadedFor) {
    setDraft(existing ? { ...existing } : emptyDraft);
    setLoadedFor(targetKey);
  }
  if (!open && loadedFor !== null) setLoadedFor(null);

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const toggleChannel = (c: Channel) =>
    setDraft((d) => ({
      ...d,
      channels: d.channels.includes(c)
        ? d.channels.filter((x) => x !== c)
        : [...d.channels, c],
    }));

  const valid = draft.name.trim() && draft.sku.trim() && draft.price > 0;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={existing ? "Editar producto" : "Nuevo producto"}
      subtitle={existing ? existing.sku : "Cargá un producto en el catálogo central"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!valid} onClick={() => onSave(draft, existing?.id)}>
            {existing ? "Guardar cambios" : "Crear producto"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre">
          <Input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Taladro percutor 650W" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU">
            <Input value={draft.sku} onChange={(e) => set("sku", e.target.value)} placeholder="MAQ-000" />
          </Field>
          <Field label="Categoría">
            <Select value={draft.category} onChange={(e) => set("category", e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio de venta" hint="Con IVA">
            <Input type="number" min={0} value={draft.price || ""} onChange={(e) => set("price", +e.target.value)} />
          </Field>
          <Field label="Costo">
            <Input type="number" min={0} value={draft.cost || ""} onChange={(e) => set("cost", +e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock actual">
            <Input type="number" min={0} value={draft.stock} onChange={(e) => set("stock", +e.target.value)} />
          </Field>
          <Field label="Stock mínimo" hint="Alerta de reposición">
            <Input type="number" min={0} value={draft.minStock} onChange={(e) => set("minStock", +e.target.value)} />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-fg">Canales vinculados</p>
          <div className="grid grid-cols-2 gap-2">
            {allChannels.map((c) => {
              const on = draft.channels.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChannel(c)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    on
                      ? "border-brand bg-brand/[0.06] text-fg"
                      : "border-border bg-bg text-muted hover:text-fg",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: channelMeta[c].color }}
                  />
                  {channelMeta[c].label}
                </button>
              );
            })}
          </div>
        </div>

        {existing && (
          <div className="rounded-xl border border-border bg-bg p-3 text-[12.5px] text-muted">
            Margen estimado:{" "}
            <span className="font-semibold text-success tnum">
              {draft.price > 0 ? Math.round(((draft.price - draft.cost) / draft.price) * 100) : 0}%
            </span>{" "}
            · Valor en stock{" "}
            <span className="font-semibold text-fg tnum">{money(draft.cost * draft.stock)}</span>
          </div>
        )}
      </div>
    </Drawer>
  );
}
