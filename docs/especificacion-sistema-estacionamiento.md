# Especificacion Tecnica del Sistema de Estacionamiento

## 1. Resumen

El sistema de estacionamiento inteligente controlara entradas, salidas, pagos,
ocupacion y reportes administrativos. El MVP integra dos casetas con Arduino
Uno, comunicacion WiFi mediante ESP8266, una API FastAPI, una base de datos
Supabase PostgreSQL y un panel administrativo en Next.js.

El sistema no usara camara y no almacenara placas de vehiculo. El codigo de
ticket sera el identificador principal durante todo el flujo.

## 2. Alcance del MVP documental

Este documento define la arquitectura y las decisiones tecnicas para una
implementacion posterior. No crea codigo funcional, migraciones, servicios ni
configuracion de despliegue.

Incluye:

- Arquitectura de frontend, backend, base de datos y hardware.
- Flujos de entrada, salida, pago simulado, descuentos, ayuda y ticket
  extraviado.
- Modelo de datos propuesto en Supabase PostgreSQL.
- Contrato de API FastAPI.
- Alcance del dashboard administrativo.
- Variables de entorno esperadas.
- Lineamientos de despliegue en Render.
- Backups manuales desde el dashboard.

Fuera de alcance en esta fase:

- Cobros reales con pasarelas externas.
- Lectura automatica por camara.
- Reconocimiento de placas.
- Jobs programados de backup.
- Provisionamiento real de servicios en Render o Supabase.

## 3. Arquitectura

```text
Arduino Entrada + ESP8266
        |
        | HTTP REST
        v
FastAPI API en Render <----> Supabase PostgreSQL
        ^
        | HTTPS
        |
Next.js Dashboard en Render
```

### Componentes

| Componente | Tecnologia | Responsabilidad |
| --- | --- | --- |
| Caseta de entrada | Arduino Uno, ESP8266, sensor IR, LCD, servo, impresora o emision de codigo | Detectar vehiculo, solicitar ticket, mostrar/imprimir codigo y abrir barrera. |
| Caseta de salida | Arduino Uno, ESP8266, teclado matricial, LCD, buzzer, LED, servo | Capturar codigo, consultar pago, bloquear o abrir salida. |
| Frontend web | Next.js, Chakra UI, `@chakra-ui/charts`, Recharts | Dashboard administrativo, reportes, pagos simulados y configuracion. |
| Backend web | FastAPI | Reglas de negocio, API para Arduino, API para dashboard y operaciones administrativas. |
| Base de datos | Supabase PostgreSQL | Tickets, pagos, tarifas, estado operativo, auditoria y backups exportados. |
| Despliegue | Render | Servicios separados para frontend y API mediante Blueprint. |

Supabase Auth se usara para operadores y administradores. En Next.js se debe
usar autenticacion server-side con cookies. Las operaciones privilegiadas
deben pasar por FastAPI usando una llave secreta de Supabase solo en servidor.

## 4. Flujos Arduino

### 4.1 Entrada

1. El sensor IR detecta que un vehiculo llego a la entrada.
2. Arduino solicita a FastAPI validar si hay capacidad disponible.
3. Si no hay capacidad:
   - La barrera permanece cerrada.
   - La pantalla LCD muestra estacionamiento lleno.
   - Se registra el evento en auditoria.
4. Si hay capacidad:
   - FastAPI genera un codigo unico de ticket.
   - Se crea el ticket en estado activo y no pagado.
   - Arduino muestra o imprime el codigo de ticket.
   - La barrera de entrada se abre.
   - Se registra la entrada.
5. El vehiculo ingresa y el sistema actualiza la ocupacion.

### 4.2 Salida

1. El sensor IR detecta que un vehiculo llego a la salida.
2. El usuario ingresa el codigo del ticket en el teclado matricial.
3. Arduino consulta FastAPI con el codigo capturado.
4. FastAPI valida que el ticket exista, este activo y este pagado o que entre en el rango de tolerancia (Sin pagar).
5. Si el ticket no esta pagado:
   - La barrera permanece cerrada.
   - La pantalla LCD muestra pago pendiente.
   - El LED rojo y el buzzer pueden indicar bloqueo.
   - Se registra el intento de salida.
6. Si el ticket esta pagado o dentro del rango de tolerancia:
   - FastAPI registra la salida.
   - La barrera de salida se abre.
   - La pantalla LCD confirma salida autorizada.
   - Se actualiza la ocupacion.

### 4.3 Pago simulado

1. El usuario llega a la web de pago e ingresa el codigo de ticket.
2. El frontend consulta el ticket.
3. FastAPI calcula el monto con las reglas vigentes.
4. La UI muestra una experiencia de pago simulado, sin solicitar datos
   bancarios ni realizar cobro real.
5. Al confirmar, `POST /payments/simulate` crea un pago simulado.
6. El ticket queda marcado como pagado.
7. El usuario puede salir usando el mismo codigo de ticket.

Si el usuario cancela el checkout, no se crea registro de pago y el ticket
permanece sin cambios.

### 4.3.1 Descuentos

El sistema permitira descuentos simulados para:

- Adultos mayores: edad declarada de 65 anios o mas y referencia INAPAM
  parcial.
- Estudiantes: correo escolar con dominio permitido.

Ambos descuentos inician con 50% y deben ser configurables desde las reglas de
tarifa. Solo se puede aplicar un descuento por pago. La aplicacion del
descuento a ticket extraviado sera configurable por tipo de descuento.

### 4.4 Ticket extraviado

1. El usuario indica ticket extraviado en el flujo web o con ayuda del operador.
2. El sistema muestra la tarifa de extravio configurable.
3. En esta fase, el pago se registra con el mismo mecanismo simulado.
4. El registro debe quedar marcado como extravio para reportes y auditoria.

### 4.5 Programacion del Arduino esperado

1. Para el ticket se generan 5 digitos alfanumericos aleatorios.
2. La programacion del Arduino debe incluir:
   - Una funcion para generar codigo de ticket.
   - Una funcion para enviar codigo de ticket a la API FastAPI.
   - Una funcion para recibir respuesta de la API FastAPI.
   - Una funcion para abrir la barrera de entrada.
   - Una funcion para abrir la barrera de salida.
   - Una funcion para mostrar mensaje en pantalla LCD.
3. Las variables declaradas del Arduino deben mencionar el PIN o puerto al que esta conectado cada componente (Sensor IR, LCD, Servo, etc).

## 5. Reglas de tarifa

Las tarifas se almacenan en base de datos y son editables desde el dashboard.

Reglas base del MVP:

- Tolerancia gratuita: 5 minutos desde la hora de entrada.
- Despues de la tolerancia, el precio aumenta por bloques configurables.
- Cada bloque define duracion en minutos y monto.
- La tarifa por ticket extraviado es configurable.
- Descuento adulto mayor: 50% inicial, configurable.
- Descuento estudiante: 50% inicial, configurable.
- Los dominios de correo escolar permitidos son configurables.
- La aplicacion de descuentos a ticket extraviado es configurable por tipo de
  descuento.
- El calculo se hace en FastAPI para evitar manipulacion desde frontend o
  Arduino.

Ejemplo conceptual:

| Regla | Valor |
| --- | --- |
| Tolerancia | 5 minutos |
| Bloque base | Cada 30 minutos |
| Monto por bloque | Configurable |
| Extravio | Monto fijo configurable |
| Adulto mayor | 50% inicial |
| Estudiante | 50% inicial |

## 6. Modelo de datos propuesto

Los nombres finales pueden ajustarse durante la implementacion, pero el modelo
debe mantener el principio de que el codigo de ticket es el identificador
operativo. No debe agregarse ningun campo obligatorio relacionado con placa o
camara.

### 6.1 `tickets`

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `id` | UUID | Identificador interno. |
| `code` | Text, unico | Codigo que se entrega al usuario. |
| `status` | Enum/text | `active`, `paid`, `exited`, `lost`, `cancelled`. |
| `payment_status` | Enum/text | `unpaid`, `paid`, `exempted`, `refunded`. |
| `entry_at` | Timestamptz | Fecha y hora de entrada. |
| `paid_at` | Timestamptz, nullable | Fecha y hora de pago. |
| `exit_at` | Timestamptz, nullable | Fecha y hora de salida. |
| `duration_minutes` | Integer, nullable | Duracion calculada al pagar o salir. |
| `calculated_amount` | Integer | Monto calculado. |
| `lost_ticket` | Boolean | Indica si se aplico tarifa por extravio. |
| `created_at` | Timestamptz | Fecha de creacion. |
| `updated_at` | Timestamptz | Fecha de ultima actualizacion. |

### 6.2 `payments`

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `id` | UUID | Identificador interno. |
| `ticket_id` | UUID | Relacion con `tickets.id`. |
| `subtotal_amount` | Integer | Monto antes de descuento. |
| `discount_type` | Text | `none`, `senior` o `student`. |
| `discount_percent` | Integer | Porcentaje aplicado. |
| `discount_amount` | Integer | Monto descontado. |
| `amount` | Integer | Total pagado o simulado despues de descuentos. |
| `method` | Text | `simulated_payment`, `manual_admin`, `lost_ticket`; `simulated_stripe` queda como alias legado. |
| `status` | Text | `simulated`, `succeeded`, `voided`, `failed`. |
| `simulation_reference` | Text, nullable | Referencia interna simulada. |
| `discount_evidence` | JSONB, nullable | Evidencia parcial de descuento, sin imagenes ni datos completos. |
| `created_by` | UUID, nullable | Operador o administrador, cuando aplique. |
| `created_at` | Timestamptz | Fecha del pago. |

### 6.3 `pricing_rules`

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `id` | UUID | Identificador interno. |
| `name` | Text | Nombre de la regla activa. |
| `free_tolerance_minutes` | Integer | Minutos sin cobro, default 5. |
| `block_minutes` | Integer | Tamano del bloque de cobro. |
| `block_amount` | Integer | Monto por bloque. |
| `lost_ticket_fee` | Integer | Monto por extravio. |
| `senior_discount_percent` | Integer | Porcentaje de descuento para adulto mayor, default 50. |
| `student_discount_percent` | Integer | Porcentaje de descuento para estudiante, default 50. |
| `student_allowed_domains` | JSON/Text array | Dominios validos para correo escolar. |
| `senior_discount_applies_to_lost_ticket` | Boolean | Define si adulto mayor aplica a extravio. |
| `student_discount_applies_to_lost_ticket` | Boolean | Define si estudiante aplica a extravio. |
| `is_active` | Boolean | Solo una regla activa para el MVP. |
| `created_at` | Timestamptz | Fecha de creacion. |
| `updated_at` | Timestamptz | Fecha de ultima actualizacion. |

### 6.4 `parking_settings`

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `id` | UUID | Identificador interno. |
| `capacity_total` | Integer | Capacidad total configurada. |
| `timezone` | Text | Zona horaria operativa. |
| `currency` | Text | Moneda de cobro, por ejemplo `MXN`. |
| `updated_at` | Timestamptz | Fecha de ultima actualizacion. |

### 6.5 `parking_state`

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `id` | UUID | Identificador interno. |
| `occupied_spaces` | Integer | Lugares ocupados actualmente. |
| `active_tickets_count` | Integer | Tickets activos. |
| `last_entry_at` | Timestamptz, nullable | Ultima entrada. |
| `last_exit_at` | Timestamptz, nullable | Ultima salida. |
| `updated_at` | Timestamptz | Fecha de actualizacion. |

### 6.6 `audit_logs`

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `id` | UUID | Identificador interno. |
| `event_type` | Text | Entrada, salida, pago, backup, tarifa, error o bloqueo. |
| `ticket_id` | UUID, nullable | Ticket relacionado. |
| `actor_type` | Text | `arduino_entry`, `arduino_exit`, `admin`, `system`. |
| `actor_id` | Text, nullable | Identificador de dispositivo o usuario. |
| `payload` | JSONB | Datos no sensibles del evento. |
| `created_at` | Timestamptz | Fecha del evento. |

### 6.7 `backup_exports`

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `id` | UUID | Identificador interno. |
| `status` | Text | `requested`, `completed`, `failed`. |
| `file_path` | Text, nullable | Ruta en Supabase Storage o ubicacion definida. |
| `requested_by` | UUID, nullable | Administrador que solicito el backup. |
| `created_at` | Timestamptz | Fecha de solicitud. |
| `completed_at` | Timestamptz, nullable | Fecha de finalizacion. |

## 7. Seguridad y Supabase

- Todas las tablas expuestas en `public` deben tener Row Level Security
  habilitado.
- El dashboard debe usar Supabase Auth para usuarios administrativos.
- Next.js debe usar sesiones server-side con cookies mediante `@supabase/ssr`.
- El frontend solo puede usar `NEXT_PUBLIC_SUPABASE_URL` y
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- La llave secreta de Supabase nunca debe exponerse en variables `NEXT_PUBLIC_*`.
- FastAPI puede usar `SUPABASE_SECRET_KEY` o una cadena de conexion privada
  para operaciones administrativas.
- Las llamadas de Arduino a FastAPI deben usar un token de dispositivo o llave
  por caseta, no la llave secreta de Supabase.
- Si se crean vistas para reportes, deben respetar RLS o vivir en un esquema no
  expuesto.
- Las funciones privilegiadas de base de datos no deben vivir en esquemas
  expuestos publicamente.

Nota operativa: Supabase anuncio cambios recientes relacionados con exposicion
automatica de tablas a las APIs de datos. La implementacion debe confirmar la
configuracion de Data API y permisos antes de depender de acceso directo desde
clientes.

## 8. API FastAPI propuesta

### 8.1 Salud y estado

#### `GET /health`

Devuelve salud basica de la API.

Respuesta:

```json
{
  "status": "ok"
}
```

#### `GET /status`

Devuelve estado operativo para Arduino y dashboard.

Respuesta:

```json
{
  "capacity_total": 40,
  "occupied_spaces": 12,
  "available_spaces": 28,
  "active_tickets": 12,
  "last_entry_at": "2026-05-23T08:30:00-06:00",
  "last_exit_at": "2026-05-23T09:05:00-06:00"
}
```

### 8.2 Tickets

#### `POST /tickets`

Genera un ticket de entrada.

Request:

```json
{
  "device_id": "entrada-01"
}
```

Respuesta exitosa:

```json
{
  "ticket_code": "A1B2C3D4",
  "entry_at": "2026-05-23T09:10:00-06:00",
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

#### `GET /tickets/{code}`

Consulta el estado de un ticket.

Respuesta:

```json
{
  "ticket_code": "A1B2C3D4",
  "status": "active",
  "payment_status": "unpaid",
  "entry_at": "2026-05-23T09:10:00-06:00",
  "paid_at": null,
  "exit_at": null,
  "lost_ticket": false
}
```

#### `POST /tickets/{code}/calculate`

Calcula el monto segun reglas activas.

Request:

```json
{
  "lost_ticket": false,
  "discount": {
    "type": "student",
    "student_email": "alumno@escuela.edu.mx"
  }
}
```

Respuesta:

```json
{
  "ticket_code": "A1B2C3D4",
  "duration_minutes": 64,
  "free_tolerance_minutes": 5,
  "subtotal_amount": 20,
  "discount_type": "student",
  "discount_percent": 50,
  "discount_amount": 10,
  "amount": 10,
  "currency": "MXN"
}
```

### 8.3 Pagos

#### `POST /payments/simulate`

Registra un pago simulado. No realiza ningun cobro real.

Request:

```json
{
  "ticket_code": "A1B2C3D4",
  "lost_ticket": false,
  "method": "simulated_payment",
  "discount": {
    "type": "none"
  }
}
```

Respuesta:

```json
{
  "payment_id": "uuid",
  "ticket_code": "A1B2C3D4",
  "status": "simulated",
  "subtotal_amount": 20,
  "discount_type": "none",
  "discount_amount": 0,
  "amount": 20,
  "simulation_reference": "sim_payment_A1B2C3D4_20260523_001"
}
```

### 8.4 Salidas

#### `POST /exit`

Valida pago y registra salida.

Request:

```json
{
  "ticket_code": "A1B2C3D4",
  "device_id": "salida-01"
}
```

Respuesta autorizada:

```json
{
  "authorized": true,
  "message": "Salida autorizada",
  "ticket_code": "A1B2C3D4",
  "exit_at": "2026-05-23T10:20:00-06:00",
  "available_spaces": 28
}
```

Respuesta bloqueada:

```json
{
  "authorized": false,
  "reason": "payment_required",
  "message": "Pago pendiente"
}
```

### 8.5 Reportes y backups

#### `GET /reports/summary`

Metricas para tarjetas del dashboard.

#### `GET /reports/revenue`

Ingresos simulados por rango de fechas.

#### `GET /reports/tickets`

Listado filtrable de tickets para tabla y exportacion PDF.

#### `POST /reports/export/pdf`

Genera un PDF con informacion operativa, ingresos o tickets.

#### `POST /backups/export`

Genera un backup manual bajo demanda.

Request:

```json
{
  "scope": "full",
  "requested_by": "admin"
}
```

Respuesta:

```json
{
  "backup_id": "uuid",
  "status": "requested"
}
```

## 9. Dashboard administrativo

El dashboard debe ser una herramienta operativa, densa y clara. No debe ser una
landing page. La primera pantalla debe mostrar el estado real del
estacionamiento.

### 9.1 Vistas principales

- Resumen operativo:
  - Ocupacion actual.
  - Capacidad disponible.
  - Entradas de hoy.
  - Salidas de hoy.
  - Tickets activos.
  - Tickets pagados.
  - Tickets extraviados.
  - Ingresos simulados del dia.
- Entradas y salidas:
  - Tabla de eventos.
  - Filtros por rango de fechas, estado y tipo de evento.
  - Busqueda por codigo de ticket.
- Pagos:
  - Tabla de pagos simulados.
  - Subtotal, descuento, monto final, metodo, estado, fecha y ticket.
  - Indicador visual de que el pago es simulado y no realiza cargo real.
  - Filtros por metodo y tipo de descuento.
- Tarifas:
  - Tolerancia gratuita.
  - Bloque de tiempo.
  - Precio por bloque.
  - Tarifa por extravio.
  - Porcentaje de descuento adulto mayor.
  - Porcentaje de descuento estudiante.
  - Dominios escolares permitidos.
  - Aplicacion de descuentos a ticket extraviado.
  - Historial de cambios en auditoria.
- Reportes:
  - Exportacion PDF de ingresos.
  - Exportacion PDF de tickets.
  - Exportacion PDF de actividad operativa.
- Backups:
  - Boton de backup manual.
  - Historial de exportaciones.
  - Estado de cada exportacion.
- Configuracion:
  - Capacidad total.
  - Zona horaria.
  - Moneda.
  - Identificadores de dispositivos Arduino.
- Ayuda:
  - Preguntas frecuentes sobre pago simulado, descuentos, ticket extraviado,
    botones del sistema y salida.

### 9.2 Graficas

Usar `@chakra-ui/charts` y Recharts para:

- Ocupacion por hora.
- Entradas vs salidas por dia.
- Ingresos simulados por dia, semana y mes.
- Distribucion de tickets por estado.
- Tickets extraviados por periodo.

## 10. Pagos simulados, descuentos y ayuda

El MVP usa pago simulado puro. No existe integracion activa con Stripe ni con
otra pasarela externa.

Reglas:

- No se deben usar llaves reales de Stripe ni variables `STRIPE_*`.
- No se debe solicitar informacion bancaria.
- El estado del pago se marca como `simulated`.
- El metodo vigente es `simulated_payment`.
- `simulated_stripe` queda solo como alias legado para datos existentes.
- La tabla `payments` debe conservar subtotal, descuento y total final.
- La referencia vigente del pago simulado sera `simulation_reference`.
- El backend recalcula el monto al calcular y al registrar el pago.
- Si el checkout se cancela, no se registra pago.

Los descuentos y el sistema de ayuda se detallan en
[`pagos-descuentos-ayuda.md`](./pagos-descuentos-ayuda.md).

## 11. Backups manuales

El MVP solo contempla backups manuales desde dashboard.

Flujo:

1. El administrador entra a la vista Backups.
2. Solicita una exportacion.
3. FastAPI registra el evento en `backup_exports`.
4. FastAPI genera la exportacion definida para la fase.
5. El resultado queda disponible en historial.
6. Se registra un evento en `audit_logs`.

Opciones futuras:

- Guardar archivos en Supabase Storage.
- Generar SQL dump controlado desde entorno servidor.
- Agregar job programado nocturno.
- Notificar errores de backup.

## 12. Variables de entorno

### 12.1 Frontend Next.js

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_API_BASE_URL=
```

### 12.2 Backend FastAPI

```env
SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_DB_URL=
API_DEVICE_TOKEN_ENTRY=
API_DEVICE_TOKEN_EXIT=
APP_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

### 12.3 Pagos simulados

El MVP no requiere variables de entorno para pasarelas de pago. Cualquier llave
`STRIPE_*` queda fuera del alcance vigente.

## 13. Despliegue en Render

El despliegue objetivo sera por Render Blueprint porque la arquitectura tiene
servicios separados.

Servicios previstos:

- `parking-web`: servicio web Node para Next.js.
- `parking-api`: servicio web Python para FastAPI.

Render no debe provisionar una base Postgres propia para este MVP porque
Supabase PostgreSQL sera la base principal.

Comandos esperados cuando exista scaffolding:

| Servicio | Build | Start |
| --- | --- | --- |
| Next.js | `npm ci && npm run build` | `npm run start` |
| FastAPI | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

Variables secretas en Render:

- `SUPABASE_SECRET_KEY`
- `SUPABASE_DB_URL`
- `API_DEVICE_TOKEN_ENTRY`
- `API_DEVICE_TOKEN_EXIT`

Variables publicas o no secretas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_API_BASE_URL`
- `ALLOWED_ORIGINS`

Validacion futura:

- `render blueprints validate` cuando exista `render.yaml`.
- Verificar que FastAPI escuche en `0.0.0.0:$PORT`.
- Verificar `GET /health` despues del despliegue.
- Revisar logs de Render si el servicio no arranca.

## 14. Relacion con diagramas existentes

Los diagramas en `docs/` quedan reflejados asi:

- Logica de entrada:
  - Deteccion por sensor IR.
  - Validacion de capacidad.
  - Generacion de ticket.
  - Almacenamiento en base de datos.
  - Apertura de barrera.
- Logica de salida:
  - Captura manual de codigo.
  - Consulta de ticket en backend/base.
  - Validacion de pago.
  - Bloqueo con LCD, LED o buzzer cuando no esta pagado.
  - Apertura de barrera cuando esta pagado.
- Logica de pagos:
  - Consulta de ticket.
  - Calculo de precio.
  - Aplicacion opcional de descuentos.
  - Pago simulado sin pasarela externa.
  - Actualizacion de estado pagado.
- Arquitectura:
  - Arduino C/C++.
  - FastAPI.
  - Supabase PostgreSQL.
  - Navegador web para operador/administrador.

La imagen nueva de funcionamiento de maqueta se interpreta como referencia
visual del flujo fisico, pero se ajusta eliminando cualquier dependencia de
camara o placa.

## 15. Criterios de validacion documental

- El sistema puede operar con codigo de ticket como unico identificador.
- No existe ningun campo obligatorio de placa en el modelo de datos.
- La entrada valida capacidad antes de emitir ticket.
- La salida valida pago antes de abrir barrera.
- La tolerancia gratuita de 5 minutos esta documentada.
- Los incrementos por tiempo son configurables.
- La tarifa de extravio es configurable.
- El pago simulado no depende de Stripe ni de otra pasarela externa.
- Los descuentos de adulto mayor y estudiante estan documentados.
- La ayuda del sistema esta documentada como FAQ estatico.
- Los backups se describen como manuales.
- Render se describe con servicios separados y Supabase como base principal.

## 16. Referencias oficiales

- [Supabase SSR/Auth para Next.js](https://supabase.com/docs/guides/auth/server-side)
- [Supabase Next.js quickstart](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Supabase uso de secret key en servidor](https://supabase.com/docs/guides/troubleshooting/performing-administration-tasks-on-the-server-side-with-the-servicerole-secret-BYM4Fa)
- [Render Blueprint YAML](https://render.com/docs/blueprint-spec)
- [Render FastAPI deploy](https://render.com/docs/deploy-fastapi)
