import { db } from "./db.js";

// Populate ~14 days of historical POS sales for the demo company so the
// dashboard charts show real data. Does NOT touch stock (historical).
const user = db.prepare("SELECT * FROM users WHERE email = ?").get("demo@appjeez.com");
if (!user) {
  console.log("No existe la empresa demo. Corré primero: npm run seed");
  process.exit(0);
}
const companyId = user.company_id;

const already = db.prepare("SELECT COUNT(*) n FROM sales WHERE company_id = ?").get(companyId).n;
if (already > 3) {
  console.log(`La demo ya tiene ${already} ventas. No agrego históricas.`);
  process.exit(0);
}

const products = db.prepare("SELECT * FROM products WHERE company_id = ?").all(companyId);
const methods = ["efectivo", "debito", "credito", "mercadopago", "transferencia"];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const pad = (n) => String(n).padStart(2, "0");
const insSale = db.prepare(
  `INSERT INTO sales (company_id, code, subtotal, discount, total, payment, paid_with, change, at)
   VALUES (?,?,?,?,?,?,?,?,?)`,
);
const insLine = db.prepare(
  "INSERT INTO sale_lines (sale_id, product_id, name, qty, price) VALUES (?,?,?,?,?)",
);

let count = 0;
for (let day = 13; day >= 0; day--) {
  const d = new Date();
  d.setDate(d.getDate() - day);
  const nSales = rnd(2, 6);
  for (let s = 0; s < nSales; s++) {
    const nLines = rnd(1, 3);
    const lines = [];
    let subtotal = 0;
    for (let l = 0; l < nLines; l++) {
      const p = pick(products);
      const qty = rnd(1, 3);
      lines.push({ p, qty });
      subtotal += p.price * qty;
    }
    const discount = Math.random() < 0.2 ? rnd(1, 10) * 500 : 0;
    const total = Math.max(0, subtotal - discount);
    const at = `${d.toISOString().slice(0, 10)} ${pad(rnd(9, 20))}:${pad(rnd(0, 59))}:00`;
    const info = insSale.run(companyId, "TMP", subtotal, discount, total, pick(methods), null, 0, at);
    db.prepare("UPDATE sales SET code = ? WHERE id = ?").run(`LOC-${1930 + Number(info.lastInsertRowid)}`, info.lastInsertRowid);
    for (const { p, qty } of lines) insLine.run(info.lastInsertRowid, p.id, p.name, qty, p.price);
    count++;
  }
}
console.log(`Listo. Agregué ${count} ventas históricas para el dashboard de la demo.`);
