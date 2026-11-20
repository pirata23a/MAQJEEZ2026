import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

// En producción (Render) se usa Turso vía variables de entorno.
// En local, una base SQLite en archivo (data/appjeez.db).
const localPath = resolve(__dirname, "../data/appjeez.db").replace(/\\/g, "/");
const url = process.env.TURSO_DATABASE_URL || `file:${localPath}`;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (url.startsWith("file:")) mkdirSync(resolve(__dirname, "../data"), { recursive: true });

export const db = createClient(
  authToken ? { url, authToken, intMode: "number" } : { url, intMode: "number" },
);

const SCHEMA = `
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cuit TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  alert_on INTEGER NOT NULL DEFAULT 1,
  sold30 INTEGER NOT NULL DEFAULT 0,
  sold_total INTEGER NOT NULL DEFAULT 0,
  since TEXT DEFAULT (date('now')),
  channels TEXT NOT NULL DEFAULT '[]',
  image TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  note TEXT DEFAULT '',
  resulting INTEGER NOT NULL,
  by_user TEXT DEFAULT '',
  at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_mov_company ON stock_movements(company_id);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment TEXT NOT NULL,
  paid_with INTEGER,
  change INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'activa',
  channel TEXT NOT NULL DEFAULT 'local',
  at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_sales_company ON sales(company_id);
CREATE TABLE IF NOT EXISTS sale_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cuit TEXT DEFAULT '',
  balance INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE TABLE IF NOT EXISTS finance_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  concept TEXT NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,
  supplier_id INTEGER,
  on_account INTEGER NOT NULL DEFAULT 0,
  at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fin_company ON finance_entries(company_id);
CREATE TABLE IF NOT EXISTS ml_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  site TEXT NOT NULL DEFAULT 'MLA',
  email TEXT DEFAULT '',
  reputation TEXT DEFAULT 'sin-reputacion',
  badge TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  active_listings INTEGER NOT NULL DEFAULT 0,
  pending_questions INTEGER NOT NULL DEFAULT 0,
  pending_messages INTEGER NOT NULL DEFAULT 0,
  sales_today INTEGER NOT NULL DEFAULT 0,
  last_sync TEXT DEFAULT 'recién',
  health TEXT NOT NULL DEFAULT 'ok'
);
CREATE INDEX IF NOT EXISTS idx_ml_company ON ml_accounts(company_id);
CREATE TABLE IF NOT EXISTS repairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_phone TEXT DEFAULT '',
  machine_type TEXT NOT NULL DEFAULT 'explosion',
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  fault TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ingresado',
  budget INTEGER NOT NULL DEFAULT 0,
  paid INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  photos_in TEXT NOT NULL DEFAULT '[]',
  photos_out TEXT NOT NULL DEFAULT '[]',
  photos_budget TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  delivered_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_repairs_company ON repairs(company_id);
`;

await db.executeMultiple(SCHEMA);

// --- migraciones suaves (tablas ya existentes) ---
for (const alter of [
  "ALTER TABLE repairs ADD COLUMN photos_budget TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE sales ADD COLUMN channel TEXT NOT NULL DEFAULT 'local'",
]) {
  try { await db.execute(alter); } catch { /* la columna ya existe */ }
}

// --- async query helpers ---
export async function get(sql, args = []) {
  const r = await db.execute({ sql, args });
  return r.rows[0];
}
export async function all(sql, args = []) {
  const r = await db.execute({ sql, args });
  return r.rows;
}
export async function run(sql, args = []) {
  const r = await db.execute({ sql, args });
  return {
    lastInsertRowid: r.lastInsertRowid != null ? Number(r.lastInsertRowid) : undefined,
    rowsAffected: r.rowsAffected,
  };
}
