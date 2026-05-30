# Pagos Simulados, Descuentos y Ayuda

Este documento define la version vigente para pagos, descuentos y ayuda del
sistema de estacionamiento. Reemplaza la idea previa de usar Stripe como
experiencia visual. En esta version no hay pasarela externa: todo pago es
simulado, controlado por FastAPI y registrado en la base de datos.

## 1. Estado verificado del proyecto

El proyecto ya contiene una base funcional para estos flujos:

- Backend FastAPI con rutas publicas de ticket y pago:
  - `GET /api/v1/public/tickets/{code}`
  - `POST /api/v1/public/tickets/{code}/calculate`
  - `POST /api/v1/public/payments/simulate`
- Backend con calculo de tarifa por tolerancia, bloques y ticket extraviado.
- Backend con registro de pago simulado y marcado de ticket como pagado.
- Dashboard con reportes de tickets, pagos, eventos, tarifas, backups y
  configuracion.
- Frontend Next.js con flujo publico `/pagar`, resumen, checkout simulado y
  confirmacion.

La implementacion actual todavia usa nombres heredados como
`simulated_stripe` y `provider_reference`. La nueva documentacion define los
nombres vigentes `simulated_payment` y `simulation_reference`; el backend debe
aceptar temporalmente los nombres heredados para no romper datos existentes.

## 2. Pago simulado puro

Reglas obligatorias:

- No se integra Stripe ni otra pasarela real.
- No se solicitan tarjetas, CVV, cuentas bancarias ni datos financieros reales.
- No se usan variables `STRIPE_*`.
- El usuario solo confirma una simulacion de pago.
- FastAPI calcula el monto final en servidor.
- El frontend nunca puede decidir el total a pagar.
- Al confirmar, se crea un registro en `payments` con estado `simulated`.
- Si el usuario cancela el checkout, no se crea pago y el ticket queda sin
  cambios.

Metodo vigente:

```text
simulated_payment
```

Metodos de pago permitidos:

| Metodo | Uso |
| --- | --- |
| `simulated_payment` | Pago publico simulado normal. |
| `manual_admin` | Pago registrado por operador o administrador. |
| `lost_ticket` | Pago simulado asociado a ticket extraviado. |
| `simulated_stripe` | Alias legado aceptado solo por compatibilidad. |

La UI debe mostrar `simulated_stripe` como `Pago simulado legado` si aparece en
reportes historicos. No debe mostrarse como marca principal del flujo.

## 3. Descuentos

El sistema tendra descuentos simulados para adultos mayores y estudiantes.
Estos descuentos no requieren validacion con servicios externos.

### 3.1 Tipos

| Tipo | Requisito | Descuento inicial |
| --- | --- | --- |
| `none` | Sin descuento. | 0% |
| `senior` | Edad declarada de 65 anios o mas y referencia INAPAM. | 50% |
| `student` | Correo escolar con dominio permitido. | 50% |

Solo se puede aplicar un descuento por pago. Si el usuario cambia el tipo de
descuento, el frontend debe volver a solicitar el calculo al backend.

### 3.2 Adulto mayor

Reglas:

- La edad declarada debe ser mayor o igual a 65.
- El documento principal sera INAPAM.
- El sistema puede capturar tipo de documento y ultimos 4 caracteres o folio
  parcial.
- No se suben imagenes ni archivos del documento.
- La evidencia guardada debe ser parcial, por ejemplo:

```json
{
  "document_type": "INAPAM",
  "document_last4": "1234"
}
```

### 3.3 Estudiante

Reglas:

- El usuario captura un correo escolar.
- El backend valida el dominio contra una lista configurable.
- Dominios iniciales sugeridos:
  - `.edu`
  - `.edu.mx`
- El sistema debe permitir agregar dominios escolares locales desde Tarifas o
  configuracion administrativa.
- No se envia correo de verificacion en el MVP.

### 3.4 Ticket extraviado y descuentos

Los descuentos sobre ticket extraviado son configurables.

Campos de configuracion:

| Campo | Default | Descripcion |
| --- | --- | --- |
| `senior_discount_applies_to_lost_ticket` | `false` | Permite descuento adulto mayor sobre cuota de extravio. |
| `student_discount_applies_to_lost_ticket` | `false` | Permite descuento estudiante sobre cuota de extravio. |

Si el flag correspondiente esta apagado, la cuota de extravio se cobra completa
aunque el usuario cumpla los requisitos del descuento.

## 4. Calculo de cobro

FastAPI debe calcular siempre el cobro final con esta secuencia:

1. Buscar ticket por codigo normalizado.
2. Calcular duracion desde `entry_at` hasta el momento actual.
3. Calcular `subtotal_amount`:
   - Si `lost_ticket = true`, usar `lost_ticket_fee`.
   - Si no es extravio y esta dentro de tolerancia, usar `0`.
   - Si excede tolerancia, usar bloques configurados.
4. Validar descuento solicitado.
5. Determinar si el descuento aplica al caso.
6. Calcular:

```text
discount_amount = floor(subtotal_amount * discount_percent / 100)
amount = subtotal_amount - discount_amount
```

7. Guardar `duration_minutes`, `subtotal_amount`, `discount_amount` y `amount`
   al registrar el pago.

El calculo usa enteros en MXN para mantener compatibilidad con el modelo actual.

## 5. Modelo de datos esperado

### 5.1 `pricing_rules`

Agregar campos:

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `senior_discount_percent` | Integer | Porcentaje para adulto mayor. Default `50`. |
| `student_discount_percent` | Integer | Porcentaje para estudiante. Default `50`. |
| `student_allowed_domains` | JSON/Text array | Dominios validos para correo escolar. |
| `senior_discount_applies_to_lost_ticket` | Boolean | Aplica adulto mayor a extravio. |
| `student_discount_applies_to_lost_ticket` | Boolean | Aplica estudiante a extravio. |

### 5.2 `payments`

Agregar o ajustar campos:

| Campo | Tipo sugerido | Descripcion |
| --- | --- | --- |
| `subtotal_amount` | Integer | Monto antes de descuento. |
| `discount_type` | Text | `none`, `senior` o `student`. |
| `discount_percent` | Integer | Porcentaje aplicado. |
| `discount_amount` | Integer | Monto descontado. |
| `amount` | Integer | Total final registrado. |
| `simulation_reference` | Text | Referencia interna simulada. |
| `discount_evidence` | JSONB nullable | Evidencia parcial, sin imagenes ni datos sensibles completos. |

`provider_reference` queda como nombre legado si ya existe en la base. La UI
nueva debe preferir `simulation_reference`.

## 6. Contrato API

### 6.1 Calcular ticket

Ruta:

```http
POST /api/v1/public/tickets/{code}/calculate
```

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

Request adulto mayor:

```json
{
  "lost_ticket": false,
  "discount": {
    "type": "senior",
    "senior_age": 68,
    "senior_document_type": "INAPAM",
    "senior_document_last4": "1234"
  }
}
```

Respuesta:

```json
{
  "ticket_code": "A1B2C",
  "duration_minutes": 64,
  "free_tolerance_minutes": 5,
  "subtotal_amount": 20,
  "discount_type": "student",
  "discount_percent": 50,
  "discount_amount": 10,
  "amount": 10,
  "currency": "MXN",
  "lost_ticket_discount_applied": false
}
```

### 6.2 Registrar pago simulado

Ruta:

```http
POST /api/v1/public/payments/simulate
```

Request:

```json
{
  "ticket_code": "A1B2C",
  "lost_ticket": false,
  "method": "simulated_payment",
  "discount": {
    "type": "student",
    "student_email": "alumno@escuela.edu.mx"
  }
}
```

Respuesta:

```json
{
  "payment_id": "uuid",
  "ticket_code": "A1B2C",
  "status": "simulated",
  "subtotal_amount": 20,
  "discount_type": "student",
  "discount_amount": 10,
  "amount": 10,
  "simulation_reference": "sim_payment_A1B2C_20260530_001"
}
```

Errores esperados:

| Error | Cuando ocurre |
| --- | --- |
| `ticket_not_found` | El codigo no existe. |
| `ticket_not_active` | El ticket ya salio o fue cancelado. |
| `invalid_discount` | Faltan datos o no cumplen requisitos. |
| `discount_not_allowed_for_lost_ticket` | El descuento no aplica a extravio segun configuracion. |
| `payment_required` | La salida intenta abrir sin pago valido. |

## 7. Frontend esperado

### 7.1 Flujo publico

Rutas:

- `/pagar`
- `/pagar/[code]`
- `/pagar/[code]/checkout`
- `/pagar/[code]/confirmacion`
- `/ticket-extraviado`
- `/ayuda`

Comportamiento:

1. El usuario consulta su ticket.
2. El resumen muestra duracion, subtotal, descuento y total.
3. El usuario puede seleccionar:
   - Sin descuento.
   - Adulto mayor.
   - Estudiante.
4. El frontend vuelve a calcular el monto cuando cambia el descuento.
5. El checkout muestra claramente que es pago simulado.
6. El boton `Confirmar pago simulado` registra el pago.
7. El boton `Cancelar` vuelve al resumen y no registra pago.
8. La confirmacion indica que el usuario ya puede ingresar el codigo en salida.

### 7.2 Dashboard

Cambios esperados:

- En Pagos:
  - Mostrar metodo como `Pago simulado`.
  - Mostrar subtotal, descuento y total.
  - Permitir filtrar por descuento.
  - Mostrar `simulated_stripe` como `Pago simulado legado`.
- En Tarifas:
  - Editar porcentajes de adulto mayor y estudiante.
  - Editar dominios escolares permitidos.
  - Configurar si cada descuento aplica a ticket extraviado.
- En Reportes:
  - Incluir total descontado.
  - Incluir cantidad de pagos con descuento por tipo.

## 8. Sistema de ayuda

El MVP usara ayuda estatica, no administrable en base de datos.

Ubicacion:

- Ruta publica: `/ayuda`.
- Enlace visible desde flujo de pago.
- Enlace visible desde dashboard.

Preguntas minimas:

### Que es un pago simulado?

Es un registro interno que marca el ticket como pagado sin hacer un cargo real.
No se usan tarjetas ni bancos.

### Que necesito para pagar?

Solo el codigo del ticket entregado en la entrada.

### Que pasa si cancelo el pago?

No se registra ningun pago y el ticket sigue pendiente.

### Como funciona el descuento de adulto mayor?

El usuario declara edad de 65 anios o mas y captura una referencia parcial de
INAPAM. El sistema aplica el porcentaje configurado.

### Como funciona el descuento de estudiante?

El usuario captura un correo escolar. El backend valida que el dominio este en
la lista permitida.

### Puedo usar dos descuentos?

No. Solo se aplica un descuento por pago.

### El descuento aplica a ticket extraviado?

Depende de la configuracion en Tarifas. El administrador puede activarlo o
desactivarlo por tipo de descuento.

### Que hace el boton Consultar ticket?

Busca el codigo en el backend y muestra estado, tiempo acumulado y monto.

### Que hace el boton Confirmar pago simulado?

Registra el pago simulado en la base de datos y marca el ticket como pagado.

### Que hago despues de pagar?

Ingresar el mismo codigo de ticket en la caseta de salida.

## 9. Criterios de aceptacion

- Las docs principales ya no presentan Stripe como parte del MVP.
- El metodo vigente documentado es `simulated_payment`.
- `simulated_stripe` queda solo como compatibilidad legado.
- Los descuentos de adulto mayor y estudiante quedan definidos al 50% inicial.
- Adulto mayor usa INAPAM como referencia principal.
- Estudiante usa correo escolar validado por dominios configurables.
- Los descuentos sobre extravio son configurables.
- El sistema de ayuda queda definido como FAQ estatico.
- El pago cancelado no modifica el ticket ni crea registro de pago.
- La salida de Arduino sigue dependiendo solo de que el ticket este pagado,
  exento o dentro de tolerancia.
