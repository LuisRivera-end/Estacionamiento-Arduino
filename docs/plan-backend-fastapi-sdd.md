# Backend FastAPI + Supabase + Render Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el backend del sistema de estacionamiento con FastAPI, Supabase PostgreSQL y despliegue en Render, manteniendo el codigo de ticket como identificador operativo.

**Architecture:** FastAPI sera la capa unica de reglas de negocio para Arduino, dashboard y pago simulado. Supabase se usara como PostgreSQL principal y Supabase Auth como proveedor de identidad del dashboard; el frontend no escribira directo a las tablas operativas. Render alojara servicios separados para `parking-api` y `parking-web` mediante Blueprint.

**Tech Stack:** Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2 async, asyncpg, Alembic, Supabase Auth, PostgreSQL, pytest, httpx, Render Blueprint.

---

## 1. Contexto usado

Este plan parte de:

- `docs/README.md`: el entregable actual es documental y no existe scaffolding de FastAPI, Supabase ni Render.
- `docs/especificacion-sistema-estacionamiento.md`: MVP con dos casetas Arduino, API FastAPI, Supabase PostgreSQL, dashboard Next.js, pago simulado puro y sin camaras ni placas.
- `docs/pagos-descuentos-ayuda.md`: reglas vigentes de pago simulado,
  descuentos adulto mayor/estudiante y sistema de ayuda.
- Skill Supabase: RLS obligatorio en tablas expuestas, llaves secretas solo en servidor, revisar exposicion de Data API y grants explicitos.
- Skill Render: usar Blueprint cuando hay mas de un servicio o configuracion reproducible; validar `render.yaml` con Render CLI.
- Docs oficiales consultados: Supabase API security, Supabase SSR Auth, Supabase secret key server-side, Render Blueprint YAML y Render FastAPI deploy.

## 2. Principios SDD

SDD aqui significa Specification Driven Development:

1. Especificar contrato antes de codigo: OpenAPI, SQL DDL, eventos de auditoria y errores estables.
2. Escribir pruebas que fallen antes de implementar cada regla de negocio critica.
3. Implementar lo minimo para pasar pruebas.
4. Verificar migraciones, RLS, integracion API-DB y despliegue antes de cerrar cada fase.
5. Registrar decisiones de seguridad y contratos que consume el frontend para evitar divergencias.

## 3. Decisiones de arquitectura

### Backend como fuente de verdad

FastAPI sera la unica capa que calcula precio, emite tickets, valida salidas, marca pagos, actualiza ocupacion y genera reportes. El frontend solo usara Supabase directamente para Auth; los datos operativos pasan por FastAPI.

### Acceso a Supabase

Usar conexion PostgreSQL desde FastAPI con `SUPABASE_DB_URL` y SQLAlchemy async. Esto permite transacciones y bloqueos (`SELECT ... FOR UPDATE`) para evitar sobreocupacion cuando dos vehiculos entren al mismo tiempo.

Mantener `SUPABASE_SECRET_KEY` solo para operaciones administrativas de Supabase Auth si se requieren. No debe existir en variables `NEXT_PUBLIC_*` ni en codigo frontend.

### Data API

Como el dashboard consumira FastAPI, la Data API de Supabase no es necesaria para tablas operativas. Recomendacion inicial:

- Desactivar Data API si el proyecto no la necesita.
- Si permanece activa, revocar acceso de `anon` y `authenticated` a tablas operativas.
- Habilitar RLS en todas las tablas de `public`.
- Otorgar grants explicitos solo al rol servidor que se use.

### Ticket extraviado

Sin placa ni camara no se puede identificar automaticamente un vehiculo con ticket perdido. El flujo sera asistido por operador:

1. Operador busca tickets activos por hora aproximada.
2. Marca el ticket correcto como `lost_ticket = true`.
3. Registra pago simulado con metodo `lost_ticket`.
4. Entrega el mismo codigo de ticket al usuario para salida.

No se agrega ningun campo obligatorio de placa.

## 4. Estructura de archivos propuesta

```text
backend/
  pyproject.toml
  alembic.ini
  app/
    main.py
    api/
      router.py
      deps.py
      routes/
        health.py
        status.py
        arduino.py
        public_tickets.py
        payments.py
        admin_reports.py
        admin_settings.py
        admin_backups.py
    core/
      config.py
      errors.py
      security.py
    db/
      session.py
      migrations/
    models/
      ticket.py
      payment.py
      pricing.py
      parking.py
      audit.py
      backup.py
      device.py
    repositories/
      tickets.py
      payments.py
      pricing.py
      parking_state.py
      audit.py
    schemas/
      tickets.py
      payments.py
      reports.py
      settings.py
      errors.py
    services/
      ticket_codes.py
      pricing.py
      entry_flow.py
      exit_flow.py
      payments.py
      reports.py
      backups.py
    connectors/
      supabase_auth.py
      frontend_contract.py
  tests/
    unit/
    integration/
    contract/
    security/
render.yaml
docs/
  plan-backend-fastapi-sdd.md
```

Responsabilidades:

- `api/routes/*`: endpoints FastAPI y conversion request/response.
- `services/*`: reglas de negocio puras y transaccionales.
- `repositories/*`: queries SQLAlchemy aisladas.
- `connectors/supabase_auth.py`: validacion de JWT Supabase para dashboard.
- `connectors/frontend_contract.py`: convenciones de headers, errores y version de OpenAPI para el cliente Next.js.

## 5. Esquema SQL propuesto

La migracion inicial debe crear extensiones, enums, tablas, indices, RLS y grants juntos. Esto evita que una tabla quede expuesta por accidente.

```sql
create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.ticket_status as enum ('active', 'exited', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'exempted', 'refunded');
create type public.payment_method as enum ('simulated_payment', 'manual_admin', 'lost_ticket');
-- `simulated_stripe` debe aceptarse solo como alias legado durante migracion.
create type public.payment_result as enum ('simulated', 'succeeded', 'voided', 'failed');
create type public.device_type as enum ('entry', 'exit');
create type public.backup_status as enum ('requested', 'completed', 'failed');

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  device_type public.device_type not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.parking_settings (
  id smallint primary key default 1 check (id = 1),
  capacity_total integer not null check (capacity_total > 0),
  timezone text not null default 'America/Mexico_City',
  currency char(3) not null default 'MXN',
  updated_at timestamptz not null default now()
);

create table public.parking_state (
  id smallint primary key default 1 check (id = 1),
  occupied_spaces integer not null default 0 check (occupied_spaces >= 0),
  active_tickets_count integer not null default 0 check (active_tickets_count >= 0),
  last_entry_at timestamptz,
  last_exit_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  free_tolerance_minutes integer not null default 5 check (free_tolerance_minutes >= 0),
  block_minutes integer not null check (block_minutes > 0),
  block_amount integer not null check (block_amount >= 0),
  lost_ticket_fee integer not null check (lost_ticket_fee >= 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index pricing_rules_one_active
  on public.pricing_rules (is_active)
  where is_active;

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique check (code::text ~ '^[A-Z0-9]{5}$'),
  status public.ticket_status not null default 'active',
  payment_status public.payment_status not null default 'unpaid',
  entry_at timestamptz not null default now(),
  paid_at timestamptz,
  exit_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  calculated_amount integer not null default 0 check (calculated_amount >= 0),
  lost_ticket boolean not null default false,
  entry_device_id uuid references public.devices(id),
  exit_device_id uuid references public.devices(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_status_idx on public.tickets (status);
create index tickets_payment_status_idx on public.tickets (payment_status);
create index tickets_entry_at_idx on public.tickets (entry_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id),
  subtotal_amount integer not null default 0 check (subtotal_amount >= 0),
  discount_type text not null default 'none',
  discount_percent integer not null default 0 check (discount_percent >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  amount integer not null check (amount >= 0),
  method public.payment_method not null,
  status public.payment_result not null default 'simulated',
  simulation_reference text,
  discount_evidence jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index payments_ticket_id_idx on public.payments (ticket_id);
create index payments_created_at_idx on public.payments (created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  ticket_id uuid references public.tickets(id),
  actor_type text not null check (actor_type in ('arduino_entry', 'arduino_exit', 'admin', 'system', 'public_payment')),
  actor_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_ticket_id_idx on public.audit_logs (ticket_id);

create table public.backup_exports (
  id uuid primary key default gen_random_uuid(),
  status public.backup_status not null default 'requested',
  file_path text,
  requested_by uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

insert into public.parking_settings (id, capacity_total, timezone, currency)
values (1, 40, 'America/Mexico_City', 'MXN')
on conflict (id) do nothing;

insert into public.parking_state (id, occupied_spaces, active_tickets_count)
values (1, 0, 0)
on conflict (id) do nothing;

insert into public.pricing_rules (
  name,
  free_tolerance_minutes,
  block_minutes,
  block_amount,
  lost_ticket_fee,
  is_active
)
values ('MVP default', 5, 30, 10, 150, true);
```

RLS y grants iniciales:

```sql
alter table public.devices enable row level security;
alter table public.parking_settings enable row level security;
alter table public.parking_state enable row level security;
alter table public.pricing_rules enable row level security;
alter table public.tickets enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;
alter table public.backup_exports enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
```

Si en una fase posterior el frontend lee tablas directamente con Supabase JS, se debe agregar una migracion separada con policies especificas. Para este MVP no se crean policies para `anon` ni `authenticated` sobre tablas operativas.

## 6. Contrato API FastAPI

Todas las rutas productivas deben vivir bajo `/api/v1`. Mantener `/health` fuera de version para Render.

### Salud

| Metodo | Ruta | Auth | Consumidor | Resultado |
| --- | --- | --- | --- | --- |
| GET | `/health` | ninguna | Render | `{ "status": "ok" }` |
| GET | `/api/v1/status` | device token o admin JWT | Arduino, dashboard | capacidad, ocupacion y ultimos eventos |

### Arduino

Headers:

```http
X-Device-Id: entrada-01
X-Device-Token: <API_DEVICE_TOKEN_ENTRY>
```

Endpoints:

| Metodo | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/v1/arduino/entry/tickets` | Validar capacidad, crear ticket y abrir flujo de entrada. |
| POST | `/api/v1/arduino/exit/validate` | Validar ticket, pago/tolerancia y registrar salida. |

Request entrada:

```json
{
  "device_id": "entrada-01"
}
```

Respuesta entrada exitosa:

```json
{
  "ticket_code": "A1B2C",
  "entry_at": "2026-05-25T09:10:00-06:00",
  "status": "active",
  "payment_status": "unpaid",
  "available_spaces": 27
}
```

Respuesta sin capacidad:

```json
{
  "error": "parking_full",
  "message": "Estacionamiento lleno"
}
```

Request salida:

```json
{
  "ticket_code": "A1B2C",
  "device_id": "salida-01"
}
```

Respuesta salida autorizada:

```json
{
  "authorized": true,
  "message": "Salida autorizada",
  "ticket_code": "A1B2C",
  "exit_at": "2026-05-25T10:20:00-06:00",
  "available_spaces": 28
}
```

Respuesta salida bloqueada:

```json
{
  "authorized": false,
  "reason": "payment_required",
  "message": "Pago pendiente"
}
```

### Pago publico simulado

Estas rutas pueden ser consumidas por una pagina publica del frontend con rate limiting por IP.

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/v1/public/tickets/{code}` | Consultar estado del ticket por codigo. |
| POST | `/api/v1/public/tickets/{code}/calculate` | Calcular monto segun tarifa activa. |
| POST | `/api/v1/public/payments/simulate` | Registrar pago simulado, sin cobro real ni pasarela externa. |

Request pago:

```json
{
  "ticket_code": "A1B2C",
  "lost_ticket": false,
  "method": "simulated_payment"
}
```

Respuesta pago:

```json
{
  "payment_id": "00000000-0000-0000-0000-000000000000",
  "ticket_code": "A1B2C",
  "status": "simulated",
  "amount": 10,
  "simulation_reference": "sim_payment_20260525_091000"
}
```

### Dashboard administrativo

Auth: `Authorization: Bearer <supabase_access_token>`.

El backend validara el JWT contra Supabase y usara roles desde `app_metadata`, nunca desde `user_metadata`.

| Metodo | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/v1/admin/reports/summary` | Tarjetas de ocupacion, tickets e ingresos del dia. |
| GET | `/api/v1/admin/reports/revenue` | Ingresos simulados por rango. |
| GET | `/api/v1/admin/reports/tickets` | Tabla filtrable de tickets. |
| POST | `/api/v1/admin/reports/export/pdf` | Exportar PDF operativo. |
| GET | `/api/v1/admin/pricing-rules/active` | Leer tarifa activa. |
| PUT | `/api/v1/admin/pricing-rules/active` | Reemplazar tarifa activa y auditar cambio. |
| GET | `/api/v1/admin/settings` | Leer capacidad, zona horaria y moneda. |
| PUT | `/api/v1/admin/settings` | Actualizar configuracion general. |
| PATCH | `/api/v1/admin/tickets/{code}/lost` | Marcar ticket activo como extraviado. |
| POST | `/api/v1/admin/backups/export` | Registrar backup manual bajo demanda. |

Modelo de error comun:

```json
{
  "error": "ticket_not_found",
  "message": "Ticket no encontrado",
  "request_id": "req_20260525_091000"
}
```

## 7. Conectores con frontend

El contrato con Next.js se hara por HTTP y OpenAPI:

- FastAPI publicara `/openapi.json`.
- CI generara tipos con `openapi-typescript`.
- Frontend usara `NEXT_PUBLIC_API_BASE_URL`.
- Dashboard enviara `Authorization: Bearer <Supabase access token>`.
- Pago publico no enviara JWT, pero si pasara por rate limiting y validacion de codigo.
- Supabase JS en frontend se usara solo para Auth SSR con cookies.

Cliente TypeScript esperado:

```ts
export type ApiError = {
  error: string
  message: string
  request_id: string
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {}
): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`)
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw await response.json() as ApiError
  }

  return response.json() as Promise<T>
}
```

Funciones frontend previstas:

- `getParkingStatus(accessToken)`
- `getTicketByCode(code)`
- `calculateTicketAmount(code, lostTicket)`
- `simulatePayment(payload)`
- `getAdminSummary(accessToken, range)`
- `getRevenueReport(accessToken, range)`
- `updatePricingRule(accessToken, payload)`
- `requestBackupExport(accessToken, payload)`

## 8. Reglas de negocio criticas

### Entrada

1. Validar token de caseta de entrada.
2. Abrir transaccion.
3. Bloquear `parking_state` con `FOR UPDATE`.
4. Leer `parking_settings.capacity_total`.
5. Si `occupied_spaces >= capacity_total`, crear `audit_logs` con `parking_full` y responder `409`.
6. Generar codigo alfanumerico uppercase de 5 caracteres.
7. Insertar ticket activo; si hay colision unica, reintentar hasta 5 veces.
8. Incrementar `occupied_spaces` y `active_tickets_count`.
9. Crear `audit_logs` con `ticket_created`.
10. Confirmar transaccion.

### Calculo de tarifa

1. Leer tarifa activa.
2. Calcular duracion desde `entry_at` hasta `now()`.
3. Si `lost_ticket = true`, usar `lost_ticket_fee`.
4. Si duracion esta dentro de tolerancia, monto `0`.
5. Si excede tolerancia, cobrar `ceil((duration - tolerance) / block_minutes) * block_amount`.
6. Devolver monto en centavos o unidad menor definida; para MVP se usaran enteros MXN.

### Pago simulado

1. Buscar ticket activo por codigo.
2. Calcular monto en servidor.
3. Crear `payments` con `status = simulated`.
4. Actualizar ticket con `payment_status = paid`, `paid_at`, `calculated_amount` y `lost_ticket`.
5. Auditar `payment_simulated`.

### Salida

1. Validar token de caseta de salida.
2. Abrir transaccion.
3. Bloquear ticket y `parking_state`.
4. Si ticket no existe, responder `404`.
5. Si ticket ya salio, responder `409`.
6. Si esta dentro de tolerancia y sin pago, marcar `payment_status = exempted` y monto `0`.
7. Si requiere pago y no esta pagado, auditar `exit_blocked` y responder `402`.
8. Si esta pagado o exento, marcar `status = exited`, asignar `exit_at`, calcular duracion y decrementar ocupacion.
9. Auditar `exit_authorized`.
10. Confirmar transaccion.

## 9. Testing

### Unit tests

| Area | Archivo | Casos minimos |
| --- | --- | --- |
| Generador de tickets | `tests/unit/test_ticket_codes.py` | longitud 5, uppercase, alfanumerico, colision reintentable. |
| Tarifas | `tests/unit/test_pricing.py` | tolerancia 5 min, bloque exacto, bloque parcial con ceil, extravio. |
| Seguridad Arduino | `tests/unit/test_device_auth.py` | token correcto, token incorrecto, device inactivo. |
| Transiciones | `tests/unit/test_ticket_state.py` | activo a pagado, pagado a salido, doble salida rechazada. |

Ejemplo de test de tarifa:

```python
from app.services.pricing import calculate_amount

def test_calculate_amount_after_tolerance_rounds_up_blocks():
    amount = calculate_amount(
        duration_minutes=64,
        free_tolerance_minutes=5,
        block_minutes=30,
        block_amount=10,
        lost_ticket_fee=150,
        lost_ticket=False,
    )

    assert amount == 20
```

### Integration tests

Usar PostgreSQL local con migraciones Alembic o Supabase local. Cada test debe correr con transaccion aislada.

Casos:

- Crear ticket incrementa ocupacion.
- Parking lleno responde `409` y no crea ticket.
- Pago simulado actualiza `tickets` y crea `payments`.
- Salida sin pago fuera de tolerancia responde `402`.
- Salida dentro de tolerancia marca `exempted` y decrementa ocupacion.
- Dos entradas concurrentes no superan `capacity_total`.

### Contract tests

- Snapshot de `/openapi.json`.
- Validar que errores tengan `error`, `message`, `request_id`.
- Validar que el cliente TypeScript generado compile.
- Validar CORS solo para dominios en `ALLOWED_ORIGINS`.

### Security tests

Consultas de verificacion:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated', 'service_role')
order by table_name, grantee, privilege_type;
```

Resultados esperados:

- Todas las tablas operativas tienen RLS habilitado.
- `anon` y `authenticated` no tienen grants sobre tablas operativas.
- `service_role` o el rol servidor definido tiene solo los permisos requeridos.

### API smoke tests

```bash
curl -i http://localhost:8000/health
curl -i http://localhost:8000/api/v1/status -H "X-Device-Token: $API_DEVICE_TOKEN_ENTRY"
curl -i -X POST http://localhost:8000/api/v1/arduino/entry/tickets \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: entrada-01" \
  -H "X-Device-Token: $API_DEVICE_TOKEN_ENTRY" \
  -d '{"device_id":"entrada-01"}'
```

## 10. Verificaciones por fase

### Base de datos

- [ ] `alembic upgrade head` aplica sin errores.
- [ ] `alembic downgrade -1 && alembic upgrade head` funciona en entorno local.
- [ ] Queries de RLS/grants devuelven el estado esperado.
- [ ] `supabase db advisors` o asesor equivalente no reporta hallazgos criticos.
- [ ] Se confirma si la Data API esta desactivada o si los grants explicitos son correctos.

### Backend

- [ ] `pytest` pasa completo.
- [ ] `ruff check backend` pasa.
- [ ] `mypy backend` pasa si se activa typing estricto.
- [ ] `/health` responde 200.
- [ ] `/openapi.json` se genera sin schemas anonimos confusos.
- [ ] Logs no imprimen tokens, secret keys ni strings de conexion.

### Frontend contract

- [ ] `NEXT_PUBLIC_API_BASE_URL` apunta a FastAPI.
- [ ] Dashboard adjunta Supabase access token.
- [ ] Cliente publico de pago no requiere Supabase session.
- [ ] Tipos generados desde OpenAPI compilan.
- [ ] Errores se muestran por `message`, no por detalles internos.

### Render

- [ ] `render.yaml` existe en la raiz.
- [ ] `render blueprints validate` pasa.
- [ ] `parking-api` usa runtime `python`.
- [ ] `parking-api` arranca con `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- [ ] `healthCheckPath` apunta a `/health`.
- [ ] Secretos quedan con `sync: false`.
- [ ] No se provisiona Render Postgres porque Supabase es la DB principal.

## 11. Render Blueprint propuesto

```yaml
services:
  - type: web
    name: parking-api
    runtime: python
    plan: free
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
    envVars:
      - key: APP_ENV
        value: production
      - key: ALLOWED_ORIGINS
        sync: false
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SECRET_KEY
        sync: false
      - key: SUPABASE_DB_URL
        sync: false
      - key: API_DEVICE_TOKEN_ENTRY
        sync: false
      - key: API_DEVICE_TOKEN_EXIT
        sync: false

  - type: web
    name: parking-web
    runtime: node
    plan: free
    rootDir: frontend
    buildCommand: npm ci && npm run build
    startCommand: npm run start
    envVars:
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        sync: false
      - key: NEXT_PUBLIC_API_BASE_URL
        sync: false
```

Validacion Render:

```bash
render whoami -o json
render blueprints validate
```

## 12. Orden de implementacion

### Task 1: Scaffold backend

**Files:**

- Create: `backend/pyproject.toml`
- Create: `backend/app/main.py`
- Create: `backend/app/api/router.py`
- Create: `backend/app/core/config.py`
- Test: `backend/tests/unit/test_health.py`

- [ ] Definir dependencias FastAPI, SQLAlchemy, asyncpg, Alembic, pytest, httpx, ruff.
- [ ] Crear `/health`.
- [ ] Escribir test de `/health`.
- [ ] Ejecutar `pytest backend/tests/unit/test_health.py -v`.
- [ ] Commit: `feat: scaffold fastapi backend`.

### Task 2: Migracion inicial Supabase

**Files:**

- Create: `backend/alembic.ini`
- Create: `backend/app/db/session.py`
- Create: `backend/app/db/migrations/versions/0001_initial_parking_schema.py`
- Test: `backend/tests/integration/test_initial_schema.py`

- [ ] Crear DDL con tablas de la seccion 5.
- [ ] Incluir RLS y grants en la misma migracion.
- [ ] Probar migracion contra Postgres local.
- [ ] Verificar indices y singleton rows de configuracion.
- [ ] Commit: `feat: add initial parking schema`.

### Task 3: Seguridad y dependencias API

**Files:**

- Create: `backend/app/core/security.py`
- Create: `backend/app/api/deps.py`
- Create: `backend/app/connectors/supabase_auth.py`
- Test: `backend/tests/unit/test_device_auth.py`
- Test: `backend/tests/unit/test_admin_auth.py`

- [ ] Validar tokens `X-Device-Token` por caseta.
- [ ] Validar JWT Supabase para dashboard.
- [ ] Leer rol desde `app_metadata`.
- [ ] Rechazar `user_metadata` como fuente de autorizacion.
- [ ] Commit: `feat: add api authentication dependencies`.

### Task 4: Servicio de entrada

**Files:**

- Create: `backend/app/services/ticket_codes.py`
- Create: `backend/app/services/entry_flow.py`
- Create: `backend/app/repositories/tickets.py`
- Create: `backend/app/repositories/parking_state.py`
- Create: `backend/app/api/routes/arduino.py`
- Test: `backend/tests/unit/test_ticket_codes.py`
- Test: `backend/tests/integration/test_entry_flow.py`

- [ ] Escribir test de codigo alfanumerico de 5 caracteres.
- [ ] Escribir test de entrada con capacidad disponible.
- [ ] Escribir test de estacionamiento lleno.
- [ ] Implementar transaccion con bloqueo de `parking_state`.
- [ ] Registrar auditoria de entrada y lleno.
- [ ] Commit: `feat: add arduino entry flow`.

### Task 5: Tarifas, pagos y salida

**Files:**

- Create: `backend/app/services/pricing.py`
- Create: `backend/app/services/payments.py`
- Create: `backend/app/services/exit_flow.py`
- Create: `backend/app/api/routes/public_tickets.py`
- Create: `backend/app/api/routes/payments.py`
- Test: `backend/tests/unit/test_pricing.py`
- Test: `backend/tests/integration/test_payment_and_exit_flow.py`

- [ ] Escribir tests de tolerancia, bloques y extravio.
- [ ] Implementar calculo en servidor.
- [ ] Implementar pago simulado.
- [ ] Implementar salida autorizada, bloqueada y exenta por tolerancia.
- [ ] Verificar decremento de ocupacion.
- [ ] Commit: `feat: add pricing payment and exit flows`.

### Task 6: Dashboard admin

**Files:**

- Create: `backend/app/api/routes/admin_reports.py`
- Create: `backend/app/api/routes/admin_settings.py`
- Create: `backend/app/api/routes/admin_backups.py`
- Create: `backend/app/services/reports.py`
- Create: `backend/app/services/backups.py`
- Test: `backend/tests/integration/test_admin_routes.py`

- [ ] Implementar resumen operativo.
- [ ] Implementar reportes de ingresos y tickets filtrables.
- [ ] Implementar actualizacion de tarifa activa con auditoria.
- [ ] Implementar actualizacion de settings con auditoria.
- [ ] Implementar registro de backup manual.
- [ ] Commit: `feat: add admin dashboard api`.

### Task 7: Contrato frontend

**Files:**

- Create: `backend/app/connectors/frontend_contract.py`
- Create: `backend/tests/contract/test_openapi_contract.py`
- Create: `docs/backend-api-contract.md`

- [ ] Estabilizar modelos Pydantic de request/response.
- [ ] Generar y revisar `/openapi.json`.
- [ ] Documentar headers, errores y rutas consumidas por Next.js.
- [ ] Agregar snapshot test de OpenAPI.
- [ ] Commit: `docs: add backend api contract`.

### Task 8: Render deploy config

**Files:**

- Create: `render.yaml`
- Test: validacion Render CLI.

- [ ] Crear Blueprint de dos servicios.
- [ ] Marcar secretos con `sync: false`.
- [ ] Configurar `/health` como health check.
- [ ] Ejecutar `render blueprints validate`.
- [ ] Commit: `chore: add render blueprint`.

## 13. Criterios de aceptacion

- El backend puede emitir tickets sin superar capacidad configurada.
- La salida se bloquea si el ticket requiere pago y no esta pagado.
- La salida se autoriza si el ticket esta pagado o dentro de tolerancia.
- El pago simulado nunca usa Stripe ni otra pasarela real.
- No existe campo obligatorio de placa.
- Todas las tablas operativas tienen RLS habilitado.
- `anon` y `authenticated` no tienen grants directos a tablas operativas.
- El frontend tiene un contrato HTTP versionado y tipable.
- Render puede validar el Blueprint y arrancar FastAPI en `$PORT`.
- Los flujos principales tienen tests unitarios, integracion, contrato y seguridad.

## 14. Riesgos y controles

| Riesgo | Control |
| --- | --- |
| Sobreocupacion por entradas simultaneas | Transaccion con bloqueo de `parking_state`. |
| Exposicion accidental de tablas Supabase | RLS, revokes y Data API desactivada o grants explicitos. |
| Secret key en frontend | Variables publicas limitadas y grep de CI contra `SUPABASE_SECRET_KEY`. |
| Arduino sin HTTPS en maqueta local | Token por caseta y despliegue HTTPS en Render para entorno remoto. |
| Ticket extraviado sin identificador | Flujo asistido por operador sin placas ni camara. |
| Divergencia frontend-backend | OpenAPI versionado y tipos generados. |
| Render no arranca API | Start command con `0.0.0.0:$PORT` y `/health`. |
