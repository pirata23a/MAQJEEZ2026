import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Wrench, Zap, Fuel, Camera, Trash2, HandCoins, Phone, ChevronRight, CheckCircle2,
  Printer, MessageCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { HelpAccordion } from "@/components/HelpAccordion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Field";
import { useToast } from "@/context/toast-context";
import { usePos } from "@/context/pos-context";
import { api, ApiError } from "@/lib/api";
import { money, num, cn } from "@/lib/utils";
import {
  machineTypes, repairStatuses, statusMeta, payState, fileToCompressedDataUrl,
  type Repair, type RepairStatus, type MachineType, type Tone,
} from "@/data/taller";
import { payMethods, type PayMethod } from "@/data/finance";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Error de conexión");
const badgeTone = (t: Tone) => (t === "neutral" ? "muted" : t) as "brand" | "success" | "warning" | "danger" | "muted";
const dateFmt = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const dateFull = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Teléfono argentino -> formato wa.me (sin +, con 549 si no trae país)
function waPhone(phone: string): string {
  let d = (phone || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("54")) return d;
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("15")) d = d.slice(2);
  return "549" + d;
}

function waMessage(r: Repair): string {
  const maquina = [r.brand, r.model].filter(Boolean).join(" ") || "tu máquina";
  const hola = `Hola${r.clientName ? " " + r.clientName : ""}! Somos de MAQJEEZ.`;
  const ref = `${maquina} (orden ${r.code})`;
  const saldo = Math.max(0, r.budget - r.paid);
  if (r.status === "presupuestado")
    return `${hola} El presupuesto de ${ref} es de ${money(r.budget)}. ¿Lo aprobás así avanzamos?`;
  if (r.status === "esperando-repuesto")
    return `${hola} Estamos esperando un repuesto para ${ref}. Te avisamos apenas llegue.`;
  if (r.status === "reparado" || r.status === "informado")
    return `${hola} ${ref} ya está lista para retirar.${saldo > 0 ? ` Saldo a abonar: ${money(saldo)}.` : ""}`;
  if (r.status === "entregado")
    return `${hola} Gracias por confiar en nosotros. ${ref} fue entregada. Cualquier cosa, escribinos.`;
  return `${hola} Novedades de ${ref}: ${statusMeta(r.status).label}.`;
}

function printReceipt(r: Repair) {
  const maquina = [r.brand, r.model].filter(Boolean).join(" ") || "—";
  const tipo = machineTypes.find((m) => m.id === r.machineType)?.label ?? "";
  const saldo = Math.max(0, r.budget - r.paid);
  const row = (k: string, v: string) =>
    `<tr><td style="padding:4px 10px 4px 0;color:#666">${k}</td><td style="padding:4px 0;font-weight:600">${v}</td></tr>`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${r.code} · MAQJEEZ</title>
    <style>body{font-family:system-ui,Arial,sans-serif;color:#111;max-width:640px;margin:32px auto;padding:0 20px}
    h1{font-size:22px;margin:0}.muted{color:#777;font-size:13px}hr{border:none;border-top:1px solid #ddd;margin:16px 0}
    table{border-collapse:collapse;font-size:14px}.tot{font-size:16px}.box{border:1px solid #ddd;border-radius:10px;padding:12px 16px;margin-top:12px}
    @media print{button{display:none}}</style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:flex-end">
      <div><h1>MAQJEEZ</h1><div class="muted">Servicio técnico · Orden de taller</div></div>
      <div style="text-align:right"><div style="font-size:20px;font-weight:700">${r.code}</div><div class="muted">${dateFull.format(new Date((r.createdAt || "").replace(" ", "T")))}</div></div>
    </div><hr>
    <table>
      ${row("Cliente", r.clientName || "—")}
      ${row("Teléfono", r.clientPhone || "—")}
      ${row("Máquina", `${tipo} · ${maquina}`)}
      ${row("Falla / motivo", r.fault || "—")}
      ${row("Estado", statusMeta(r.status).label)}
    </table>
    <div class="box">
      <table style="width:100%">
        ${row("Presupuesto", money(r.budget))}
        ${row("Cobrado", money(r.paid))}
        <tr><td style="padding:6px 10px 0 0" class="tot">Saldo</td><td style="padding:6px 0 0;font-weight:700" class="tot">${money(saldo)}</td></tr>
      </table>
    </div>
    ${r.notes ? `<p class="muted" style="margin-top:14px">Obs.: ${r.notes}</p>` : ""}
    <p class="muted" style="margin-top:24px">Conservá este comprobante para el retiro y la garantía.</p>
    <button onclick="window.print()" style="margin-top:16px;padding:10px 18px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer">Imprimir</button>
    </body></html>`;
  const w = window.open("", "_blank", "width=720,height=800");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

/* ------------------------------- hook ------------------------------- */
function useRepairs() {
  const toast = useToast();
  const { reload: reloadSales } = usePos();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try { setRepairs(await api<Repair[]>("/repairs")); } finally { setLoading(false); }
  }, []);
  useEffect(() => { reload().catch(() => setLoading(false)); }, [reload]);

  return {
    repairs, loading, reload,
    create: async (body: Partial<Repair> & { photosIn?: string[] }) => {
      const r = await api<Repair>("/repairs", { method: "POST", body });
      await reload();
      toast("Orden de taller creada");
      return r;
    },
    patch: async (id: string, body: Partial<Repair>) => {
      const r = await api<Repair>(`/repairs/${id}`, { method: "PATCH", body });
      await reload();
      return r;
    },
    charge: async (id: string, amount: number, method: PayMethod) => {
      const r = await api<Repair>(`/repairs/${id}/charge`, { method: "POST", body: { amount, method } });
      await Promise.all([reload(), reloadSales()]);
      toast("Cobro registrado · suma a la venta del día");
      return r;
    },
    addPhotos: async (id: string, slot: "in" | "out", images: string[]) => {
      const r = await api<Repair>(`/repairs/${id}/photos`, { method: "POST", body: { slot, images } });
      await reload();
      toast(`Foto${images.length > 1 ? "s" : ""} guardada${images.length > 1 ? "s" : ""}`);
      return r;
    },
    remove: async (id: string) => {
      await api(`/repairs/${id}`, { method: "DELETE" });
      await reload();
      toast("Orden eliminada");
    },
    toast,
  };
}

/* ------------------------------- page ------------------------------- */
const activeStatuses: RepairStatus[] = ["ingresado", "presupuestado", "aceptado", "esperando-repuesto", "en-reparacion", "reparado", "informado"];

export function Taller() {
  const repo = useRepairs();
  const { repairs, loading } = repo;
  const [newOpen, setNewOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RepairStatus | "todas" | "activas">("activas");

  const rows = useMemo(() => {
    if (filter === "todas") return repairs;
    if (filter === "activas") return repairs.filter((r) => r.status !== "entregado" && r.status !== "rechazado");
    return repairs.filter((r) => r.status === filter);
  }, [repairs, filter]);

  const enTaller = repairs.filter((r) => activeStatuses.includes(r.status)).length;
  const porCobrar = repairs
    .filter((r) => r.status !== "rechazado")
    .reduce((a, r) => a + Math.max(0, r.budget - r.paid), 0);
  const listas = repairs.filter((r) => r.status === "reparado" || r.status === "informado").length;

  const detail = repairs.find((r) => r.id === detailId) ?? null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Taller · Servicio técnico"
        subtitle="Recepción de máquinas, presupuestos, reparación, cobros y fotos de ingreso/egreso para garantía."
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> Recibir máquina
          </Button>
        }
      />

      <HelpAccordion
        title="¿Cómo funciona el taller?"
        intro={
          <>
            Llevá cada máquina que entra a reparar como una <strong className="text-fg">orden de taller</strong>:
            desde que ingresa hasta que la entregás, con su presupuesto, cobros y fotos.
          </>
        }
        steps={[
          { title: "Recibí la máquina", desc: "«Recibir máquina»: cargás cliente, tipo (eléctrica o a explosión), marca, modelo, la falla y sacás fotos de cómo llega." },
          { title: "Presupuestá", desc: "Cargás el presupuesto y lo pasás a «Presupuestado». Cuando el cliente acepta → «Aceptado»." },
          { title: "Repará y seguí el estado", desc: "Esperando repuesto, en reparación, reparado, informado al cliente… cada orden muestra su estado." },
          { title: "Cobrá y entregá", desc: "Registrás el cobro (total o seña), sacás fotos de cómo se va (garantía) y la marcás «Entregado». El cobro entra a Finanzas." },
        ]}
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatCard icon={Wrench} tone="brand" label="En taller" value={num(enTaller)} />
        <StatCard icon={CheckCircle2} tone="success" label="Listas / informadas" value={num(listas)} />
        <StatCard icon={HandCoins} tone="warning" label="Por cobrar" value={money(porCobrar)} />
      </div>

      {/* filtros por estado */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <Chip active={filter === "activas"} onClick={() => setFilter("activas")}>En curso</Chip>
        {repairStatuses.map((s) => (
          <Chip key={s.id} active={filter === s.id} onClick={() => setFilter(s.id)}>{s.label}</Chip>
        ))}
        <Chip active={filter === "todas"} onClick={() => setFilter("todas")}>Todas</Chip>
      </div>

      {loading ? (
        <Card className="px-6 py-16 text-center text-sm text-muted">Cargando órdenes…</Card>
      ) : rows.length === 0 ? (
        <Card className="grid place-items-center gap-3 px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Wrench className="h-6 w-6" />
          </span>
          <h2 className="text-base font-semibold text-fg">
            {filter === "activas" || filter === "todas" ? "Todavía no recibiste máquinas" : "No hay órdenes en este estado"}
          </h2>
          <p className="max-w-sm text-sm text-muted">
            Cuando entra una máquina a reparar, cargala acá con «Recibir máquina» para seguir el presupuesto, la reparación y el cobro.
          </p>
          <Button onClick={() => setNewOpen(true)}><Plus className="h-4 w-4" /> Recibir máquina</Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => <RepairRow key={r.id} r={r} onOpen={() => setDetailId(r.id)} />)}
        </div>
      )}

      <NewRepairDrawer open={newOpen} onClose={() => setNewOpen(false)} repo={repo} />
      <RepairDetailDrawer repair={detail} onClose={() => setDetailId(null)} repo={repo} />
    </div>
  );
}

/* ------------------------------- row ------------------------------- */
function RepairRow({ r, onOpen }: { r: Repair; onOpen: () => void }) {
  const st = statusMeta(r.status);
  const pay = payState(r);
  const Icon = r.machineType === "electrica" ? Zap : Fuel;
  return (
    <button onClick={onOpen} className="w-full text-left">
      <Card className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:border-brand/40">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-[180px] flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11.5px] text-muted">{r.code}</span>
            <Badge tone={badgeTone(st.tone)}>{st.label}</Badge>
          </div>
          <p className="mt-0.5 font-semibold text-fg">
            {[r.brand, r.model].filter(Boolean).join(" ") || "Máquina sin datos"}
          </p>
          <p className="truncate text-[12.5px] text-muted">
            {r.clientName || "Sin cliente"}{r.fault ? ` · ${r.fault}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted">Presupuesto</p>
          <p className="font-bold text-fg tnum">{r.budget > 0 ? money(r.budget) : "—"}</p>
          <Badge tone={badgeTone(pay.tone)} className="mt-0.5">{pay.label}</Badge>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
      </Card>
    </button>
  );
}

/* ------------------------- nueva orden (recepción) ------------------------- */
function NewRepairDrawer({ open, onClose, repo }: { open: boolean; onClose: () => void; repo: ReturnType<typeof useRepairs> }) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [machineType, setMachineType] = useState<MachineType>("explosion");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fault, setFault] = useState("");
  const [budget, setBudget] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClientName(""); setClientPhone(""); setMachineType("explosion");
    setBrand(""); setModel(""); setFault(""); setBudget(0); setPhotos([]);
  }, [open]);

  const guardar = async () => {
    if (!clientName.trim() && !brand.trim()) { repo.toast("Cargá al menos el cliente o la marca", "error"); return; }
    setBusy(true);
    try {
      await repo.create({
        clientName: clientName.trim(), clientPhone: clientPhone.trim(), machineType,
        brand: brand.trim(), model: model.trim(), fault: fault.trim(),
        budget, status: budget > 0 ? "presupuestado" : "ingresado", photosIn: photos,
      });
      onClose();
    } catch (e) { repo.toast(errMsg(e), "error"); } finally { setBusy(false); }
  };

  return (
    <Drawer
      open={open} onClose={onClose}
      title="Recibir máquina" subtitle="Datos de ingreso al taller."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={busy} onClick={guardar}>Crear orden</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cliente"><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre" /></Field>
          <Field label="Teléfono" hint="Opcional"><Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Cel / WhatsApp" /></Field>
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-fg">Tipo de máquina</p>
          <div className="grid grid-cols-2 gap-2">
            {machineTypes.map((m) => {
              const Icon = m.id === "electrica" ? Zap : Fuel;
              const on = machineType === m.id;
              return (
                <button
                  key={m.id} onClick={() => setMachineType(m.id)}
                  className={cn("rounded-xl border p-3 text-left transition-colors",
                    on ? "border-brand bg-brand/5" : "border-border hover:border-brand/40")}
                >
                  <Icon className={cn("h-5 w-5", on ? "text-brand" : "text-muted")} />
                  <p className={cn("mt-1 text-[13px] font-medium", on ? "text-brand" : "text-fg")}>{m.label}</p>
                  <p className="text-[11px] text-muted">{m.hint}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Marca"><Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej: Stihl, Honda…" /></Field>
          <Field label="Modelo"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Ej: FS 220" /></Field>
        </div>

        <Field label="Falla / motivo de ingreso">
          <textarea
            value={fault} onChange={(e) => setFault(e.target.value)} rows={2}
            placeholder="¿Qué le pasa? Ej: no arranca, pierde potencia…"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:border-brand focus:bg-surface"
          />
        </Field>

        <Field label="Presupuesto" hint="Opcional ahora. Si lo cargás, la orden queda «Presupuestado».">
          <Input type="number" min={0} value={budget || ""} onChange={(e) => setBudget(Math.max(0, +e.target.value))} placeholder="0" />
        </Field>

        <PhotoPicker
          label="Fotos de ingreso (cómo llega)"
          hint="Para la garantía: dejá registro del estado en que entra."
          photos={photos}
          onAdd={(imgs) => setPhotos((p) => [...p, ...imgs])}
          onRemove={(i) => setPhotos((p) => p.filter((_, x) => x !== i))}
        />
      </div>
    </Drawer>
  );
}

/* ------------------------- detalle / gestión ------------------------- */
function RepairDetailDrawer({ repair, onClose, repo }: { repair: Repair | null; onClose: () => void; repo: ReturnType<typeof useRepairs> }) {
  const [budget, setBudget] = useState(0);
  const [cobro, setCobro] = useState(0);
  const [method, setMethod] = useState<PayMethod>("efectivo");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!repair) return;
    setBudget(repair.budget);
    setNotes(repair.notes);
    setCobro(Math.max(0, repair.budget - repair.paid));
    setMethod("efectivo");
  }, [repair]);

  if (!repair) return <Drawer open={false} onClose={onClose} title="" >{null}</Drawer>;

  const pay = payState(repair);
  const saldo = Math.max(0, repair.budget - repair.paid);

  const doPatch = async (body: Partial<Repair>) => {
    setBusy(true);
    try { await repo.patch(repair.id, body); } catch (e) { repo.toast(errMsg(e), "error"); } finally { setBusy(false); }
  };
  const doCharge = async () => {
    if (cobro <= 0) return;
    setBusy(true);
    try { await repo.charge(repair.id, cobro, method); setCobro(0); } catch (e) { repo.toast(errMsg(e), "error"); } finally { setBusy(false); }
  };

  return (
    <Drawer
      open={!!repair} onClose={onClose}
      title={[repair.brand, repair.model].filter(Boolean).join(" ") || repair.code}
      subtitle={`${repair.code} · ${repair.clientName || "Sin cliente"}`}
      footer={<Button variant="ghost" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-5">
        {/* estado */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-fg">Estado</span>
          <div className="flex items-center gap-2">
            {repair.clientPhone && (
              <a href={`tel:${repair.clientPhone}`} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted hover:text-brand" aria-label="Llamar">
                <Phone className="h-4 w-4" />
              </a>
            )}
            <Select value={repair.status} disabled={busy} onChange={(e) => doPatch({ status: e.target.value as RepairStatus })} className="w-auto">
              {repairStatuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </Select>
          </div>
        </div>

        {/* acciones: comprobante + whatsapp */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => printReceipt(repair)}>
            <Printer className="h-4 w-4" /> Comprobante
          </Button>
          {repair.clientPhone ? (
            <a
              href={`https://wa.me/${waPhone(repair.clientPhone)}?text=${encodeURIComponent(waMessage(repair))}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-success/40 bg-success/10 text-[13.5px] font-medium text-success transition-colors hover:bg-success/15"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          ) : (
            <span className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border text-[12.5px] text-muted">
              Sin teléfono
            </span>
          )}
        </div>

        {repair.fault && (
          <div className="rounded-xl border border-border bg-bg px-4 py-3">
            <p className="text-[11.5px] text-muted">Falla declarada</p>
            <p className="text-[13.5px] text-fg">{repair.fault}</p>
          </div>
        )}

        {/* presupuesto + cobro */}
        <div className="rounded-xl border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-medium text-fg">Presupuesto y cobro</span>
            <Badge tone={badgeTone(pay.tone)}>{pay.label}</Badge>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Presupuesto">
                <Input type="number" min={0} value={budget || ""} onChange={(e) => setBudget(Math.max(0, +e.target.value))} />
              </Field>
            </div>
            <Button variant="secondary" disabled={busy || budget === repair.budget} onClick={() => doPatch({ budget })}>Guardar</Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-bg px-3 py-2 text-[13px]">
            <span className="text-muted">Cobrado</span><span className="text-right font-semibold text-success tnum">{money(repair.paid)}</span>
            <span className="text-muted">Saldo</span><span className={cn("text-right font-semibold tnum", saldo > 0 ? "text-danger" : "text-success")}>{money(saldo)}</span>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Field label="Registrar cobro"><Input type="number" min={0} value={cobro || ""} onChange={(e) => setCobro(Math.max(0, +e.target.value))} /></Field>
              </div>
              <Button disabled={busy || cobro <= 0} onClick={doCharge}><HandCoins className="h-4 w-4" /> Cobrar</Button>
            </div>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)}>
              {payMethods.filter((m) => m.id !== "cuenta-corriente").map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </Select>
            <p className="text-[11.5px] text-muted">El cobro queda registrado en Finanzas como ingreso.</p>
          </div>
        </div>

        {/* fotos */}
        <PhotoSection
          title="Fotos de ingreso (cómo llegó)"
          photos={repair.photosIn}
          onAdd={(imgs) => repo.addPhotos(repair.id, "in", imgs).catch((e) => repo.toast(errMsg(e), "error"))}
        />
        <PhotoSection
          title="Fotos de egreso (cómo se entrega · garantía)"
          photos={repair.photosOut}
          onAdd={(imgs) => repo.addPhotos(repair.id, "out", imgs).catch((e) => repo.toast(errMsg(e), "error"))}
        />

        {/* notas */}
        <div>
          <p className="mb-1.5 text-[13px] font-medium text-fg">Notas internas</p>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Repuestos pedidos, diagnóstico, observaciones…"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted/70 focus:border-brand focus:bg-surface"
          />
          <div className="mt-2 flex justify-end">
            <Button variant="secondary" size="sm" disabled={busy || notes === repair.notes} onClick={() => doPatch({ notes })}>Guardar notas</Button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-[11.5px] text-muted">
          <span>Ingresó {dateFmt.format(new Date(repair.createdAt.replace(" ", "T")))}</span>
          <button
            onClick={() => { if (confirm("¿Eliminar esta orden de taller?")) repo.remove(repair.id).then(onClose).catch((e) => repo.toast(errMsg(e), "error")); }}
            className="flex items-center gap-1 text-muted hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      </div>
    </Drawer>
  );
}

/* ------------------------------- piezas ------------------------------- */
function PhotoSection({ title, photos, onAdd }: { title: string; photos: string[]; onAdd: (imgs: string[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-fg">{title}</p>
      <PhotoPicker photos={photos} onAdd={onAdd} compact />
    </div>
  );
}

function PhotoPicker({
  label, hint, photos, onAdd, onRemove, compact,
}: {
  label?: string; hint?: string; photos: string[];
  onAdd: (imgs: string[]) => void; onRemove?: (i: number) => void; compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [working, setWorking] = useState(false);

  const pick = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setWorking(true);
    try {
      const imgs: string[] = [];
      for (const f of Array.from(files)) {
        try { imgs.push(await fileToCompressedDataUrl(f)); } catch { /* ignora archivo inválido */ }
      }
      if (imgs.length) onAdd(imgs);
    } finally {
      setWorking(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div>
      {label && <p className="mb-1.5 text-[13px] font-medium text-fg">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-border">
            <img src={src} alt="" className="h-full w-full object-cover" />
            {onRemove && (
              <button
                onClick={() => onRemove(i)}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Quitar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => ref.current?.click()}
          disabled={working}
          className={cn(
            "grid h-20 w-20 place-items-center rounded-xl border border-dashed border-border text-muted transition-colors hover:border-brand hover:text-brand",
            working && "opacity-60",
          )}
        >
          <div className="text-center">
            <Camera className="mx-auto h-5 w-5" />
            <span className="text-[10.5px]">{working ? "…" : "Foto"}</span>
          </div>
        </button>
        <input
          ref={ref} type="file" accept="image/*" capture="environment" multiple
          className="hidden" onChange={(e) => pick(e.target.files)}
        />
      </div>
      {hint && !compact && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value }: { icon: typeof Wrench; tone: "brand" | "success" | "warning"; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg",
          tone === "brand" && "bg-brand/12 text-brand",
          tone === "success" && "bg-success/12 text-success",
          tone === "warning" && "bg-warning/12 text-warning")}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[12.5px] text-muted">{label}</span>
      </div>
      <p className="text-xl font-bold tracking-tight text-fg tnum">{value}</p>
    </Card>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn("rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
        active ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface text-muted hover:text-fg")}
    >
      {children}
    </button>
  );
}
