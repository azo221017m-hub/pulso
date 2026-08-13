# Desplegar PULSO en servicios permanentes (sin Docker, sin Expo Go)

Esto reemplaza el flujo local (`docker compose` + `localtunnel` + Expo Go) por tres servicios
permanentes y gratuitos. Los pasos marcados con 👤 requieren que tú los hagas (crear cuentas,
autenticarte) — yo no puedo crear cuentas de terceros en tu nombre.

---

## 1. Base de datos — Neon (Postgres gestionado)

👤 **Tú:**
1. Crea una cuenta gratis en [neon.tech](https://neon.tech) (puedes usar GitHub).
2. Crea un proyecto nuevo, base de datos `pulso`.
3. En el dashboard del proyecto, pestaña **Connection Details**, copia:
   - **Pooled connection** (usa `-pooler` en el host) → esto es `DATABASE_URL`.
   - **Direct connection** (sin `-pooler`) → esto es `DIRECT_URL`.
4. Pégame ambas cadenas (o ponlas tú directamente en `apps/api/.env` y en las variables de
   entorno de Render — ver paso 2).

**Yo, una vez tenga las cadenas:**
```bash
cd apps/api
# apps/api/.env con DATABASE_URL y DIRECT_URL reales
npx prisma migrate deploy   # aplica el schema a Neon
npx prisma db seed          # carga las 131 plantillas de mensajes
```

---

## 2. API — Render (host gratuito siempre-activo, sin tarjeta)

👤 **Tú:**
1. Crea una cuenta gratis en [render.com](https://render.com) (GitHub login recomendado).
2. **New +** → **Blueprint** → conecta el repo `azo221017m-hub/pulso`. Render va a detectar
   `render.yaml` en la raíz automáticamente y proponer el servicio `pulso-api`.
3. Al crear el servicio, Render te va a pedir los valores de las env vars marcadas
   `sync: false` en `render.yaml`: pega ahí `DATABASE_URL` y `DIRECT_URL` de Neon (paso 1).
   `JWT_SECRET` se genera solo.
4. Deploy. La URL final va a ser algo como `https://pulso-api.onrender.com` (o con un sufijo
   si ese nombre ya está tomado — verifícalo en el dashboard tras el primer deploy).

**Nota sobre el plan free de Render:** el servicio se "duerme" tras ~15 min sin tráfico y la
primera petición después de eso tarda ~30-50s en responder (cold start). Por eso el cliente
mobile ya tiene un reintento automático — no es un bug si la primera carga del día es lenta.

**Si la URL final no es `https://pulso-api.onrender.com`**, avísame para actualizar
`apps/mobile/.env`, `apps/mobile/.env.example` y `apps/mobile/eas.json`.

---

## 3. Mobile — APK instalable con EAS Build (sin Expo Go)

👤 **Tú:**
1. Crea una cuenta gratis en [expo.dev](https://expo.dev).
2. Desde tu máquina (o dime y lo corro yo si me compartes un `EXPO_TOKEN` — ver abajo):
   ```bash
   cd apps/mobile
   npx eas login          # pide tus credenciales de Expo
   npx eas init           # vincula el proyecto, escribe el projectId en app.json
   npm run build:preview  # genera el APK en la nube (5-15 min)
   ```
3. Al terminar, EAS te da un link de descarga (y un QR). Ábrelo desde el navegador del
   celular, descarga el `.apk` e instálalo (Android te va a pedir permitir "instalar apps de
   fuentes desconocidas" la primera vez).

**Alternativa para que yo lo corra por ti:** en [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
generas un *access token* y me lo pasas (o lo pones tú en `apps/mobile/.env` como
`EXPO_TOKEN=...`, nunca lo pegues en el chat si prefieres mantenerlo privado). Con eso puedo
correr `eas login --non-interactive` y `eas build` sin que tengas que hacerlo manualmente.

Una vez instalado el APK, la app ya apunta a la URL de Render fija — no depende de que tu Mac
esté prendida, ni de redes compartidas, ni de túneles.

---

## Resumen de lo que cambió en el repo

- `docker-compose.yml` eliminado — ya no hace falta Postgres local.
- `apps/api/prisma/schema.prisma`: agregado `directUrl` (lo pide Neon para migraciones).
- `apps/api/package.json`: scripts `start:deploy` (migrate + start) y `postinstall` (prisma generate).
- `render.yaml`: blueprint de despliegue para Render.
- `apps/mobile/eas.json` + `app.json`: perfiles de build (`preview` → APK, `production` → AAB).
- `apps/mobile/.env`: `EXPO_PUBLIC_API_URL` apunta a la URL de producción en vez de localhost/túnel.
- Arreglé un bug real en `apps/api/tsconfig.build.json`: incluía `prisma/` y `scripts/` en el
  build, lo que rompía `node dist/main.js` (el output quedaba en `dist/src/main.js`). Esto
  habría fallado en cualquier deploy real, no solo en este.
