import { useState } from "react";
import {
  Plus,
  RefreshCw,
  MoreVertical,
  Star,
  Unplug,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  Package,
  ShoppingBag,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Field";
import { useML } from "@/context/ml-context";
import {
  siteMeta,
  badgeMeta,
  type MLAccount,
  type MLReputation,
} from "@/data/ml";
import { money, num, cn } from "@/lib/utils";

const repColor: Record<MLReputation, string> = {
  verde: "#00a650",
  amarillo: "#f5c518",
  rojo: "#e02020",
  "sin-reputacion": "#9aa3b2",
};
const repFill: Record<MLReputation, number> = {
  verde: 5,
  amarillo: 3,
  rojo: 1,
  "sin-reputacion": 0,
};

export function MercadoLibre() {
  const { accounts, totals } = useML();
  const [connecting, setConnecting] = useState(false);

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Mercado Libre"
        subtitle="Conectá todas tus cuentas de Mercado Libre y gestionálas desde un solo lugar."
        actions={
          <Button onClick={() => setConnecting(true)}>
            <Plus className="h-4 w-4" />
            Conectar cuenta
          </Button>
        }
      />

      {/* summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Summary icon={ShoppingBag} label="Cuentas conectadas" value={num(accounts.length)} />
        <Summary icon={Package} label="Publicaciones activas" value={num(totals.listings)} />
        <Summary icon={HelpCircle} label="Preguntas sin responder" value={num(totals.questions)} tone="warning" />
        <Summary icon={Star} label="Ventas hoy" value={money(totals.salesToday)} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {accounts.map((acc) => (
          <AccountCard key={acc.id} acc={acc} />
        ))}

        {/* add card */}
        <button
          onClick={() => setConnecting(true)}
          className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/40 text-muted transition-colors hover:border-brand/50 hover:bg-surface hover:text-brand"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-surface-2">
            <Plus className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium">Conectar otra cuenta</span>
          <span className="max-w-[220px] text-center text-[12.5px] text-muted">
            Podés vincular tantas cuentas de Mercado Libre como necesites.
          </span>
        </button>
      </div>

      <ConnectDrawer open={connecting} onClose={() => setConnecting(false)} />
    </div>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  tone?: "warning";
}) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          tone === "warning" ? "bg-warning/12 text-warning" : "bg-brand/12 text-brand",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[12.5px] text-muted">{label}</p>
        <p className="text-lg font-bold tracking-tight text-fg tnum">{value}</p>
      </div>
    </Card>
  );
}

function AccountCard({ acc }: { acc: MLAccount }) {
  const { makeDefault, disconnect, sync } = useML();
  const [menu, setMenu] = useState(false);
  const site = siteMeta[acc.site];

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff159] text-[13px] font-bold text-[#2d3277]">
          {acc.nickname.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-fg">{acc.nickname}</p>
            {acc.isDefault && <Badge tone="brand">Principal</Badge>}
          </div>
          <p className="truncate text-[12.5px] text-muted">
            {site.flag} {site.label} · {acc.email}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Opciones de la cuenta"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menu && (
            <>
              <button aria-hidden className="fixed inset-0 z-30 cursor-default" onClick={() => setMenu(false)} />
              <div className="absolute right-0 z-40 mt-1 w-52 origin-top-right animate-fade-up rounded-xl border border-border bg-surface p-1.5 shadow-pop">
                <button
                  disabled={acc.isDefault}
                  onClick={() => {
                    makeDefault(acc.id);
                    setMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-fg/80 transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Star className="h-4 w-4" />
                  Marcar como principal
                </button>
                <button
                  onClick={() => {
                    disconnect(acc.id);
                    setMenu(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                >
                  <Unplug className="h-4 w-4" />
                  Desconectar cuenta
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* reputation */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-6 rounded-full"
              style={{
                background: i < repFill[acc.reputation] ? repColor[acc.reputation] : "rgb(var(--surface-2))",
              }}
            />
          ))}
        </div>
        {acc.badge && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold"
            style={{ background: `${badgeMeta[acc.badge].color}1f`, color: badgeMeta[acc.badge].color }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {badgeMeta[acc.badge].label}
          </span>
        )}
      </div>

      {/* health warning */}
      {acc.health === "token-expira" && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/[0.08] px-3 py-2 text-[12.5px] text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          El token de acceso vence pronto. Reconectá para no perder la sincronización.
        </div>
      )}

      {/* metrics */}
      <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-bg">
        <Metric icon={Package} label="Publicaciones" value={num(acc.activeListings)} />
        <Metric icon={HelpCircle} label="Preguntas" value={num(acc.pendingQuestions)} highlight={acc.pendingQuestions > 0} />
        <Metric icon={MessageSquare} label="Mensajes" value={num(acc.pendingMessages)} highlight={acc.pendingMessages > 0} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[12px] text-muted">
          Ventas hoy <span className="font-semibold text-fg tnum">{money(acc.salesToday)}</span> · Sync {acc.lastSync}
        </p>
        <Button variant="outline" size="sm" onClick={() => sync(acc.id)}>
          <RefreshCw className="h-3.5 w-3.5" />
          Sincronizar
        </Button>
      </div>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-3 py-2.5 text-center">
      <Icon className={cn("mx-auto h-4 w-4", highlight ? "text-warning" : "text-muted")} />
      <p className={cn("mt-1 text-base font-bold tnum", highlight ? "text-warning" : "text-fg")}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function ConnectDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { connect } = useML();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState<MLAccount["site"]>("MLA");

  const reset = () => {
    setNickname("");
    setEmail("");
    setSite("MLA");
  };

  return (
    <Drawer
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Conectar cuenta de Mercado Libre"
      subtitle="Autorizá el acceso vía OAuth para sincronizar publicaciones, ventas y preguntas."
      footer={
        <>
          <Button variant="ghost" onClick={() => { reset(); onClose(); }}>
            Cancelar
          </Button>
          <Button
            disabled={!nickname.trim()}
            onClick={() => {
              connect({ nickname: nickname.trim(), email: email.trim() || "sin-email@ml.com", site });
              reset();
              onClose();
            }}
          >
            Conectar cuenta
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/[0.06] px-4 py-3 text-[13px] text-fg/80">
          <ShieldCheck className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" />
          AppJeez te redirige a Mercado Libre para que autorices el acceso. No guardamos tu
          contraseña: sólo un token seguro que podés revocar cuando quieras.
        </div>

        <Field label="Apodo de la cuenta (nickname)">
          <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="MI.TIENDA.OFICIAL" />
        </Field>
        <Field label="Email asociado" hint="Opcional, para identificarla en el panel">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cuenta@miempresa.com" />
        </Field>
        <Field label="Sitio">
          <Select value={site} onChange={(e) => setSite(e.target.value as MLAccount["site"])}>
            {Object.entries(siteMeta).map(([k, v]) => (
              <option key={k} value={k}>
                {v.flag} Mercado Libre {v.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-xl border border-border bg-bg p-4">
          <p className="text-[13px] font-medium text-fg">¿Qué se sincroniza?</p>
          <ul className="mt-2 space-y-1.5 text-[12.5px] text-muted">
            {["Publicaciones y stock", "Ventas y facturación", "Preguntas y mensajes", "Reputación y métricas"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Drawer>
  );
}
