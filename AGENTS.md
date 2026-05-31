# AGENTS.md

Guidance for coding agents operating in `E:\Estacionamiento-Arduino`.

## Repository layout

- `backend/`: FastAPI + SQLAlchemy async API, Alembic migrations, pytest suite.
- `parking-web/`: Next.js 16 App Router frontend, Chakra UI, Vitest + Playwright.
- `entrada/` and `salida/`: Arduino sketches (`.ino`) plus Wi-Fi credentials headers.
- `render.yaml`: deployment contract for backend and frontend services.

## Tech stack and versions

- Backend: Python `>=3.13`, FastAPI, SQLAlchemy asyncio, Alembic, PyJWT.
- Frontend: Next.js `16.2.6`, React `19.2.4`, TypeScript strict mode.
- UI: Chakra UI v3 + custom theme tokens (`ops*` naming).
- Testing: pytest (backend), Vitest + Testing Library (frontend), Playwright (E2E).

## Mandatory project rule (existing local AGENTS)

The frontend already includes a local rule in `parking-web/AGENTS.md`:

> This is NOT the Next.js you know. This version has breaking changes — APIs,
> conventions, and file structure may differ from training data. Read relevant
> guides in `node_modules/next/dist/docs/` before coding and heed deprecations.

Always honor this when editing `parking-web/`.

## Cursor/Copilot rules status

- `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- `.github/copilot-instructions.md`: not present.
- If these files are added later, treat them as highest-priority repo guidance.

## Setup commands

### Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e .[dev]
```

Notes:

- `pip install .` is used in deployment (`render.yaml`).
- Use editable install with `[dev]` for local lint/test tools.

### Frontend setup

```bash
cd parking-web
npm ci
```

Use `npm ci` for reproducible installs (matches deployment flow).

## Build, lint, and test commands

### Frontend (`parking-web`)

- Dev server: `npm run dev`
- Production build: `npm run build`
- Production start: `npm run start`
- Lint: `npm run lint`
- Unit/integration tests (Vitest): `npm run test`
- Test watch mode: `npm run test:watch`
- E2E tests: `npm run e2e`

Run one Vitest file:

```bash
npx vitest run src/lib/formatters.test.ts
```

Run one Vitest test by name:

```bash
npx vitest run src/lib/formatters.test.ts -t "formats"
```

Run one Playwright spec:

```bash
npx playwright test e2e/payment-flow.spec.ts
```

Run one Playwright test by title:

```bash
npx playwright test e2e/payment-flow.spec.ts -g "pagar"
```

### Backend (`backend`)

- App (local): `uvicorn app.main:app --reload`
- Apply migrations to head: `python -m app.db.migrate`
- Run tests: `pytest`
- Lint: `ruff check .`
- Format check (optional but recommended): `ruff format --check .`
- Auto-format: `ruff format .`

Run one pytest file:

```bash
pytest tests/unit/test_health.py
```

Run one pytest test node:

```bash
pytest tests/unit/test_health.py::test_health_returns_ok
```

Run tests by keyword:

```bash
pytest -k "pricing and not integration"
```

### Arduino sketches

- No standardized build/test command is defined in this repo.
- Treat `entrada/` and `salida/` as manually built via Arduino IDE/CLI.
- Do not commit real credentials in `wifi_credentials.h`.

## Code style guidelines

## General

- Prefer small, focused changes; follow existing module boundaries.
- Avoid introducing new dependencies unless necessary.
- Keep secrets out of code and tests; use env vars and `.env.example` patterns.
- Preserve existing language conventions per subproject.

## Python (backend)

- Line length: 100 (`[tool.ruff] line-length = 100`).
- Target runtime: Python 3.13.
- Ruff lint rules enabled: `E`, `F`, `I`, `B`, `UP` (`B008` ignored).
- Use type hints everywhere (function args/returns, typed collections).
- Keep imports grouped and sorted (stdlib, third-party, local).
- Naming: `snake_case` for functions/variables/modules, `PascalCase` for classes.
- Prefer explicit domain errors (`AppError`) over generic `Exception` for API flows.
- Return structured JSON errors using the existing error handler pattern.
- Use async SQLAlchemy sessions through dependency/context helpers; avoid ad-hoc engines.
- Keep service logic in `app/services`, DB access in `app/repositories`, schemas in `app/schemas`.

## TypeScript/React (parking-web)

- TypeScript is strict; avoid `any` unless unavoidable and localized.
- Prefer explicit exported types for API payloads (`src/lib/api/types.ts`).
- Use `@/*` alias for imports rooted at `src`.
- Keep imports clean and grouped; avoid deep relative chains when alias works.
- Naming: `PascalCase` components, `camelCase` functions/variables, kebab-free file names already follow component names.
- Prefer function components and named exports (consistent with current code).
- Keep server/client boundaries explicit (`"use client"` only where required).
- Reuse Chakra theme tokens (`opsBg`, `opsPanel`, etc.) instead of hardcoded colors.
- Use semantic, composable UI pieces under `src/components/*`.
- API helpers (`apiGet/apiPost/apiPut`) should throw actionable errors on non-OK responses.

## Testing conventions

- Backend tests live in `backend/tests/unit` and `backend/tests/integration`.
- Frontend unit tests live next to libs/components or under `src`, using Vitest + jsdom.
- E2E tests live in `parking-web/e2e` and rely on Playwright `webServer` config.
- For bug fixes, add or update a focused regression test first when practical.

## Environment and config

- Backend settings are env-driven (`app.core.config.get_settings` cache is used in tests).
- Frontend requires:
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Keep `.env` local; never commit production secrets.

## Change safety checklist for agents

- Run the smallest relevant test scope first (single test/file), then broader suites.
- Run lint for the touched subproject before finalizing.
- Do not edit generated directories like `parking-web/.next/`.
- Respect deployment assumptions in `render.yaml` when changing startup/build paths.
- If modifying migrations, ensure Alembic revision consistency tests still pass.

## Quick command reference

- Frontend lint: `cd parking-web && npm run lint`
- Frontend tests: `cd parking-web && npm run test`
- Frontend one test: `cd parking-web && npx vitest run src/lib/formatters.test.ts -t "formats"`
- Frontend E2E one spec: `cd parking-web && npx playwright test e2e/payment-flow.spec.ts`
- Backend lint: `cd backend && ruff check .`
- Backend tests: `cd backend && pytest`
- Backend one test: `cd backend && pytest tests/unit/test_health.py::test_health_returns_ok`
