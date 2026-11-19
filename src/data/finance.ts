export type Supplier = {
  id: string;
  name: string;
  cuit: string;
  balance: number; // saldo adeudado (cuenta corriente)
};

export const initialSuppliers: Supplier[] = [
  { id: "s1", name: "Distribuidora Hergo S.A.", cuit: "30-70912345-6", balance: 184500 },
  { id: "s2", name: "Importadora Luxelec", cuit: "30-71455210-9", balance: 0 },
  { id: "s3", name: "Repuestos del Sur SRL", cuit: "30-69881234-2", balance: 62300 },
];

export type PayMethod = "efectivo" | "transferencia" | "debito" | "credito" | "cuenta-corriente";

export const payMethods: { id: PayMethod; label: string }[] = [
  { id: "efectivo", label: "Efectivo" },
  { id: "transferencia", label: "Transferencia" },
  { id: "debito", label: "Débito" },
  { id: "credito", label: "Crédito" },
  { id: "cuenta-corriente", label: "Cuenta corriente" },
];

export const expenseCategories = [
  "Mercadería / reventa",
  "Almacén",
  "Verdulería / fruta",
  "Carnicería / fiambrería",
  "Panadería",
  "Bebidas",
  "Insumos / packaging",
  "Limpieza",
  "Librería / oficina",
  "Alquiler",
  "Servicios (luz, agua, gas)",
  "Internet / telefonía",
  "Sueldos",
  "Impuestos y tasas",
  "Logística / envíos",
  "Combustible / transporte",
  "Marketing",
  "Mantenimiento / reparaciones",
  "Otros",
];

export type EntryKind = "venta" | "compra" | "gasto" | "pago-proveedor" | "cobro-taller";

export const entryMeta: Record<EntryKind, { label: string; dir: "in" | "out"; tone: string }> = {
  venta: { label: "Venta", dir: "in", tone: "success" },
  "cobro-taller": { label: "Taller", dir: "in", tone: "success" },
  compra: { label: "Compra", dir: "out", tone: "warning" },
  gasto: { label: "Gasto", dir: "out", tone: "danger" },
  "pago-proveedor": { label: "Pago a proveedor", dir: "out", tone: "brand" },
};
