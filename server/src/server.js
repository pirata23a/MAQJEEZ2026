import express from "express";
import cors from "cors";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync } from "node:fs";
import { db, get, all, run } from "./db.js";
import { seedMaqjeez } from "./seed.js";
import { hashPassword, verifyPassword, signToken, authMiddleware } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, "../../dist");
const PUBLIC_DIR = resolve(__dirname, "../public");
const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" })); // fotos del taller van en base64
app.use("/media", express.static(PUBLIC_DIR));
app.use(express.static(DIST_DIR));

/* ----------------------- row mappers ----------------------- */
const mapProduct = (r) => ({
  id: String(r.id),
  sku: r.sku,
  name: r.name,
  category: r.category,
  price: r.price,
  cost: r.cost,
  stock: r.stock,
  minStock: r.min_stock,
  alertOn: !!r.alert_on,
  sold30: r.sold30,
  soldTotal: r.sold_total,
  since: r.since,
  channels: JSON.parse(r.channels || "[]"),
  image: r.image ? "/media/" + r.image : null,
});
const mapMovement = (r) => ({
  id: String(r.id),
  productId: String(r.product_id),
  delta: r.delta,
  reason: r.reason,
  note: r.note,
  resulting: r.resulting,
  by: r.by_user,
  at: r.at,
});
const mapSupplier = (r) => ({ id: String(r.id), name: r.name, cuit: r.cuit, balance: r.balance });
const mapEntry = (r) => ({
  id: String(r.id),
  kind: r.kind,
  concept: r.concept,
  amount: r.amount,
  method: r.method,
  supplierId: r.supplier_id ? String(r.supplier_id) : undefined,
  onAccount: !!r.on_account,
  at: r.at,
});
const mapMl = (r) => ({
  id: String(r.id),
  nickname: r.nickname,
  site: r.site,
  email: r.email,
  reputation: r.reputation,
  badge: r.badge,
  isDefault: !!r.is_default,
  activeListings: r.active_listings,
  pendingQuestions: r.pending_questions,
  pendingMessages: r.pending_messages,
  salesToday: r.sales_today,
  lastSync: r.last_sync,
  health: r.health,
});
async function mapSale(r) {
  const lines = (await all("SELECT * FROM sale_lines WHERE sale_id = ?", [r.id])).map((l) => ({
    productId: l.product_id != null ? String(l.product_id) : null,
    name: l.name,
    qty: l.qty,
    price: l.price,
  }));
  return {
    id: r.code,
    saleId: String(r.id),
    subtotal: r.subtotal,
    discount: r.discount,
    total: r.total,
    payment: r.payment,
    paidWith: r.paid_with,
    change: r.change,
    status: r.status || "activa",
    channel: r.code && r.code.startsWith("TAL-") ? "taller" : (r.channel || "local"),
    at: r.at,
    lines,
  };
}

/* ajuste de stock + movimiento; `exec` puede ser db o una transacción */
async function adjustStockOn(exec, companyId, productId, delta, reason, note, byUser) {
  const p = (
    await exec.execute({
      sql: "SELECT * FROM products WHERE id = ? AND company_id = ?",
      args: [productId, companyId],
    })
  ).rows[0];
  if (!p) return null;
  const resulting = Math.max(0, p.stock + delta);
  const real = resulting - p.stock;
  await exec.execute({ sql: "UPDATE products SET stock = ? WHERE id = ?", args: [resulting, p.id] });
  let movement = null;
  if (real !== 0) {
    const info = await exec.execute({
      sql: `INSERT INTO stock_movements (company_id, product_id, delta, reason, note, resulting, by_user)
            VALUES (?,?,?,?,?,?,?)`,
      args: [companyId, p.id, real, reason, note || "", resulting, byUser || ""],
    });
    movement = (
      await exec.execute({
        sql: "SELECT * FROM stock_movements WHERE id = ?",
        args: [Number(info.lastInsertRowid)],
      })
    ).rows[0];
  }
  const product = (
    await exec.execute({ sql: "SELECT * FROM products WHERE id = ?", args: [p.id] })
  ).rows[0];
  return { product, movement };
}

/* ----------------------- health ----------------------- */
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "appjeez-api" }));

/* ----------------------- auth ----------------------- */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { company, name, email, password } = req.body || {};
    if (!company || !name || !email || !password)
      return res.status(400).json({ error: "Faltan datos (empresa, nombre, email, contraseña)" });
    const exists = await get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (exists) return res.status(409).json({ error: "Ese email ya está registrado" });

    const companyId = (
      await run("INSERT INTO companies (name, cuit) VALUES (?, ?)", [company, req.body.cuit || ""])
    ).lastInsertRowid;
    const userId = (
      await run("INSERT INTO users (company_id, name, email, password_hash, role) VALUES (?,?,?,?,?)", [
        companyId,
        name,
        email.toLowerCase(),
        hashPassword(password),
        "owner",
      ])
    ).lastInsertRowid;
    const user = await get("SELECT * FROM users WHERE id = ?", [userId]);
    const companyRow = await get("SELECT * FROM companies WHERE id = ?", [companyId]);
    res.json({
      token: signToken(user),
      user: { id: String(user.id), name: user.name, email: user.email, role: user.role },
      company: { id: String(companyRow.id), name: companyRow.name, cuit: companyRow.cuit },
    });
  } catch {
    res.status(500).json({ error: "No se pudo registrar" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await get("SELECT * FROM users WHERE email = ?", [(email || "").toLowerCase()]);
    if (!user || !verifyPassword(password || "", user.password_hash))
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    const company = await get("SELECT * FROM companies WHERE id = ?", [user.company_id]);
    res.json({
      token: signToken(user),
      user: { id: String(user.id), name: user.name, email: user.email, role: user.role },
      company: { id: String(company.id), name: company.name, cuit: company.cuit },
    });
  } catch {
    res.status(500).json({ error: "No se pudo iniciar sesión" });
  }
});

/* protegido + scope por empresa */
app.use("/api", authMiddleware);
const cid = (req) => req.user.companyId;

app.get("/api/me", async (req, res) => {
  const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
  const company = await get("SELECT * FROM companies WHERE id = ?", [cid(req)]);
  res.json({
    user: { id: String(user.id), name: user.name, email: user.email, role: user.role },
    company: { id: String(company.id), name: company.name, cuit: company.cuit },
  });
});

app.post("/api/me/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6)
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
  const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (!verifyPassword(currentPassword || "", user.password_hash))
    return res.status(400).json({ error: "La contraseña actual es incorrecta" });
  await run("UPDATE users SET password_hash = ? WHERE id = ?", [hashPassword(newPassword), user.id]);
  res.json({ ok: true });
});

/* ----------------------- products ----------------------- */
app.get("/api/products", async (req, res) => {
  const rows = await all("SELECT * FROM products WHERE company_id = ? ORDER BY id DESC", [cid(req)]);
  res.json(rows.map(mapProduct));
});

app.post("/api/products", async (req, res) => {
  const b = req.body || {};
  const info = await run(
    `INSERT INTO products (company_id, sku, name, category, price, cost, stock, min_stock, alert_on, sold30, sold_total, since, channels, image)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      cid(req),
      b.sku || "",
      b.name || "",
      b.category || "",
      b.price || 0,
      b.cost || 0,
      b.stock || 0,
      b.minStock || 0,
      b.alertOn ? 1 : 0,
      b.sold30 || 0,
      b.soldTotal || 0,
      b.since || new Date().toISOString().slice(0, 10),
      JSON.stringify(b.channels || []),
      b.image || null,
    ],
  );
  res.json(mapProduct(await get("SELECT * FROM products WHERE id = ?", [info.lastInsertRowid])));
});

app.post("/api/products/bulk", async (req, res) => {
  const b = req.body || {};
  const ids = Array.isArray(b.ids) ? b.ids : [];
  if (ids.length === 0) return res.status(400).json({ error: "No hay productos seleccionados" });
  const applyPrice = (price) => {
    const p = b.price;
    if (!p) return price;
    const v = Number(p.value) || 0;
    switch (p.mode) {
      case "set": return Math.max(0, Math.round(v));
      case "incPct": return Math.max(0, Math.round(price * (1 + v / 100)));
      case "decPct": return Math.max(0, Math.round(price * (1 - v / 100)));
      case "incAmt": return Math.max(0, Math.round(price + v));
      case "decAmt": return Math.max(0, Math.round(price - v));
      default: return price;
    }
  };
  const tx = await db.transaction("write");
  try {
    for (const id of ids) {
      const p = (
        await tx.execute({ sql: "SELECT * FROM products WHERE id = ? AND company_id = ?", args: [id, cid(req)] })
      ).rows[0];
      if (!p) continue;
      await tx.execute({ sql: "UPDATE products SET price = ? WHERE id = ?", args: [applyPrice(p.price), p.id] });
      if (b.category) await tx.execute({ sql: "UPDATE products SET category = ? WHERE id = ?", args: [b.category, p.id] });
      if (b.minStock !== undefined) await tx.execute({ sql: "UPDATE products SET min_stock = ? WHERE id = ?", args: [Math.max(0, +b.minStock), p.id] });
      if (b.alertOn !== undefined) await tx.execute({ sql: "UPDATE products SET alert_on = ? WHERE id = ?", args: [b.alertOn ? 1 : 0, p.id] });
    }
    await tx.commit();
    const rows = await all("SELECT * FROM products WHERE company_id = ? ORDER BY id DESC", [cid(req)]);
    res.json(rows.map(mapProduct));
  } catch {
    await tx.rollback();
    res.status(500).json({ error: "No se pudo aplicar la edición masiva" });
  }
});

app.patch("/api/products/:id", async (req, res) => {
  const p = await get("SELECT * FROM products WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  if (!p) return res.status(404).json({ error: "Producto no encontrado" });
  const b = req.body || {};
  const map = {
    sku: "sku", name: "name", category: "category", price: "price", cost: "cost",
    stock: "stock", minStock: "min_stock", sold30: "sold30", soldTotal: "sold_total", since: "since",
  };
  for (const [k, col] of Object.entries(map)) {
    if (b[k] !== undefined) await run(`UPDATE products SET ${col} = ? WHERE id = ?`, [b[k], p.id]);
  }
  if (b.alertOn !== undefined) await run("UPDATE products SET alert_on = ? WHERE id = ?", [b.alertOn ? 1 : 0, p.id]);
  if (b.channels !== undefined) await run("UPDATE products SET channels = ? WHERE id = ?", [JSON.stringify(b.channels), p.id]);
  res.json(mapProduct(await get("SELECT * FROM products WHERE id = ?", [p.id])));
});

app.delete("/api/products/:id", async (req, res) => {
  await run("DELETE FROM products WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  res.json({ ok: true });
});

app.post("/api/products/:id/adjust", async (req, res) => {
  const { delta, reason, note } = req.body || {};
  const result = await adjustStockOn(db, cid(req), req.params.id, Number(delta) || 0, reason || "ajuste", note, req.user.name);
  if (!result) return res.status(404).json({ error: "Producto no encontrado" });
  res.json({ product: mapProduct(result.product), movement: result.movement ? mapMovement(result.movement) : null });
});

/* ----------------------- movements ----------------------- */
app.get("/api/movements", async (req, res) => {
  const rows = await all("SELECT * FROM stock_movements WHERE company_id = ? ORDER BY id DESC LIMIT 500", [cid(req)]);
  res.json(rows.map(mapMovement));
});

/* ----------------------- sales ----------------------- */
app.get("/api/sales", async (req, res) => {
  const rows = await all("SELECT * FROM sales WHERE company_id = ? ORDER BY id DESC", [cid(req)]);
  res.json(await Promise.all(rows.map(mapSale)));
});

app.post("/api/sales/:id/cancel", async (req, res) => {
  const sale = await get("SELECT * FROM sales WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  if (!sale) return res.status(404).json({ error: "Venta no encontrada" });
  if (sale.status === "anulada") return res.status(400).json({ error: "La venta ya está anulada" });
  const tx = await db.transaction("write");
  try {
    await tx.execute({ sql: "UPDATE sales SET status = 'anulada' WHERE id = ?", args: [sale.id] });
    const lines = (await tx.execute({ sql: "SELECT * FROM sale_lines WHERE sale_id = ?", args: [sale.id] })).rows;
    for (const l of lines) {
      if (l.product_id != null)
        await adjustStockOn(tx, cid(req), l.product_id, Math.abs(l.qty), "devolucion", `Anulación venta ${sale.code}`, req.user.name);
    }
    await tx.commit();
    res.json(await mapSale(await get("SELECT * FROM sales WHERE id = ?", [sale.id])));
  } catch {
    await tx.rollback();
    res.status(500).json({ error: "No se pudo anular la venta" });
  }
});

app.patch("/api/sales/:id", async (req, res) => {
  const sale = await get("SELECT * FROM sales WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  if (!sale) return res.status(404).json({ error: "Venta no encontrada" });
  if (sale.status === "anulada") return res.status(400).json({ error: "No se puede editar una venta anulada" });
  const b = req.body || {};
  const newLines = Array.isArray(b.lines) ? b.lines : [];
  if (newLines.length === 0) return res.status(400).json({ error: "La venta no puede quedar vacía" });
  const subtotal = newLines.reduce((a, l) => a + l.price * l.qty, 0);
  const discount = b.discount != null ? b.discount : sale.discount;
  const total = Math.max(0, subtotal - discount);
  const payment = b.payment || sale.payment;
  const paidWith = b.paidWith !== undefined ? b.paidWith : sale.paid_with;
  const change = paidWith != null ? Math.max(0, paidWith - total) : 0;

  const tx = await db.transaction("write");
  try {
    // 1) devolver al stock las líneas viejas (las que descontaban)
    const oldLines = (await tx.execute({ sql: "SELECT * FROM sale_lines WHERE sale_id = ?", args: [sale.id] })).rows;
    for (const l of oldLines)
      if (l.product_id != null)
        await adjustStockOn(tx, cid(req), l.product_id, Math.abs(l.qty), "ajuste-venta", `Edición venta ${sale.code}`, req.user.name);
    // 2) reemplazar líneas
    await tx.execute({ sql: "DELETE FROM sale_lines WHERE sale_id = ?", args: [sale.id] });
    for (const l of newLines) {
      await tx.execute({
        sql: "INSERT INTO sale_lines (sale_id, product_id, name, qty, price) VALUES (?,?,?,?,?)",
        args: [sale.id, l.productId || null, l.name, l.qty, l.price],
      });
      if (l.productId)
        await adjustStockOn(tx, cid(req), l.productId, -Math.abs(l.qty), "ajuste-venta", `Edición venta ${sale.code}`, req.user.name);
    }
    // 3) actualizar cabecera
    await tx.execute({
      sql: "UPDATE sales SET subtotal = ?, discount = ?, total = ?, payment = ?, paid_with = ?, change = ? WHERE id = ?",
      args: [subtotal, discount, total, payment, paidWith, change, sale.id],
    });
    await tx.commit();
    res.json(await mapSale(await get("SELECT * FROM sales WHERE id = ?", [sale.id])));
  } catch {
    await tx.rollback();
    res.status(500).json({ error: "No se pudo editar la venta" });
  }
});

app.post("/api/sales", async (req, res) => {
  const b = req.body || {};
  const lines = Array.isArray(b.lines) ? b.lines : [];
  if (lines.length === 0) return res.status(400).json({ error: "El ticket está vacío" });
  const subtotal = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const discount = b.discount || 0;
  const total = Math.max(0, subtotal - discount);
  const paidWith = b.paidWith ?? null;
  const change = paidWith != null ? Math.max(0, paidWith - total) : 0;

  const tx = await db.transaction("write");
  try {
    const channel = b.channel === "meli" ? "meli" : "local";
    const info = await tx.execute({
      sql: `INSERT INTO sales (company_id, code, subtotal, discount, total, payment, paid_with, change, channel)
            VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [cid(req), "TMP", subtotal, discount, total, b.payment || "efectivo", paidWith, change, channel],
    });
    const saleId = Number(info.lastInsertRowid);
    const code = `LOC-${1930 + saleId}`;
    await tx.execute({ sql: "UPDATE sales SET code = ? WHERE id = ?", args: [code, saleId] });
    for (const l of lines) {
      await tx.execute({
        sql: "INSERT INTO sale_lines (sale_id, product_id, name, qty, price) VALUES (?,?,?,?,?)",
        args: [saleId, l.productId || null, l.name, l.qty, l.price],
      });
      if (l.productId)
        await adjustStockOn(tx, cid(req), l.productId, -Math.abs(l.qty), "venta-mostrador", `Venta local ${code}`, req.user.name);
    }
    await tx.commit();
    res.json(await mapSale(await get("SELECT * FROM sales WHERE id = ?", [saleId])));
  } catch {
    await tx.rollback();
    res.status(500).json({ error: "No se pudo registrar la venta" });
  }
});

/* ----------------------- suppliers ----------------------- */
app.get("/api/suppliers", async (req, res) => {
  res.json((await all("SELECT * FROM suppliers WHERE company_id = ? ORDER BY id", [cid(req)])).map(mapSupplier));
});
app.post("/api/suppliers", async (req, res) => {
  const b = req.body || {};
  const info = await run("INSERT INTO suppliers (company_id, name, cuit, balance) VALUES (?,?,?,0)", [cid(req), b.name || "", b.cuit || ""]);
  res.json(mapSupplier(await get("SELECT * FROM suppliers WHERE id = ?", [info.lastInsertRowid])));
});

/* ----------------------- finance ----------------------- */
app.get("/api/finance/entries", async (req, res) => {
  res.json((await all("SELECT * FROM finance_entries WHERE company_id = ? ORDER BY id DESC", [cid(req)])).map(mapEntry));
});

app.post("/api/finance/purchase", async (req, res) => {
  const b = req.body || {};
  const lines = Array.isArray(b.lines) ? b.lines : [];
  const total = lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
  const supplier = await get("SELECT * FROM suppliers WHERE id = ? AND company_id = ?", [b.supplierId, cid(req)]);
  const onAccount = b.method === "cuenta-corriente";
  const tx = await db.transaction("write");
  try {
    for (const l of lines)
      await adjustStockOn(tx, cid(req), l.productId, Math.abs(l.qty), "reposicion", `Compra a ${supplier?.name || "proveedor"}`, req.user.name);
    if (onAccount && supplier)
      await tx.execute({ sql: "UPDATE suppliers SET balance = balance + ? WHERE id = ?", args: [total, supplier.id] });
    await tx.execute({
      sql: `INSERT INTO finance_entries (company_id, kind, concept, amount, method, supplier_id, on_account)
            VALUES (?,?,?,?,?,?,?)`,
      args: [cid(req), "compra", `Compra a ${supplier?.name || "proveedor"} · ${lines.length} ítems`, total, b.method, b.supplierId || null, onAccount ? 1 : 0],
    });
    await tx.commit();
    res.json({ ok: true });
  } catch {
    await tx.rollback();
    res.status(500).json({ error: "No se pudo registrar la compra" });
  }
});

app.post("/api/finance/expense", async (req, res) => {
  const b = req.body || {};
  const concept = [b.category, b.vendor, b.description].filter(Boolean).join(" · ");
  await run("INSERT INTO finance_entries (company_id, kind, concept, amount, method, on_account) VALUES (?,?,?,?,?,0)", [
    cid(req), "gasto", concept, b.amount || 0, b.method || "efectivo",
  ]);
  res.json({ ok: true });
});

app.post("/api/finance/supplier-payment", async (req, res) => {
  const b = req.body || {};
  const supplier = await get("SELECT * FROM suppliers WHERE id = ? AND company_id = ?", [b.supplierId, cid(req)]);
  if (!supplier) return res.status(404).json({ error: "Proveedor no encontrado" });
  const tx = await db.transaction("write");
  try {
    await tx.execute({ sql: "UPDATE suppliers SET balance = MAX(0, balance - ?) WHERE id = ?", args: [b.amount || 0, supplier.id] });
    await tx.execute({
      sql: "INSERT INTO finance_entries (company_id, kind, concept, amount, method, supplier_id, on_account) VALUES (?,?,?,?,?,?,0)",
      args: [cid(req), "pago-proveedor", `Pago a ${supplier.name}`, b.amount || 0, b.method || "transferencia", supplier.id],
    });
    await tx.commit();
    res.json({ ok: true });
  } catch {
    await tx.rollback();
    res.status(500).json({ error: "No se pudo registrar el pago" });
  }
});

/* ----------------------- taller / servicio técnico ----------------------- */
const mapRepair = (r) => ({
  id: String(r.id),
  code: r.code,
  clientName: r.client_name,
  clientPhone: r.client_phone,
  machineType: r.machine_type,
  brand: r.brand,
  model: r.model,
  fault: r.fault,
  status: r.status,
  budget: r.budget,
  paid: r.paid,
  notes: r.notes,
  photosIn: safeArr(r.photos_in),
  photosOut: safeArr(r.photos_out),
  photosBudget: safeArr(r.photos_budget),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  deliveredAt: r.delivered_at,
});
function safeArr(s) {
  try { return JSON.parse(s || "[]"); } catch { return []; }
}
// guarda un dataURL (base64) en /public/repairs y devuelve la ruta /media/...
function saveDataUrl(companyId, repairId, slot, dataUrl) {
  const m = /^data:(image\/\w+);base64,(.+)$/s.exec(dataUrl || "");
  if (!m) return null;
  const ext = m[1] === "image/png" ? "png" : m[1] === "image/webp" ? "webp" : "jpg";
  const dir = resolve(PUBLIC_DIR, "repairs", String(companyId), String(repairId));
  mkdirSync(dir, { recursive: true });
  const fname = `${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  writeFileSync(resolve(dir, fname), Buffer.from(m[2], "base64"));
  return `/media/repairs/${companyId}/${repairId}/${fname}`;
}

app.get("/api/repairs", async (req, res) => {
  res.json((await all("SELECT * FROM repairs WHERE company_id = ? ORDER BY id DESC", [cid(req)])).map(mapRepair));
});

app.post("/api/repairs", async (req, res) => {
  const b = req.body || {};
  const info = await run(
    `INSERT INTO repairs (company_id, code, client_name, client_phone, machine_type, brand, model, fault, status, budget, notes)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      cid(req), "TMP", b.clientName || "", b.clientPhone || "",
      b.machineType === "electrica" ? "electrica" : "explosion",
      b.brand || "", b.model || "", b.fault || "",
      b.status || "ingresado", Number(b.budget) || 0, b.notes || "",
    ],
  );
  const id = info.lastInsertRowid;
  const code = `OT-${1000 + id}`;
  await run("UPDATE repairs SET code = ? WHERE id = ?", [code, id]);
  // fotos de ingreso opcionales
  if (Array.isArray(b.photosIn) && b.photosIn.length) {
    const urls = b.photosIn.map((d) => saveDataUrl(cid(req), id, "in", d)).filter(Boolean);
    if (urls.length) await run("UPDATE repairs SET photos_in = ? WHERE id = ?", [JSON.stringify(urls), id]);
  }
  res.json(mapRepair(await get("SELECT * FROM repairs WHERE id = ?", [id])));
});

app.patch("/api/repairs/:id", async (req, res) => {
  const r = await get("SELECT * FROM repairs WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  if (!r) return res.status(404).json({ error: "Orden no encontrada" });
  const b = req.body || {};
  const fields = ["client_name", "client_phone", "machine_type", "brand", "model", "fault", "status", "budget", "notes"];
  const map = {
    client_name: b.clientName, client_phone: b.clientPhone, machine_type: b.machineType,
    brand: b.brand, model: b.model, fault: b.fault, status: b.status, budget: b.budget, notes: b.notes,
  };
  const sets = [], args = [];
  for (const f of fields) if (map[f] !== undefined) { sets.push(`${f} = ?`); args.push(map[f]); }
  sets.push("updated_at = datetime('now')");
  if (b.status === "entregado" && r.status !== "entregado") sets.push("delivered_at = datetime('now')");
  args.push(r.id);
  await run(`UPDATE repairs SET ${sets.join(", ")} WHERE id = ?`, args);
  res.json(mapRepair(await get("SELECT * FROM repairs WHERE id = ?", [r.id])));
});

app.post("/api/repairs/:id/photos", async (req, res) => {
  const r = await get("SELECT * FROM repairs WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  if (!r) return res.status(404).json({ error: "Orden no encontrada" });
  const b = req.body || {};
  const slot = b.slot === "out" ? "out" : b.slot === "budget" ? "budget" : "in";
  const col = slot === "out" ? "photos_out" : slot === "budget" ? "photos_budget" : "photos_in";
  const images = Array.isArray(b.images) ? b.images : [];
  const current = safeArr(r[col]);
  const nuevas = images.map((d) => saveDataUrl(cid(req), r.id, slot, d)).filter(Boolean);
  const todas = [...current, ...nuevas];
  await run(`UPDATE repairs SET ${col} = ?, updated_at = datetime('now') WHERE id = ?`, [JSON.stringify(todas), r.id]);
  res.json(mapRepair(await get("SELECT * FROM repairs WHERE id = ?", [r.id])));
});

app.post("/api/repairs/:id/photos/remove", async (req, res) => {
  const r = await get("SELECT * FROM repairs WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  if (!r) return res.status(404).json({ error: "Orden no encontrada" });
  const b = req.body || {};
  const col = b.slot === "out" ? "photos_out" : b.slot === "budget" ? "photos_budget" : "photos_in";
  const restantes = safeArr(r[col]).filter((u) => u !== b.url);
  await run(`UPDATE repairs SET ${col} = ?, updated_at = datetime('now') WHERE id = ?`, [JSON.stringify(restantes), r.id]);
  res.json(mapRepair(await get("SELECT * FROM repairs WHERE id = ?", [r.id])));
});

app.post("/api/repairs/:id/charge", async (req, res) => {
  const r = await get("SELECT * FROM repairs WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  if (!r) return res.status(404).json({ error: "Orden no encontrada" });
  const amount = Math.max(0, Number(req.body?.amount) || 0);
  const method = req.body?.method || "efectivo";
  if (amount <= 0) return res.status(400).json({ error: "Importe inválido" });
  const maquina = [r.brand, r.model].filter(Boolean).join(" ") || "máquina";
  const tx = await db.transaction("write");
  try {
    await tx.execute({ sql: "UPDATE repairs SET paid = paid + ?, updated_at = datetime('now') WHERE id = ?", args: [amount, r.id] });
    // El cobro de la reparación se registra como VENTA: suma a la venta diaria y a Finanzas.
    const info = await tx.execute({
      sql: `INSERT INTO sales (company_id, code, subtotal, discount, total, payment, paid_with, change, status, channel)
            VALUES (?,?,?,?,?,?,?,?,'activa','taller')`,
      args: [cid(req), "TMP", amount, 0, amount, method, null, 0],
    });
    const saleId = Number(info.lastInsertRowid);
    const code = `TAL-${1930 + saleId}`;
    await tx.execute({ sql: "UPDATE sales SET code = ? WHERE id = ?", args: [code, saleId] });
    await tx.execute({
      sql: "INSERT INTO sale_lines (sale_id, product_id, name, qty, price) VALUES (?,?,?,?,?)",
      args: [saleId, null, `Taller ${r.code} · ${maquina}${r.client_name ? " · " + r.client_name : ""}`, 1, amount],
    });
    await tx.commit();
    res.json(mapRepair(await get("SELECT * FROM repairs WHERE id = ?", [r.id])));
  } catch {
    await tx.rollback();
    res.status(500).json({ error: "No se pudo registrar el cobro" });
  }
});

app.delete("/api/repairs/:id", async (req, res) => {
  await run("DELETE FROM repairs WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  res.json({ ok: true });
});

/* ----------------------- mercado libre ----------------------- */
app.get("/api/ml", async (req, res) => {
  res.json((await all("SELECT * FROM ml_accounts WHERE company_id = ? ORDER BY id", [cid(req)])).map(mapMl));
});
app.post("/api/ml", async (req, res) => {
  const b = req.body || {};
  const count = (await get("SELECT COUNT(*) n FROM ml_accounts WHERE company_id = ?", [cid(req)])).n;
  const info = await run(
    "INSERT INTO ml_accounts (company_id, nickname, site, email, is_default) VALUES (?,?,?,?,?)",
    [cid(req), (b.nickname || "").toUpperCase(), b.site || "MLA", b.email || "", count === 0 ? 1 : 0],
  );
  res.json(mapMl(await get("SELECT * FROM ml_accounts WHERE id = ?", [info.lastInsertRowid])));
});
app.patch("/api/ml/:id", async (req, res) => {
  const acc = await get("SELECT * FROM ml_accounts WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  if (!acc) return res.status(404).json({ error: "Cuenta no encontrada" });
  if (req.body.makeDefault) {
    await run("UPDATE ml_accounts SET is_default = 0 WHERE company_id = ?", [cid(req)]);
    await run("UPDATE ml_accounts SET is_default = 1 WHERE id = ?", [acc.id]);
  }
  if (req.body.sync) await run("UPDATE ml_accounts SET last_sync = 'recién', health = 'ok' WHERE id = ?", [acc.id]);
  res.json(mapMl(await get("SELECT * FROM ml_accounts WHERE id = ?", [acc.id])));
});
app.delete("/api/ml/:id", async (req, res) => {
  await run("DELETE FROM ml_accounts WHERE id = ? AND company_id = ?", [req.params.id, cid(req)]);
  const rest = await all("SELECT * FROM ml_accounts WHERE company_id = ? ORDER BY id", [cid(req)]);
  if (rest.length && !rest.some((a) => a.is_default))
    await run("UPDATE ml_accounts SET is_default = 1 WHERE id = ?", [rest[0].id]);
  res.json({ ok: true });
});

/* ----------------------- dashboard ----------------------- */
app.get("/api/dashboard", async (req, res) => {
  const c = cid(req);
  const one = async (sql, ...p) => await get(sql, [c, ...p]);

  const sinStock = (await one("SELECT COUNT(*) n FROM products WHERE company_id = ? AND stock <= 0")).n;
  const stockBajo = (await one("SELECT COUNT(*) n FROM products WHERE company_id = ? AND stock > 0 AND stock <= min_stock")).n;
  const ventasHoy = (await one("SELECT COALESCE(SUM(total),0) s FROM sales WHERE company_id = ? AND status='activa' AND date(at) = date('now')")).s;
  const ticketsHoy = (await one("SELECT COUNT(*) n FROM sales WHERE company_id = ? AND status='activa' AND date(at) = date('now')")).n;
  const ticketProm = (await one("SELECT COALESCE(AVG(total),0) a FROM sales WHERE company_id = ? AND status='activa'")).a;
  const preguntasML = (await one("SELECT COALESCE(SUM(pending_questions),0) s FROM ml_accounts WHERE company_id = ?")).s;
  const periodTotal = (await one("SELECT COALESCE(SUM(total),0) s FROM sales WHERE company_id = ? AND status='activa' AND at >= date('now','-13 days')")).s;

  const rows = await all(
    "SELECT date(at) d, SUM(total) t FROM sales WHERE company_id = ? AND status='activa' AND at >= date('now','-13 days') GROUP BY date(at)",
    [c],
  );
  const byDay = new Map(rows.map((r) => [r.d, r.t]));
  const series = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, total: byDay.get(key) || 0 });
  }

  const byMethod = await all(
    "SELECT payment, COALESCE(SUM(total),0) total, COUNT(*) n FROM sales WHERE company_id = ? AND status='activa' GROUP BY payment ORDER BY total DESC",
    [c],
  );

  const recentRows = await all("SELECT * FROM sales WHERE company_id = ? AND status='activa' ORDER BY id DESC LIMIT 6", [c]);
  const recent = await Promise.all(
    recentRows.map(async (s) => ({
      id: s.code,
      total: s.total,
      payment: s.payment,
      at: s.at,
      items: (await get("SELECT COUNT(*) n FROM sale_lines WHERE sale_id = ?", [s.id])).n,
    })),
  );

  res.json({
    kpis: { ventasHoy, ticketsHoy, ticketProm: Math.round(ticketProm), sinStock, stockBajo },
    series,
    periodTotal,
    byMethod,
    recent,
    pending: { preguntasML, quiebre: sinStock, stockBajo },
  });
});

/* SPA fallback */
app.get("*", (req, res) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/media"))
    return res.status(404).json({ error: "No encontrado" });
  res.sendFile(resolve(DIST_DIR, "index.html"));
});

const PORT = process.env.PORT || 4000;
// seed automático si la base está vacía (primer arranque / Turso nuevo)
try {
  const r = await seedMaqjeez();
  if (r.seeded) console.log(`Seed inicial: ${r.count} productos cargados.`);
} catch (e) {
  console.error("Seed inicial falló:", e.message);
}
app.listen(PORT, () => console.log(`AppJeez escuchando en http://127.0.0.1:${PORT}`));
