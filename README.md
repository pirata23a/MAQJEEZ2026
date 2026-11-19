# AppJeez — MAQJEEZ

Gestión de comercio: catálogo, stock, ventas (POS), finanzas, Mercado Libre y más.
Frontend React + Vite, backend Node/Express, base de datos **Turso (libSQL)**.

## Correr local

```bash
# frontend (dev)
npm install
npm run dev            # http://localhost:5173

# backend
cd server
npm install
npm start              # http://localhost:4000  (sirve también la app compilada)
```

Sin variables de entorno, el backend usa una base local en `server/data/appjeez.db`
y carga el catálogo automáticamente. Login demo: `infomaqjeez@gmail.com` / `123456`.

## Deploy en Render (gratis) + Turso

1. **Turso** (base de datos gratis, sin tarjeta): crear una base y copiar su
   **Database URL** (`libsql://...`) y un **Auth Token**.
2. **Render**: nuevo *Blueprint* apuntando a este repo (toma `render.yaml`).
   - Cargar las variables `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.
   - `APPJEEZ_JWT_SECRET` se genera solo.
3. Render construye el front, arranca el server y queda en `https://maqjeez.onrender.com`.
   En el primer arranque, el backend crea las tablas y carga el catálogo.

El servidor único sirve la app, la API (`/api`) y las imágenes (`/media`).
