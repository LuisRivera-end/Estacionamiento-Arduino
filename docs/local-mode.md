# Modo LOCAL en Docker (offline primario)

Guía operativa para correr **todo el sistema en la laptop** con Docker cuando el
internet de la escuela es inestable. El stack local es la fuente primaria;
Render/Supabase quedan como *fallback* del puente y como destino de la
sincronización local → nube.

## Arquitectura

```
Arduinos --LAN--> host:8080 (bridge) --> backend local (primario)
                                     \--> Render (fallback, si el local no responde)

Navegadores --> host:4000 (frontend Next.js)
            --> host:8000 (backend FastAPI)
            --> host:9999 (auth-proxy nginx -> GoTrue)

backend + scheduler --> db:5432 (PostgreSQL local, volumen pgdata)
scheduler --> expira boletos c/5 min y hace push a REMOTE_DB_URL c/N min
```

Servicios del `docker-compose.yml`: `db`, `gotrue`, `auth-proxy`, `backend`,
`scheduler`, `bridge`, `frontend`.

## Requisitos

- Docker Desktop (Windows).
- IP LAN de la laptop estable. Recomendado: **reservar la IP por DHCP** en el
  router para que no cambie (las `NEXT_PUBLIC_*` se hornean en el build; ver más
  abajo).

## 1. Obtener `LAN_HOST`

```powershell
ipconfig
```

Usa la IPv4 de la interfaz conectada a la red de la escuela (p. ej.
`192.168.1.50`). Esa es tu `LAN_HOST`.

## 2. Configurar `.env.docker`

```powershell
copy .env.docker.example .env.docker
```

Edita `.env.docker` y rellena (ver comentarios del `.example`):

- `LAN_HOST` — la IP del paso 1.
- `POSTGRES_PASSWORD` — clave local cualquiera.
- `LOCAL_JWT_SECRET` — 32+ caracteres aleatorios:
  `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- `API_DEVICE_TOKEN_ENTRY` / `API_DEVICE_TOKEN_EXIT` — **los mismos** que en
  Render y en `entrada/wifi_credentials.h` / `salida/wifi_credentials.h`.
- `REMOTE_DB_URL` — la `SUPABASE_DB_URL` de producción (destino del sync). Si la
  dejas vacía, el sistema local funciona igual pero sin sincronizar.

`.env.docker` está en `.gitignore`: nunca se sube.

## 3. Arrancar

```powershell
docker compose --env-file .env.docker up -d --build
docker compose ps          # todos deben quedar "running"/"healthy"
```

Salud rápida:

```powershell
curl.exe http://localhost:8000/health
curl.exe http://localhost:9999/auth/v1/health
curl.exe http://localhost:8080/health
# Frontend: abre http://localhost:4000 (o http://<LAN_HOST>:4000)
```

## 4. Crear el primer administrador

1. Abre `http://<LAN_HOST>:4000/login`.
2. Pulsa **"Crear cuenta inicial"** (visible mientras no exista ningún usuario).
3. Con `GOTRUE_MAILER_AUTOCONFIRM=true` la cuenta queda confirmada al instante y
   entras al dashboard. El primer usuario se vuelve **ADMIN** automáticamente
   (`BOOTSTRAP_FIRST_USER_AS_ADMIN=true`).
4. **Cierra el registro** para que nadie más se dé de alta: en `.env.docker`
   pon `GOTRUE_DISABLE_SIGNUP=true` y recarga GoTrue:
   ```powershell
   docker compose --env-file .env.docker up -d gotrue
   ```

Verifica el rol:

```powershell
docker compose exec db psql -U postgres -c "select email, role from staff_users;"
```

## 5. Sincronizar a la nube

- **Automático**: el contenedor `scheduler` intenta el push cada
  `SYNC_INTERVAL_MINUTES` (por defecto 10). Sin internet falla en silencio y
  reintenta en el siguiente ciclo.
- **Manual**: en el panel, **Backups → Sincronización a la nube → "Sincronizar
  ahora"**. Muestra cuántas filas se enviaron por tabla y el estado.
- **Por consola**:
  ```powershell
  docker compose exec backend python -m app.db.sync_push        # incremental
  docker compose exec backend python -m app.db.sync_push --full # todo
  ```

Qué se sincroniza (local → nube, *upsert* por PK, gana lo más reciente):
`devices`, `tickets`, `payments`, `audit_logs`, `archived_tickets`,
`parking_settings`, `pricing_rules`, `parking_state`. **No** se suben
`staff_users` ni `backup_exports`.

> **Importante (esquema):** el push exige que las tablas/columnas existan en el
> remoto. La migración `0007_sync_state` se añadió al backend; despliega el
> backend a Render una vez para que la nube migre a `0007`. Si el remoto va
> atrasado y le falta alguna columna que se va a enviar, el push responde
> `schema_mismatch` (es una salvaguarda; las tablas operativas 0001–0006 no
> cambiaron, así que normalmente sincroniza sin problema).

## 6. Fallback del puente

Los Arduinos apuntan a `http://<LAN_HOST>:8080` (puerto del `bridge`). El puente
intenta primero el backend local; si éste no responde (timeout/conexión, **no**
un error HTTP del backend) reintenta contra Render. En los logs verás
`served_by=primary` o `served_by=fallback`:

```powershell
docker compose logs -f bridge
```

## Solución de problemas

- **GoTrue no arranca / errores de migración (R1).** Revisa
  `docker compose logs gotrue`. Si pide un rol que no existe, agrégalo como
  `NOLOGIN` en `docker/postgres/init/01-init-local.sql` y recrea el volumen:
  `docker compose down -v` y vuelve a `up` (⚠️ borra los datos locales).
- **Errores CORS al iniciar sesión (R2).** Descomenta el bloque CORS preparado
  en `docker/auth-proxy/nginx.conf` y `docker compose up -d auth-proxy`.
- **`remote_unreachable` siempre, aun con internet (R3).** La conexión directa
  `db.<ref>.supabase.co:5432` suele ser solo IPv6. Si la red no tiene salida
  IPv6, usa el **session pooler** de Supabase en `REMOTE_DB_URL`
  (`postgresql://postgres.<ref>:<pwd>@<region>.pooler.supabase.com:5432/postgres`).
  No uses el puerto 6543 (transaction pooler): rompe los prepared statements de
  asyncpg.
- **Cambié la IP de la laptop y el frontend no conecta (R6).** Las
  `NEXT_PUBLIC_*` se hornean en el build. Actualiza `LAN_HOST` y reconstruye:
  `docker compose --env-file .env.docker build frontend && docker compose up -d frontend`.
- **El Arduino real no llega al puente.** Abre los puertos entrantes
  4000/8000/8080/9999 en el Firewall de Windows para la red privada.

## Limitaciones conocidas

1. **Boletos creados en Render vía fallback no existen en local**: si el puente
   sirvió una entrada desde Render (backend local caído), ese boleto vive en la
   nube y la salida local dará `ticket_not_found`. El sync es solo local → nube.
2. `parking_state` y `pricing_rules` de la nube se **sobreescriben** con lo
   local en cada push (local es la fuente de verdad operativa).
3. Mantén la hora del host con NTP: los timestamps y el "gana el más reciente"
   dependen del reloj.
4. El cron de Render (`parking-expire-tickets`) sigue existiendo y expira lo que
   viva en la nube; es independiente del scheduler local.

## Comandos útiles

```powershell
docker compose ps
docker compose logs -f scheduler           # ciclos de expiración y sync
docker compose logs -f backend
docker compose exec db psql -U postgres    # consola SQL local
docker compose --env-file .env.docker up -d --build   # aplicar cambios
docker compose down                        # detener (conserva datos)
docker compose down -v                     # detener y BORRAR datos locales
```
