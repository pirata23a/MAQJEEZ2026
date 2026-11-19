import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Secreto JWT: usa la variable de entorno si existe; si no, genera uno fuerte
// y lo guarda en data/ (ignorado por git) para que sea estable entre reinicios.
function resolveSecret() {
  if (process.env.APPJEEZ_JWT_SECRET) return process.env.APPJEEZ_JWT_SECRET;
  const p = resolve(__dirname, "../data/jwt.secret");
  try {
    return readFileSync(p, "utf8").trim();
  } catch {
    const s = randomBytes(32).toString("hex");
    try {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, s);
    } catch {
      /* ignore */
    }
    return s;
  }
}

const SECRET = resolveSecret();
const EXPIRES = "7d";

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, companyId: user.company_id, role: user.role, name: user.name },
    SECRET,
    { expiresIn: EXPIRES },
  );
}

/** Express middleware: requires a valid Bearer token and populates req.user. */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autorizado" });
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = {
      id: payload.sub,
      companyId: payload.companyId,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}
