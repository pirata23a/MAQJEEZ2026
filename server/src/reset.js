import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Borra la base entera para recrearla desde cero (esquema + seed del catálogo).
const __dirname = dirname(fileURLToPath(import.meta.url));
const base = process.env.APPJEEZ_DB || resolve(__dirname, "../data/appjeez.db");
for (const f of [base, base + "-wal", base + "-shm"]) {
  try {
    rmSync(f, { force: true });
  } catch {
    /* ignore */
  }
}
console.log("Base reiniciada. Corré:  npm run seed");
