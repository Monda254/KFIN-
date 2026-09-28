# KFIN Phase 0 Development Setup

## Prerequisites

- Node.js 24
- pnpm compatible with the workspace lockfile
- Access to the authorized KFIN repository
- PostgreSQL only when database-backed work is explicitly introduced

## Install

```bash
pnpm install --frozen-lockfile
cp .env.example .env
```

Do not add real credentials to `.env` or commit it. Use workspace secret management for secrets.

## Start

The managed preview workflows start the console and API with the correct routing configuration:

```bash
pnpm --filter @workspace/kfin-console run dev
pnpm --filter @workspace/api-server run dev
```

The console is the Phase 0 status surface. The API health endpoint is available at `/api/healthz`.

## Checks

```bash
pnpm run format:check
pnpm run typecheck
pnpm run build
pnpm run security:secrets
pnpm run quality:ci
```

Run API code generation after changing `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Database

Phase 0 contains no business tables. When a later approved phase adds a schema, document the migration and use the development-only push command:

```bash
pnpm --filter @workspace/db run push
```

Never use real forensic or personal data as fixtures.

## Troubleshooting

- If a preview is blank, check that its managed workflow is running and inspect the workflow logs.
- If generated types are stale, rerun API code generation, then `pnpm run typecheck:libs`.
- If a quality gate fails, fix the underlying issue; do not remove or bypass the gate.