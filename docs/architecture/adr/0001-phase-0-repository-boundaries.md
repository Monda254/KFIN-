# ADR-0001: Phase 0 Repository Boundaries

- **Status:** Accepted
- **Date:** 2026-09-19
- **Decision owners:** KFIN engineering governance
- **Affected components:** repository, frontend foundation, API foundation, database library, documentation, quality automation

## Context

KFIN needs a reproducible foundation before operational forensic capabilities are built. The repository must support clear ownership, isolated checks, controlled API contracts and later service growth without pretending that Phase 0 is an operational national system.

## Decision

Use the existing pnpm monorepo layout with:

- `artifacts/` for runnable applications and services;
- `lib/` for shared API, database and client packages;
- `docs/` for governance, architecture, development, operations and testing evidence;
- `scripts/` for repository validation;
- `tests/` for cross-package test intent;
- `infrastructure/` and `database/` for future deployment and migration boundaries.

The Phase 0 console is a governance and engineering-status surface. The API exposes only foundation health. No business-domain tables or operational workflows are introduced.

## Alternatives considered

1. Build a fake case-management demo: rejected because it violates the Phase 0 boundary and creates false confidence.
2. Create a separate repository: rejected because the approved workspace already provides the monorepo contract, code generation and shared package boundaries.
3. Add business tables to prove database connectivity: rejected because Phase 0 requires migration infrastructure, not arbitrary domain data.

## Consequences

The foundation is intentionally useful for engineering review but not production-ready. Later phases must add authentication, authorization, domain data, integration controls and production operations through their own approved specifications.