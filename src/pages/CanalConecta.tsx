import { Check, Plug, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/toast-context";

type Meta = { name: string; tagline: string; color: string; bullets: string[] };

export const canalMeta: Record<string, Meta> = {
  "mercado-pago": {
    name: "Mercado Pago",
    color: "#009ee3",
    tagline: "Conciliá tus cobros y conocé la plata que entra por cada venta.",
    bullets: ["Cobros sincronizados", "Comisiones y neto por venta", "Conciliación con tu caja"],
  },
  tiendanube: {
    name: "Tiendanube",
    color: "#2d5be3",
    tagline: "Sincronizá tu tienda online: stock, precios y ventas en un solo lugar.",
    bullets: ["Stock y precios centralizados", "Importar publicaciones", "Ventas unificadas"],
  },
  "tienda-negocio": {
    name: "Tienda Negocio",
    color: "#8b5cf6",
    tagline: "Tu tienda propia de AppJeez para vender online con tu catálogo.",
    bullets: ["Catálogo online", "Link para compartir", "Pedidos al panel"],
  },
  empretienda: {
    name: "Empretienda",
    color: "#ec4899",
    tagline: "Conectá tu Empretienda y manejá todo desde AppJeez.",
    bullets: ["Stock sincronizado", "Ventas al panel", "Facturación unificada"],
  },
  woocommerce: {
    name: "WooCommerce",
    color: "#7b51ad",
    tagline: "Integrá tu WooCommerce y centralizá catálogo y pedidos.",
    bullets: ["Productos y stock", "Pedidos sincronizados", "Precios centralizados"],
  },
  "canales-externos": {
    name: "Canales externos",
    color: "#0d945f",
    tagline: "Sumá otros marketplaces y canales de venta a tu operación.",
    bullets: ["Más marketplaces", "Stock unificado", "Un solo panel"],
  },
};

export function CanalConecta({ slug }: { slug: string }) {
  const toast = useToast();
  const m = canalMeta[slug];
  if (!m) return null;

  return (
    <div className="animate-fade-up">
      <PageHeader title={m.name} subtitle={m.tagline} />

      <Card className="mx-auto max-w-2xl overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: m.color }} />
        <CardBody className="p-7">
          <div className="flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl text-white"
              style={{ background: m.color }}
            >
              <Plug className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-fg">Conectar {m.name}</h2>
              <p className="text-[13px] text-muted">Vinculá tu cuenta para sincronizar automáticamente.</p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5">
            {m.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-fg/85">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-success/12 text-success">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1"
              onClick={() => toast(`Te vamos a guiar para conectar ${m.name}. La integración se habilita pronto.`, "info")}
            >
              <Plug className="h-4 w-4" />
              Conectar {m.name}
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => toast("Abrimos la guía de ayuda.", "info")}>
              Cómo funciona
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <p className="mt-4 rounded-lg border border-border bg-bg px-3 py-2 text-[12.5px] text-muted">
            La conexión por OAuth con {m.name} se activa en la etapa de integraciones. Mientras tanto,
            cargás y gestionás todo desde tu catálogo central.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
