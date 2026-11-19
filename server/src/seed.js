import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { db, run, get } from "./db.js";
import { hashPassword } from "./auth.js";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

const OWNER_EMAIL = "infomaqjeez@gmail.com";
const OWNER_PASS = "123456";

const stockFor = (sku) => {
  const h = [...sku].reduce((a, c) => a + c.charCodeAt(0), 0);
  return 5 + (h % 41);
};

export async function seedMaqjeez() {
  const existing = await get("SELECT id FROM users WHERE email = ?", [OWNER_EMAIL]);
  if (existing) {
    return { seeded: false, email: OWNER_EMAIL };
  }

  const companyId = (
    await run("INSERT INTO companies (name, cuit) VALUES (?, ?)", ["MAQJEEZ", "30-71924833-5"])
  ).lastInsertRowid;

  await run(
    "INSERT INTO users (company_id, name, email, password_hash, role) VALUES (?,?,?,?,?)",
    [companyId, "MAQJEEZ", OWNER_EMAIL, hashPassword(OWNER_PASS), "owner"],
  );

  const catalog = JSON.parse(readFileSync(resolve(__dirname, "catalog.json"), "utf-8"));

  const stmts = catalog.map((p) => ({
    sql: `INSERT INTO products (company_id, sku, name, category, price, cost, stock, min_stock, alert_on, sold30, sold_total, since, channels, image)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      companyId,
      p.sku,
      p.name,
      p.category,
      Math.round(p.priceWholesale * 1.5),
      p.priceWholesale,
      stockFor(p.sku),
      3,
      1,
      0,
      0,
      "2026-08-01",
      JSON.stringify(["ml", "local"]),
      p.image || null,
    ],
  }));

  // cargar en lotes (Turso: evita miles de round-trips)
  const CHUNK = 250;
  for (let i = 0; i < stmts.length; i += CHUNK) {
    await db.batch(stmts.slice(i, i + CHUNK), "write");
  }

  await run("INSERT INTO suppliers (company_id, name, cuit, balance) VALUES (?,?,?,?)", [
    companyId,
    "Proveedor Mayorista",
    "30-00000000-0",
    0,
  ]);
  await run(
    `INSERT INTO ml_accounts (company_id, nickname, site, email, reputation, badge, is_default, active_listings, pending_questions, pending_messages, sales_today, health)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [companyId, "MAQJEEZ", "MLA", OWNER_EMAIL, "verde", "lider-platinum", 1, catalog.length, 0, 0, 0, "ok"],
  );

  return { seeded: true, count: catalog.length, email: OWNER_EMAIL };
}

// ejecutable por CLI: npm run seed
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("seed.js")) {
  const r = await seedMaqjeez();
  if (r.seeded) console.log(`Catálogo MAQJEEZ cargado: ${r.count} productos. Entrá con ${r.email} / ${OWNER_PASS}`);
  else console.log(`La cuenta ${r.email} ya existe.`);
  process.exit(0);
}
