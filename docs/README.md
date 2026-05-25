# Documentacion del Sistema de Estacionamiento

Este directorio concentra la documentacion tecnica del MVP del sistema de
estacionamiento inteligente.

## Documentos principales

- [Especificacion del sistema de estacionamiento](./especificacion-sistema-estacionamiento.md)
- [Diagrama de flujo de Arduino](./Diagrama%20de%20flujo%20de%20Arduino.pdf)
- [Planificacion frontend SDD](./planificacion-frontend-sdd.md)
- [Plan tecnico frontend](./superpowers/plans/2026-05-25-frontend-dashboard-pago.md)
- [Plan backend FastAPI SDD](./plan-backend-fastapi-sdd.md)
- [Plan Arduino SDD](./plan-arduino-sdd.md)

## Material de referencia local

- [Diagrama de flujo de Arduino](./Diagrama%20de%20flujo%20de%20Arduino.pdf)
- [Capturas de flujos y arquitectura](./caps/)

## Alcance actual

- El entregable actual es documental; no incluye scaffolding de Next.js,
  FastAPI, Supabase ni Render.
- El identificador operativo del sistema sera el codigo de ticket.
- No se manejan placas de vehiculo porque el sistema no incluye camara.
- Stripe queda solo como experiencia visual y pago simulado en esta fase.
- Los backups se plantean como exportacion manual desde el dashboard.
