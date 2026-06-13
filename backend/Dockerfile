# =============================================================================
# Imagen del backend FastAPI (modo Docker LOCAL)
# =============================================================================
# Replica el contrato de despliegue de Render:
#   build  -> pip install .
#   start  -> python -m app.db.migrate && uvicorn app.main:app
# La misma imagen la reutiliza el servicio `scheduler` (cambia solo el command).
# =============================================================================
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Copiamos el proyecto e instalamos como en Render (`pip install .`).
COPY . .
RUN pip install .

EXPOSE 8000

# Las migraciones corren en el arranque (idempotente, igual que en Render).
# `alembic.ini` se resuelve por WORKDIR=/app (migrate.py usa Config("alembic.ini")).
CMD ["sh", "-c", "python -m app.db.migrate && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
