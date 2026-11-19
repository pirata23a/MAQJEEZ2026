export type MLReputation = "verde" | "amarillo" | "rojo" | "sin-reputacion";

export type MLBadge = "lider" | "lider-gold" | "lider-platinum" | null;

export type MLAccount = {
  id: string;
  nickname: string;
  site: "MLA" | "MLU" | "MLC" | "MLM"; // Argentina, Uruguay, Chile, México
  email: string;
  reputation: MLReputation;
  badge: MLBadge;
  isDefault: boolean;
  activeListings: number;
  pendingQuestions: number;
  pendingMessages: number;
  salesToday: number;
  lastSync: string; // human
  health: "ok" | "token-expira" | "error";
};

export const siteMeta: Record<MLAccount["site"], { label: string; flag: string }> = {
  MLA: { label: "Argentina", flag: "🇦🇷" },
  MLU: { label: "Uruguay", flag: "🇺🇾" },
  MLC: { label: "Chile", flag: "🇨🇱" },
  MLM: { label: "México", flag: "🇲🇽" },
};

export const badgeMeta: Record<Exclude<MLBadge, null>, { label: string; color: string }> = {
  lider: { label: "MercadoLíder", color: "#1e9e4a" },
  "lider-gold": { label: "MercadoLíder Gold", color: "#caa300" },
  "lider-platinum": { label: "MercadoLíder Platinum", color: "#5c6b7a" },
};

export const initialMLAccounts: MLAccount[] = [
  {
    id: "ml1",
    nickname: "MAQJEEZ.INSUMOS",
    site: "MLA",
    email: "ventas@maqjeez.com",
    reputation: "verde",
    badge: "lider-platinum",
    isDefault: true,
    activeListings: 1284,
    pendingQuestions: 4,
    pendingMessages: 2,
    salesToday: 186400,
    lastSync: "hace 3 min",
    health: "ok",
  },
  {
    id: "ml2",
    nickname: "EPICTRONICA.OUTLET",
    site: "MLA",
    email: "outlet@epictronica.com",
    reputation: "verde",
    badge: "lider-gold",
    isDefault: false,
    activeListings: 742,
    pendingQuestions: 9,
    pendingMessages: 1,
    salesToday: 98250,
    lastSync: "hace 11 min",
    health: "token-expira",
  },
  {
    id: "ml3",
    nickname: "SUNSTORE.REPUESTOS",
    site: "MLA",
    email: "info@sunstore.com.ar",
    reputation: "amarillo",
    badge: "lider",
    isDefault: false,
    activeListings: 318,
    pendingQuestions: 2,
    pendingMessages: 0,
    salesToday: 41900,
    lastSync: "hace 1 h",
    health: "ok",
  },
];
