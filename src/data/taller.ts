export type MachineType = "electrica" | "explosion";

export type RepairStatus =
  | "ingresado"
  | "presupuestado"
  | "aceptado"
  | "esperando-repuesto"
  | "en-reparacion"
  | "reparado"
  | "informado"
  | "entregado"
  | "rechazado";

export type Repair = {
  id: string;
  code: string;
  clientName: string;
  clientPhone: string;
  machineType: MachineType;
  brand: string;
  model: string;
  fault: string;
  status: RepairStatus;
  budget: number;
  paid: number;
  notes: string;
  photosIn: string[];
  photosOut: string[];
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
};

export type Tone = "neutral" | "brand" | "warning" | "success" | "danger";

export const machineTypes: { id: MachineType; label: string; hint: string }[] = [
  { id: "explosion", label: "A explosión", hint: "Nafta / combustión (desmalezadora, motosierra, grupo electrógeno…)" },
  { id: "electrica", label: "Eléctrica", hint: "A corriente o batería" },
];

export const repairStatuses: { id: RepairStatus; label: string; tone: Tone; short: string }[] = [
  { id: "ingresado", label: "Ingresado", tone: "neutral", short: "Ingresó" },
  { id: "presupuestado", label: "Presupuestado", tone: "warning", short: "Presup." },
  { id: "aceptado", label: "Presupuesto aceptado", tone: "brand", short: "Aceptado" },
  { id: "esperando-repuesto", label: "Esperando repuesto", tone: "warning", short: "Repuesto" },
  { id: "en-reparacion", label: "En reparación", tone: "brand", short: "Reparando" },
  { id: "reparado", label: "Reparado / listo", tone: "success", short: "Listo" },
  { id: "informado", label: "Informado al cliente", tone: "success", short: "Informado" },
  { id: "entregado", label: "Entregado", tone: "neutral", short: "Entregado" },
  { id: "rechazado", label: "Rechazado", tone: "danger", short: "Rechazado" },
];

export const statusMeta = (id: RepairStatus) =>
  repairStatuses.find((s) => s.id === id) ?? repairStatuses[0];

export type PayState = "sin-presupuesto" | "pendiente" | "parcial" | "pagado";

export function payState(r: { budget: number; paid: number }): { id: PayState; label: string; tone: Tone } {
  if (r.budget <= 0) return { id: "sin-presupuesto", label: "Sin presupuesto", tone: "neutral" };
  if (r.paid >= r.budget) return { id: "pagado", label: "Pagado", tone: "success" };
  if (r.paid > 0) return { id: "parcial", label: "Pago parcial", tone: "warning" };
  return { id: "pendiente", label: "Pendiente de pago", tone: "danger" };
}

// Comprime y achica una imagen (File) a un dataURL JPEG liviano para subir.
export function fileToCompressedDataUrl(file: File, maxSide = 1280, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("no image")); };
    img.src = url;
  });
}
