# Documentacion del Sistema de Estacionamiento

Este directorio concentra la documentacion tecnica del MVP del sistema de
estacionamiento inteligente.

## Documentos principales

- [Especificacion del sistema de estacionamiento](./especificacion-sistema-estacionamiento.md)
- [Pagos simulados, descuentos y ayuda](./pagos-descuentos-ayuda.md)
- [Diagrama de flujo de Arduino](./Diagrama%20de%20flujo%20de%20Arduino.pdf)
- [Planificacion frontend SDD](./planificacion-frontend-sdd.md)
- [Plan tecnico frontend](./superpowers/plans/2026-05-25-frontend-dashboard-pago.md)
- [Plan backend FastAPI SDD](./plan-backend-fastapi-sdd.md)
- [Plan Arduino SDD](./plan-arduino-sdd.md)

## Material de referencia local

- [Diagrama de flujo de Arduino](./Diagrama%20de%20flujo%20de%20Arduino.pdf)
- [Capturas de flujos y arquitectura](./caps/)

## Alcance actual

- El proyecto ya incluye base de backend FastAPI, frontend Next.js, flujos
  publicos de pago simulado y dashboard administrativo.
- El identificador operativo del sistema sera el codigo de ticket.
- No se manejan placas de vehiculo porque el sistema no incluye camara.
- Stripe ya no forma parte del MVP. El pago vigente es simulado puro mediante
  FastAPI y base de datos.
- Los descuentos vigentes son adulto mayor y estudiante, ambos con 50% inicial
  y configurables desde las reglas de tarifa.
- El sistema de ayuda se documenta como FAQ estatico para explicar flujo,
  botones, descuentos, ticket extraviado y salida.
- Los backups se plantean como exportacion manual desde el dashboard.
