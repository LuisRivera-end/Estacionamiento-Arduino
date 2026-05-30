# Planificacion Frontend SDD

## 1. Proposito

Este documento define la planificacion del diseno frontend mediante SDD
(Spec-Driven Development) para el MVP del sistema de estacionamiento
inteligente.

La implementacion futura debe seguir esta especificacion antes de crear codigo.
El objetivo es construir una interfaz operativa, densa y clara, alineada con la
documentacion tecnica del proyecto y con los flujos de entrada, salida, pago
simulado, reportes, backups y configuracion descritos en
`docs/especificacion-sistema-estacionamiento.md`.

## 2. Alcance Frontend

El frontend se divide en dos superficies independientes:

1. Dashboard administrativo autenticado.
2. Flujo publico de pago simulado por codigo de ticket.

Queda fuera de alcance:

- Cobro real con pasarelas externas.
- Captura o almacenamiento de placas.
- Funciones basadas en camara.
- Backups programados automaticos.
- Operaciones privilegiadas directas desde el cliente web.

## 3. Direccion Visual Aprobada

La direccion aprobada es un centro operativo oscuro.

Principios:

- Apariencia de sala de control, no landing page.
- Alta densidad de informacion sin perder lectura.
- Estado real del estacionamiento visible en la primera pantalla.
- Colores funcionales para estados: verde para autorizado, rojo para bloqueo,
  amarillo para advertencia, azul o cyan para informacion tecnica.
- Pagos simulados siempre identificados visualmente como simulados.
- Descuentos visibles antes de confirmar pago: adulto mayor y estudiante.
- Ayuda disponible desde flujo publico y dashboard.
- Graficas y tablas como elementos principales, no decorativos.
- Componentes sobrios, con bordes definidos, fondos oscuros y acentos luminosos.

Personalidad visual:

- Industrial, tecnico y operativo.
- Layout oscuro con tarjetas de datos, panel lateral fijo y tablas compactas.
- Uso moderado de animaciones: entrada suave de tarjetas, hover en filas,
  transiciones de estado y feedback en acciones criticas.
- Evitar estetica generica de dashboard blanco o landing de marketing.

## 4. Stack Frontend Esperado

Segun la documentacion del proyecto:

- Framework: Next.js.
- UI: Chakra UI.
- Graficas: `@chakra-ui/charts` y Recharts.
- Autenticacion: Supabase Auth con sesiones server-side usando cookies.
- Comunicacion operativa: FastAPI mediante `NEXT_PUBLIC_API_BASE_URL`.
- Despliegue objetivo: Render como servicio `parking-web`.

Regla de seguridad:

- El cliente web solo puede usar `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `NEXT_PUBLIC_API_BASE_URL`.
- La llave secreta de Supabase nunca debe exponerse en el frontend.
- Las operaciones administrativas deben pasar por FastAPI cuando requieran
  permisos elevados.

## 5. Usuarios y Necesidades

### 5.1 Administrador

Necesita monitorear el estado general, revisar ingresos simulados, exportar
reportes, ajustar tarifas, solicitar backups y configurar capacidad, moneda,
zona horaria e identificadores de dispositivos.

### 5.2 Operador

Necesita consultar tickets, validar entradas y salidas, revisar bloqueos por
pago pendiente y apoyar casos de ticket extraviado.

### 5.3 Usuario con ticket

Necesita ingresar su codigo, consultar monto, confirmar un pago simulado y
obtener una confirmacion clara para poder salir del estacionamiento.

## 6. Mapa de Rutas

### 6.1 Rutas Publicas

| Ruta | Vista | Proposito |
| --- | --- | --- |
| `/pagar` | Consulta de ticket | Permite ingresar el codigo de ticket. |
| `/pagar/[code]` | Resumen de cobro | Muestra estado, duracion, monto y accion de pago. |
| `/pagar/[code]/checkout` | Checkout simulado | Presenta pago simulado sin cobro real ni datos bancarios. |
| `/pagar/[code]/confirmacion` | Confirmacion | Informa que el pago fue registrado como simulado. |
| `/ticket-extraviado` | Pago por extravio | Permite iniciar el flujo cuando el usuario no tiene codigo. |
| `/ayuda` | Ayuda | Preguntas frecuentes sobre pago, descuentos, ticket extraviado y botones. |

### 6.2 Rutas Autenticadas

| Ruta | Vista | Proposito |
| --- | --- | --- |
| `/login` | Inicio de sesion | Acceso de administradores y operadores. |
| `/dashboard` | Resumen operativo | Estado actual del estacionamiento y metricas del dia. |
| `/dashboard/eventos` | Entradas y salidas | Tabla filtrable de eventos operativos. |
| `/dashboard/tickets` | Tickets | Busqueda y seguimiento por codigo. |
| `/dashboard/pagos` | Pagos simulados | Auditoria de pagos, metodos, estados y montos. |
| `/dashboard/tarifas` | Tarifas | Edicion de tolerancia, bloque, precio y extravio. |
| `/dashboard/reportes` | Reportes | Graficas y exportaciones PDF. |
| `/dashboard/backups` | Backups | Solicitud manual e historial de exportaciones. |
| `/dashboard/configuracion` | Configuracion | Capacidad, moneda, zona horaria y dispositivos. |

## 7. Layout Global

### 7.1 Dashboard Autenticado

Estructura:

- Sidebar fijo con navegacion principal.
- Header superior con estado de API, usuario autenticado y zona horaria.
- Contenido central con tarjetas, tablas y graficas.
- Panel de alerta contextual para eventos criticos.

Navegacion principal:

1. Resumen.
2. Eventos.
3. Tickets.
4. Pagos.
5. Tarifas.
6. Reportes.
7. Backups.
8. Configuracion.

Indicadores persistentes:

- Ocupacion actual.
- Capacidad disponible.
- Estado de API.
- Ultima actualizacion.
- Badge de entorno: desarrollo, demo o produccion.

### 7.2 Flujo Publico de Pago

Estructura:

- Pantalla centrada, simple y guiada.
- Card principal con codigo de ticket, monto y estado.
- Barra de pasos: consultar, revisar, simular pago, confirmar.
- Aviso visible: "Pago simulado, no se realiza cargo real".
- Acciones grandes y claras para usuarios no tecnicos.

## 8. Vistas del Dashboard

### 8.1 Login

Objetivo:

- Permitir acceso a operadores y administradores mediante Supabase Auth.

Contenido:

- Formulario de correo y contrasena.
- Mensajes de error claros.
- Indicador de conexion con Supabase.

Estados:

- Cargando sesion.
- Credenciales invalidas.
- Usuario autenticado y redireccion a `/dashboard`.

### 8.2 Resumen Operativo

Objetivo:

- Mostrar el estado real del estacionamiento en la primera pantalla.

Contenido principal:

- Ocupacion actual.
- Capacidad disponible.
- Entradas de hoy.
- Salidas de hoy.
- Tickets activos.
- Tickets pagados.
- Tickets extraviados.
- Ingresos simulados del dia.

Graficas:

- Ocupacion por hora.
- Entradas vs salidas del dia.
- Distribucion de tickets por estado.

Paneles de atencion:

- Ultimo intento de salida bloqueado.
- Ultimo pago simulado.
- Ultima entrada registrada.
- Ultima salida autorizada.

APIs sugeridas:

- `GET /status`.
- `GET /reports/summary`.
- `GET /reports/revenue`.

### 8.3 Entradas y Salidas

Objetivo:

- Revisar la actividad operativa generada por Arduino y FastAPI.

Contenido:

- Tabla de eventos con fecha, tipo, ticket, dispositivo, resultado y mensaje.
- Filtros por rango de fechas.
- Filtro por tipo: entrada, salida, bloqueo, error.
- Busqueda por codigo de ticket.

Estados destacados:

- Entrada autorizada.
- Salida autorizada.
- Salida bloqueada por pago pendiente.
- Estacionamiento lleno.

APIs sugeridas:

- `GET /reports/tickets`.
- Fuente futura desde `audit_logs` si FastAPI expone endpoint dedicado.

### 8.4 Tickets

Objetivo:

- Consultar y auditar tickets por codigo.

Contenido:

- Buscador prominente por codigo de ticket.
- Tabla de tickets con estado, pago, entrada, salida, duracion y monto.
- Drawer o detalle lateral para un ticket seleccionado.

Detalle de ticket:

- Codigo.
- Estado operativo.
- Estado de pago.
- Entrada.
- Pago.
- Salida.
- Duracion.
- Monto calculado.
- Marcador de extravio.

APIs sugeridas:

- `GET /tickets/{code}`.
- `POST /tickets/{code}/calculate`.
- `GET /reports/tickets`.

### 8.5 Pagos Simulados

Objetivo:

- Auditar pagos simulados registrados sin pasarela externa.

Contenido:

- Tabla de pagos con ticket, monto, metodo, estado, referencia simulada y fecha.
- Badge permanente "Simulado".
- Resumen de ingresos por dia.
- Filtros por fecha, metodo y estado.

Reglas visuales:

- Ningun texto debe sugerir que se hizo un cargo real.
- El metodo vigente `simulated_payment` debe mostrarse como "Pago simulado".
- El metodo legado `simulated_stripe` debe mostrarse como "Pago simulado legado".
- El metodo `lost_ticket` debe marcarse como caso de extravio.

APIs sugeridas:

- `GET /reports/revenue`.
- Endpoint futuro para listado de pagos si se separa de reportes.

### 8.6 Tarifas

Objetivo:

- Configurar las reglas de cobro usadas por FastAPI.

Contenido:

- Tolerancia gratuita en minutos.
- Duracion del bloque en minutos.
- Precio por bloque.
- Tarifa por ticket extraviado.
- Descuento adulto mayor.
- Descuento estudiante.
- Dominios escolares permitidos.
- Aplicacion de descuentos a ticket extraviado.
- Estado de regla activa.
- Historial de cambios desde auditoria.

Validaciones:

- La tolerancia debe ser mayor o igual a `0`.
- El bloque debe ser mayor a `0`.
- Los montos deben ser mayores o iguales a `0`.
- La moneda visible debe venir de configuracion.

APIs sugeridas:

- Endpoint futuro para `pricing_rules`.
- Registro de cambios en `audit_logs`.

### 8.7 Reportes

Objetivo:

- Visualizar actividad e ingresos y exportar informacion a PDF.

Contenido:

- Selector de rango: hoy, semana, mes, personalizado.
- Grafica de ingresos simulados.
- Grafica de entradas vs salidas.
- Grafica de tickets extraviados por periodo.
- Grafica de distribucion por estado.
- Acciones de exportacion PDF.

Exportaciones:

- Ingresos.
- Tickets.
- Actividad operativa.

APIs sugeridas:

- `GET /reports/summary`.
- `GET /reports/revenue`.
- `GET /reports/tickets`.
- `POST /reports/export/pdf`.

### 8.8 Backups

Objetivo:

- Permitir backup manual y revisar historial.

Contenido:

- Boton principal "Solicitar backup manual".
- Confirmacion antes de ejecutar.
- Historial con estado: solicitado, completado, fallido.
- Fecha de solicitud y finalizacion.
- Usuario solicitante.

Estados:

- Solicitando.
- Backup solicitado.
- Backup completado.
- Backup fallido.

APIs sugeridas:

- `POST /backups/export`.
- Endpoint futuro para listar `backup_exports`.

### 8.9 Configuracion

Objetivo:

- Ajustar datos operativos del estacionamiento.

Contenido:

- Capacidad total.
- Zona horaria.
- Moneda.
- Identificador de caseta de entrada.
- Identificador de caseta de salida.

Validaciones:

- Capacidad total debe ser mayor a `0`.
- Moneda inicial sugerida: `MXN`.
- Zona horaria inicial sugerida: `America/Mexico_City`.
- Los identificadores deben coincidir con los usados por Arduino y FastAPI.

APIs sugeridas:

- Endpoint futuro para `parking_settings`.
- Endpoint futuro para dispositivos si se separa la configuracion.

## 9. Vistas Publicas de Pago Simulado

### 9.1 Consulta de Ticket

Ruta:

- `/pagar`.

Objetivo:

- Permitir que el usuario ingrese el codigo de ticket.

Contenido:

- Input de codigo.
- Boton "Consultar ticket".
- Enlace "Perdi mi ticket".
- Aviso de pago simulado.

Reglas:

- El codigo de ticket es el identificador principal.
- No pedir placa.
- No pedir datos bancarios.
- La validacion visual debe aceptar codigos alfanumericos.
- La implementacion inicial puede guiar al usuario hacia 5 caracteres porque la
  seccion 4.5 de la especificacion indica tickets de 5 digitos alfanumericos.
- Si el backend devuelve o acepta codigos mas largos, la UI no debe truncarlos.

APIs sugeridas:

- `GET /tickets/{code}`.

### 9.2 Resumen de Cobro

Ruta:

- `/pagar/[code]`.

Objetivo:

- Mostrar el estado del ticket y el monto calculado.

Contenido:

- Codigo de ticket.
- Estado del ticket.
- Estado de pago.
- Hora de entrada.
- Duracion.
- Tolerancia gratuita.
- Monto a pagar.
- Moneda.

Acciones:

- Continuar a checkout simulado.
- Volver a ingresar codigo.

APIs sugeridas:

- `GET /tickets/{code}`.
- `POST /tickets/{code}/calculate`.

### 9.3 Checkout Simulado

Ruta:

- `/pagar/[code]/checkout`.

Objetivo:

- Presentar una experiencia de pago simulado sin procesar cobro real.

Contenido:

- Resumen del ticket.
- Subtotal, descuento y monto final.
- Metodo mostrado como "Pago simulado".
- Aviso prominente: "No se usaran tarjetas reales".
- Boton "Confirmar pago simulado".
- Boton "Cancelar" para volver al resumen sin registrar pago.

Reglas:

- No pedir tarjeta.
- No pedir CVV.
- No usar llaves reales de pasarelas externas.
- La confirmacion debe llamar a `POST /payments/simulate`.

API:

- `POST /payments/simulate`.

### 9.4 Confirmacion

Ruta:

- `/pagar/[code]/confirmacion`.

Objetivo:

- Informar que el ticket quedo pagado para salida.

Contenido:

- Codigo de ticket.
- Estado: pago simulado registrado.
- Referencia simulada.
- Mensaje: "Ya puedes ingresar el codigo en la salida".
- Recomendacion de conservar el codigo.

### 9.5 Ticket Extraviado

Ruta:

- `/ticket-extraviado`.

Objetivo:

- Resolver casos sin codigo de ticket con tarifa de extravio.

Contenido:

- Explicacion breve.
- Monto de tarifa por extravio.
- Confirmacion de pago simulado por extravio.
- Aviso de que quedara marcado para reportes y auditoria.

Reglas:

- No inventar codigo en el cliente.
- FastAPI debe registrar el caso como extravio.
- El dashboard debe reflejar el evento en reportes y auditoria.

API:

- `POST /payments/simulate` con `lost_ticket: true`.

### 9.6 Ayuda

Ruta:

- `/ayuda`.

Objetivo:

- Explicar como funciona el sistema, que hace cada boton principal y como se
  aplican pagos simulados, descuentos y ticket extraviado.

Contenido minimo:

- Que es un pago simulado.
- Como consultar ticket.
- Como confirmar o cancelar pago.
- Como funciona descuento de adulto mayor.
- Como funciona descuento de estudiante.
- Cuando aplica descuento a ticket extraviado.
- Que hacer despues de pagar.

## 10. Componentes Base

Componentes compartidos:

- `AppShell`: estructura del dashboard autenticado.
- `SidebarNav`: navegacion principal.
- `TopStatusBar`: API, usuario, zona horaria y ultima actualizacion.
- `MetricCard`: tarjeta de metrica.
- `StatusBadge`: estados de ticket, pago, backup y API.
- `DataTable`: tabla con filtros, busqueda y paginacion.
- `DateRangeFilter`: filtro reusable de fechas.
- `TicketSearch`: busqueda por codigo.
- `SimulationNotice`: aviso permanente de pago simulado.
- `HelpLink`: acceso visible a preguntas frecuentes.
- `ConfirmActionDialog`: confirmaciones para backups y acciones sensibles.
- `EmptyState`: estado vacio con accion siguiente.
- `ErrorState`: error con mensaje accionable.
- `LoadingPanel`: carga de datos.
- `ChartCard`: contenedor para graficas Recharts.

Componentes publicos:

- `PaymentShell`: layout simple para pago.
- `PaymentStepIndicator`: pasos del flujo.
- `TicketCodeInput`: entrada de codigo.
- `PaymentSummaryCard`: resumen de cobro.
- `SimulatedCheckoutCard`: confirmacion visual tipo checkout.
- `PaymentConfirmationCard`: resultado final.

## 11. Estados de Interfaz

Cada vista debe contemplar:

- Loading inicial.
- Error de API.
- Sin datos.
- Datos disponibles.
- Accion exitosa.
- Accion fallida.
- Sesion expirada en vistas autenticadas.

Mensajes clave:

- `parking_full`: "Estacionamiento lleno".
- `payment_required`: "Pago pendiente".
- Ticket inexistente: "No encontramos ese codigo de ticket".
- API sin conexion: "No se pudo conectar con el servidor".
- Pago simulado exitoso: "Pago simulado registrado".

## 12. Datos por Vista

| Vista | Fuente principal | Frecuencia |
| --- | --- | --- |
| Resumen | `/status`, `/reports/summary` | Refresco manual o periodico corto. |
| Eventos | reportes y auditoria | Bajo demanda con filtros. |
| Tickets | `/tickets/{code}`, `/reports/tickets` | Bajo demanda. |
| Pagos | reportes de ingresos y pagos | Bajo demanda con filtros. |
| Tarifas | `pricing_rules` via API | Carga inicial y guardar cambios. |
| Reportes | `/reports/*` | Bajo demanda por rango. |
| Backups | `/backups/export`, historial | Bajo demanda. |
| Configuracion | `parking_settings` via API | Carga inicial y guardar cambios. |
| Pago publico | `/tickets/{code}`, calculate, simulate | Por pasos del usuario. |

## 13. Accesibilidad y Usabilidad

Requisitos:

- Contraste alto en tema oscuro.
- Navegacion por teclado en formularios, tablas y dialogs.
- Labels visibles para inputs.
- Estados no comunicados solo por color.
- Confirmaciones antes de acciones sensibles.
- Mensajes de error especificos, no genericos.
- Tablas con encabezados claros y fechas legibles.
- Fechas mostradas en zona horaria configurada.
- Montos siempre con moneda visible.

## 14. Orden Sugerido de Desarrollo

1. Base visual y layout global.
2. Autenticacion y proteccion de rutas.
3. Resumen operativo con datos simulados o fixtures.
4. Integracion con `GET /status`.
5. Busqueda de ticket y flujo publico `/pagar`.
6. Calculo y checkout simulado.
7. Tablas de tickets, eventos y pagos.
8. Reportes y graficas.
9. Tarifas y configuracion.
10. Backups manuales.
11. Pulido de estados, errores y accesibilidad.

## 15. Criterios de Aceptacion

El frontend cumple la planificacion cuando:

- La primera pantalla autenticada muestra el estado real del estacionamiento.
- El dashboard no solicita ni muestra placas como dato requerido.
- El flujo publico permite consultar y pagar mediante codigo de ticket.
- La salida del usuario queda desbloqueable despues del pago simulado.
- El pago aparece como simulado y no depende de Stripe.
- Las vistas administrativas cubren resumen, eventos, tickets, pagos, tarifas,
  reportes, backups y configuracion.
- Los reportes pueden exportarse a PDF cuando exista soporte en API.
- Los backups se solicitan manualmente desde dashboard.
- Las rutas autenticadas usan Supabase Auth server-side.
- Las operaciones privilegiadas no exponen secretos en el cliente.
- Los estados de error, carga y vacio estan definidos para todas las vistas.

## 16. Riesgos y Criterios de Resolucion

### 16.1 Longitud de codigo de ticket

La seccion de programacion Arduino indica 5 caracteres alfanumericos, mientras
algunos ejemplos de API usan codigos mas largos. Para el frontend se adopta una
validacion flexible:

- Guiar al usuario con ejemplo de 5 caracteres.
- Aceptar codigos alfanumericos de mayor longitud si FastAPI los acepta.
- No truncar ni transformar el codigo ingresado salvo normalizar mayusculas y
  quitar espacios externos.

### 16.2 Monto

La especificacion vigente usa `amount` y moneda `MXN`. La UI debe mostrar
montos con moneda visible y evitar asumir centavos si la API no los expone.

### 16.3 API Administrativa Pendiente de Contrato Final

Algunas vistas requieren contratos que aun no estan detallados, como listado de
pagos, configuracion, tarifas e historial de backups. La implementacion
frontend debe resolverlo asi:

- Crear servicios por dominio: tickets, pagos, reportes, tarifas, backups y
  configuracion.
- Mantener fixtures locales para desarrollo visual mientras FastAPI expone los
  contratos finales.
- Cambiar solo la capa de servicio cuando el contrato final exista.
- No acoplar componentes visuales directamente a `fetch` ni a rutas concretas
  que todavia no esten especificadas.

## 17. Entregables Frontend Posteriores

Cuando se pase de SDD a implementacion, se debera crear un plan tecnico con:

- Estructura de carpetas de Next.js.
- Componentes y responsabilidades por archivo.
- Contratos TypeScript de respuestas API.
- Fixtures para desarrollo visual.
- Pruebas de formularios y estados criticos.
- Pruebas de integracion del flujo publico de pago.
- Verificacion visual del dashboard en navegador.
