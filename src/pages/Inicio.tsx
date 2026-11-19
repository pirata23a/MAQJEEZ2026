import {
  ShoppingBag,
  Store,
  Wallet,
  Building2,
  Plus,
  ArrowRight,
  CheckCircle2,
  FileText,
  Package,
  MessageSquare,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useNavigate } from "react-router-dom";
import { useML } from "@/context/ml-context";
import { useProducts } from "@/context/products-context";
import { num, cn } from "@/lib/utils";

const quickActions = [
  { label: "Cargar producto", icon: Package, tone: "brand", to: "/productos" },
  { label: "Nueva venta", icon: FileText, tone: "success", to: "/local-fisico" },
  { label: "Responder preguntas", icon: MessageSquare, tone: "warning", to: "/mercado-libre" },
];

export function Inicio() {
  const navigate = useNavigate();
  const { accounts, totals } = useML();
  const { products } = useProducts();
  const channels = [
    {
      name: "Mercado Libre",
      icon: ShoppingBag,
      connected: accounts.length > 0,
      meta: accounts.length
        ? `${num(accounts.length)} cuentas · ${num(totals.listings)} publicaciones`
        : "Conectá tu cuenta",
    },
    { name: "Mercado Pago", icon: Wallet, connected: true, meta: "Cobros sincronizados" },
    { name: "Tiendanube", icon: Store, connected: false, meta: "Conectá tu tienda" },
    {
      name: "Local físico",
      icon: Building2,
      connected: products.length > 0,
      meta: products.length ? `${num(products.length)} productos en catálogo` : "Cargá tu catálogo",
    },
  ];
  const activos = channels.filter((c) => c.connected).length;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Inicio"
        subtitle="Centralizá la gestión de todos tus canales desde un solo lugar."
        actions={
          <Button onClick={() => navigate("/mercado-libre")}>
            <Plus className="h-4 w-4" />
            Conectar canal
          </Button>
        }
      />

      {/* quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.to)}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-pop"
          >
            <span
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                a.tone === "brand" && "bg-brand/12 text-brand",
                a.tone === "success" && "bg-success/12 text-success",
                a.tone === "warning" && "bg-warning/12 text-warning",
              )}
            >
              <a.icon className="h-5 w-5" />
            </span>
            <span className="flex-1 font-semibold text-fg">{a.label}</span>
            <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      {/* channels */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Canales conectados</CardTitle>
          <span className="text-[13px] text-muted">{activos} de {channels.length} activos</span>
        </CardHeader>
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {channels.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg p-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-fg">
                <c.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-fg">{c.name}</p>
                <p className="truncate text-[12.5px] text-muted">{c.meta}</p>
              </div>
              {c.connected ? (
                <Badge tone="success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Conectado
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(c.name === "Local físico" ? "/productos" : "/mercado-libre")}
                >
                  Conectar
                </Button>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
