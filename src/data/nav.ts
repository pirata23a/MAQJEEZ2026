import {
  Home,
  LayoutDashboard,
  BarChart3,
  Wallet,
  Store,
  Rocket,
  Package,
  ShoppingCart,
  Share2,
  Building2,
  ClipboardList,
  Settings,
  Gift,
  CreditCard,
  ShoppingBag,
  Boxes,
  Layers,
  History,
  BellRing,
  Landmark,
  Factory,
  LineChart,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "canales" | "negocio" | "cuenta";
  badge?: number;
};

export const nav: NavItem[] = [
  { to: "/", label: "Inicio", icon: Home, group: "main" },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { to: "/metricas", label: "Métricas", icon: BarChart3, group: "main" },

  { to: "/mercado-libre", label: "Mercado Libre", icon: ShoppingBag, group: "canales", badge: 4 },
  { to: "/mercado-pago", label: "Mercado Pago", icon: Wallet, group: "canales" },
  { to: "/tiendanube", label: "Tiendanube", icon: Store, group: "canales" },
  { to: "/tienda-negocio", label: "Tienda Negocio", icon: Rocket, group: "canales" },
  { to: "/empretienda", label: "Empretienda", icon: Package, group: "canales" },
  { to: "/woocommerce", label: "WooCommerce", icon: ShoppingCart, group: "canales" },
  { to: "/canales-externos", label: "Canales externos", icon: Share2, group: "canales" },
  { to: "/local-fisico", label: "Local físico", icon: Building2, group: "canales" },

  { to: "/ventas", label: "Ventas", icon: ReceiptText, group: "negocio" },
  { to: "/productos", label: "Productos", icon: Boxes, group: "negocio" },
  { to: "/combos", label: "Combos y packs", icon: Layers, group: "negocio" },
  { to: "/movimientos", label: "Movimientos de stock", icon: History, group: "negocio" },
  { to: "/alertas", label: "Alertas de stock", icon: BellRing, group: "negocio" },
  { to: "/historico", label: "Histórico por publicación", icon: LineChart, group: "negocio" },
  { to: "/finanzas", label: "Finanzas · Caja", icon: Landmark, group: "negocio" },
  { to: "/proveedores", label: "Proveedores", icon: Factory, group: "negocio" },
  { to: "/gestion", label: "Gestión", icon: ClipboardList, group: "negocio" },

  { to: "/configuracion", label: "Configuración", icon: Settings, group: "cuenta" },
  { to: "/referidos", label: "Referidos", icon: Gift, group: "cuenta" },
  { to: "/suscripcion", label: "Suscripción", icon: CreditCard, group: "cuenta" },
];

export const groupLabels: Record<NavItem["group"], string> = {
  main: "General",
  canales: "Canales de venta",
  negocio: "Operación",
  cuenta: "Cuenta",
};
