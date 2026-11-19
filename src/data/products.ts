export type Channel = "ml" | "tn" | "local" | "woo";

export const channelMeta: Record<Channel, { label: string; short: string; color: string }> = {
  ml: { label: "Mercado Libre", short: "ML", color: "#ffe600" },
  tn: { label: "Tiendanube", short: "TN", color: "#2d5be3" },
  local: { label: "Local físico", short: "Local", color: "#0d945f" },
  woo: { label: "WooCommerce", short: "Woo", color: "#7b51ad" },
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number; // límite de aviso de compra
  alertOn: boolean; // alarma de quiebre activada
  sold30: number; // unidades vendidas en los últimos 30 días
  soldTotal: number; // unidades vendidas histórico (desde que se publicó)
  since: string; // fecha de primera venta / alta de la publicación (ISO)
  channels: Channel[];
  image?: string | null; // URL de la foto del producto
};

// Rubros reales del catálogo MAQJEEZ (Excel). El filtro de Productos igual
// deriva los rubros presentes; esta lista es el fallback del alta de productos.
export const categories = [
  "Motosierras",
  "Desmalezadoras",
  "Grupos Electrógenos",
  "Riego",
  "Cortadora De Césped",
  "Compresores",
  "Vibro Apisonador",
  "Tractores",
  "Hidrolavadora",
  "Motobombas",
  "Sopladoras",
  "Motor Estacionario",
  "Tanzas",
  "Cortacercos",
  "Hoyadora",
  "Soldadoras",
  "Tronzadoras",
  "Varios",
];

export const initialProducts: Product[] = [
  { id: "p1", sku: "MAQ-TAL-012", name: "Taladro percutor 650W", category: "Herramientas", price: 84900, cost: 52300, stock: 34, minStock: 10, alertOn: true, sold30: 42, soldTotal: 648, since: "2023-05-10", channels: ["ml", "tn", "local"] },
  { id: "p2", sku: "MAQ-AMO-220", name: "Amoladora angular 4.5\"", category: "Herramientas", price: 46500, cost: 28900, stock: 7, minStock: 8, alertOn: true, sold30: 18, soldTotal: 291, since: "2023-08-22", channels: ["ml", "local"] },
  { id: "p3", sku: "ELE-FUE-500", name: "Fuente switching 12V 5A", category: "Electrónica", price: 18700, cost: 9400, stock: 0, minStock: 6, alertOn: true, sold30: 9, soldTotal: 142, since: "2024-01-15", channels: ["ml", "tn", "woo"] },
  { id: "p4", sku: "ILU-LED-900", name: "Reflector LED 100W exterior", category: "Iluminación", price: 31200, cost: 17800, stock: 52, minStock: 12, alertOn: true, sold30: 88, soldTotal: 1890, since: "2022-11-03", channels: ["ml", "tn", "local", "woo"] },
  { id: "p5", sku: "ILU-LAM-045", name: "Lámpara colgante industrial", category: "Iluminación", price: 27400, cost: 14100, stock: 19, minStock: 10, alertOn: true, sold30: 12, soldTotal: 233, since: "2023-09-01", channels: ["tn", "local"] },
  { id: "p6", sku: "REP-COR-331", name: "Correa dentada HTD-5M", category: "Repuestos", price: 6900, cost: 2850, stock: 118, minStock: 30, alertOn: true, sold30: 140, soldTotal: 3420, since: "2022-06-18", channels: ["ml", "local"] },
  { id: "p7", sku: "REP-ROD-608", name: "Rodamiento 6082RS (x10)", category: "Repuestos", price: 12400, cost: 5600, stock: 4, minStock: 15, alertOn: true, sold30: 6, soldTotal: 88, since: "2024-02-10", channels: ["ml"] },
  { id: "p8", sku: "SEG-CAM-720", name: "Cámara IP WiFi 1080p", category: "Seguridad", price: 58900, cost: 33400, stock: 26, minStock: 8, alertOn: true, sold30: 26, soldTotal: 512, since: "2023-03-27", channels: ["ml", "tn", "woo"] },
  { id: "p9", sku: "SEG-CAN-004", name: "Candado blindado 50mm", category: "Seguridad", price: 9800, cost: 4200, stock: 73, minStock: 20, alertOn: true, sold30: 73, soldTotal: 1476, since: "2022-09-14", channels: ["ml", "local"] },
  { id: "p10", sku: "ELE-MUL-118", name: "Multímetro digital TRMS", category: "Electrónica", price: 36700, cost: 21900, stock: 12, minStock: 6, alertOn: true, sold30: 15, soldTotal: 307, since: "2023-07-05", channels: ["ml", "tn", "local"] },
  { id: "p11", sku: "ACC-GUA-077", name: "Guantes anticorte nivel 5", category: "Accesorios", price: 7400, cost: 3100, stock: 88, minStock: 25, alertOn: true, sold30: 210, soldTotal: 4985, since: "2022-04-02", channels: ["ml", "tn", "local", "woo"] },
  { id: "p12", sku: "ACC-CIN-250", name: "Cinta métrica 5m reforzada", category: "Accesorios", price: 4300, cost: 1650, stock: 2, minStock: 20, alertOn: false, sold30: 3, soldTotal: 41, since: "2024-05-20", channels: ["local"] },
];

export type ComboItem = { sku: string; qty: number };
export type Combo = {
  id: string;
  sku: string;
  name: string;
  items: ComboItem[];
  price: number;
  channels: Channel[];
};

// Los combos referencian productos por SKU (robusto ante re-seeds).
export const initialCombos: Combo[] = [
  {
    id: "k1",
    sku: "KIT-CARB-52",
    name: "Kit carburación desmalezadora 52cc",
    items: [
      { sku: "MJ-008", qty: 1 }, // Carburador 43-52cc
      { sku: "MJ-006", qty: 1 }, // Kit reparación carburador
      { sku: "MJ-010", qty: 1 }, // Diafragmas
    ],
    price: 139900,
    channels: ["ml", "local"],
  },
  {
    id: "k2",
    sku: "KIT-MOTOSIERRA-20",
    name: 'Combo corte motosierra 20"',
    items: [
      { sku: "MJ-015", qty: 1 }, // Set espada y cadena 20"
      { sku: "MJ-016", qty: 1 }, // Cadena 20"
      { sku: "MJ-019", qty: 1 }, // Volante magnético
    ],
    price: 239900,
    channels: ["ml", "tn", "local"],
  },
  {
    id: "k3",
    sku: "KIT-ARRANQUE",
    name: "Kit arranque + cabezal desmalezadora",
    items: [
      { sku: "MJ-022", qty: 1 }, // Tapa arranque moño
      { sku: "MJ-025", qty: 1 }, // Acelerador completo
      { sku: "MJ-011", qty: 1 }, // Cabezal carretel
    ],
    price: 99900,
    channels: ["ml", "local"],
  },
];
