export const currentUser = {
  name: "Maximiliano Jeez",
  handle: "MAQJEEZ_I",
  email: "info@appjeez.com",
  initials: "MJ",
};

export type Company = { id: string; name: string; cuit: string; role: string };

export const companies: Company[] = [
  { id: "c1", name: "Maqjeez Insumos", cuit: "30-71924833-5", role: "Dueño" },
  { id: "c2", name: "Epictrónica Store", cuit: "27-38120945-1", role: "Admin" },
  { id: "c3", name: "Sunstore Repuestos", cuit: "30-71655102-8", role: "Operador" },
];

export const kpis = [
  { id: "ventas", label: "Ventas hoy", value: 486230, prefix: "money", delta: 12.4, hint: "vs ayer" },
  { id: "comprobantes", label: "Comprobantes emitidos", value: 318, prefix: "num", delta: 4.1, hint: "este mes" },
  { id: "ticket", label: "Ticket promedio", value: 15290, prefix: "money", delta: -2.3, hint: "vs ayer" },
  { id: "stock", label: "Productos sin stock", value: 23, prefix: "num", delta: -5.0, hint: "requieren reposición", invertDelta: true },
] as const;

// last 14 days sales, mixed organic numbers
export const salesSeries = [
  312000, 288400, 341200, 298700, 402100, 455900, 389300, 421800, 367400, 498200,
  512600, 447100, 486230, 503900,
];

export const channelBreakdown = [
  { channel: "Mercado Libre", value: 2841200, color: "brand", share: 0.52 },
  { channel: "Local físico", value: 1320400, color: "success", share: 0.24 },
  { channel: "Tiendanube", value: 788600, color: "warning", share: 0.14 },
  { channel: "WooCommerce", value: 546300, color: "muted", share: 0.1 },
];

export const recentOrders = [
  { id: "ML-88241", channel: "Mercado Libre", customer: "Rodrigo Paniagua", total: 48900, status: "Pagado", time: "hace 6 min" },
  { id: "LOC-01932", channel: "Local físico", customer: "Mostrador", total: 12340, status: "Facturado", time: "hace 21 min" },
  { id: "TN-45120", channel: "Tiendanube", customer: "Carla Benítez", total: 97200, status: "Pendiente", time: "hace 48 min" },
  { id: "ML-88237", channel: "Mercado Libre", customer: "Luciano Ferreyra", total: 31500, status: "Pagado", time: "hace 1 h" },
  { id: "WC-10044", channel: "WooCommerce", customer: "Sofía Aguirre", total: 158900, status: "Facturado", time: "hace 2 h" },
  { id: "LOC-01931", channel: "Local físico", customer: "Mostrador", total: 8700, status: "Facturado", time: "hace 3 h" },
];

export const openTasks = [
  { label: "Preguntas de Mercado Libre sin responder", count: 4, tone: "brand" },
  { label: "Ventas sin facturar", count: 7, tone: "warning" },
  { label: "Publicaciones pausadas por falta de stock", count: 3, tone: "danger" },
];

export type Plan = {
  id: string;
  name: string;
  monthly: number;
  highlight?: boolean;
  limits: { ventas: number; comprobantes: number; publicaciones: number };
  perks: string[];
};

export const plans: Plan[] = [
  {
    id: "standard",
    name: "Standard",
    monthly: 87200,
    limits: { ventas: 500, comprobantes: 500, publicaciones: 15000 },
    perks: ["Facturación automática", "Stock centralizado", "1 usuario"],
  },
  {
    id: "premium",
    name: "Premium",
    monthly: 136800,
    highlight: true,
    limits: { ventas: 2500, comprobantes: 2500, publicaciones: 15000 },
    perks: ["Todo lo de Standard", "Respuestas con IA en ML", "Facturación masiva", "5 usuarios"],
  },
  {
    id: "corporate",
    name: "Corporate",
    monthly: 196000,
    limits: { ventas: 10000, comprobantes: 10000, publicaciones: 100000 },
    perks: ["Todo lo de Premium", "Reportes avanzados", "Usuarios ilimitados", "Soporte prioritario"],
  },
];
