# KFIN Repository Map

This document defines the structural architecture of the KFIN repository, explaining the purpose, responsibility, and architectural boundaries of every top-level directory and workspace.

---

## 1. Top-Level Directory Map

| Directory | Purpose | Boundary / Ownership | Status in Phase 0 |
| :--- | :--- | :--- | :--- |
| `artifacts/` | Runnable applications and web services | Application / Deployment | Contains Foundation Console & API server |
| `apps/` | Future independent client applications | Application | Reserved for future client apps |
| `services/` | Future microservices and domain backends | Backend Service | Reserved for future domain services |
| `lib/` | Shared domain, API, and database packages | Shared Packages / Contracts | Contains API schemas, DB client, Zod validators |
| `packages/` | Future shared UI and common libraries | Shared Libraries | Reserved for cross-cutting libraries |
| `database/` | Database migration scripts, seeds, and fixtures | Data Architecture | Convention established; zero domain tables |
| `infrastructure/` | Container definitions and deployment manifests | Operations & Infrastructure | Boundary established; zero production infra |
| `docs/` | Governance, architecture, security, and setup | Project Governance | Complete canonical documentation |
| `scripts/` | Repository automation and verification tools | Repository Engineering | Foundation and secret test scripts |
| `tests/` | Cross-package and end-to-end integration tests | Quality Assurance | Test intent and structure definitions |
| `.github/` | GitHub workflows and repository ownership | CI/CD & Governance | CI quality pipeline and CODEOWNERS |

---

## 2. Detailed Workspace Breakdown

### `artifacts/`
- `artifacts/kfin-console/`: React + Vite web dashboard displaying Phase 0 governance status, architecture boundaries, quality gates, and deferred scope.
- `artifacts/api-server/`: Node.js Express service providing foundation HTTP routing, structured Pino logging, and the baseline health check endpoint (`/api/healthz`).
- `artifacts/mockup-sandbox/`: Isolated UI prototyping sandbox for non-production interface design.

### `lib/`
- `lib/api-spec/`: Authoritative OpenAPI specification (`openapi.yaml`) and Orval code-generation configuration.
- `lib/api-zod/`: Generated Zod schemas guaranteeing runtime request/response validation against the OpenAPI spec.
- `lib/api-client-react/`: Generated TanStack Query React hooks consumed by the frontend console.
- `lib/db/`: Drizzle ORM client, connection pooling, and schema definitions. Intentionally empty of business tables in Phase 0.

### `database/`
- `database/migrations/`: Canonical location for version-controlled SQL migrations.
- `database/seeds/`: Controlled synthetic reference data seeds for local development.
- `database/fixtures/`: Synthetic test fixtures for automated testing.

### `docs/`
- `docs/governance/`: Constitutional engineering rules, Definition of Done, AI rules, and Change Management.
- `docs/architecture/`: Technical architecture documentation, monorepo boundaries, and ADR records.
- `docs/development/`: Developer onboarding, project status, repository maps, and setup guides.
- `docs/security/`: Threat modeling references, vulnerability reporting, and credential management.
- `docs/api/`: API contract documentation and integration guidelines.
- `docs/operations/`: Operational environment configuration and failure handling.
- `docs/testing/`: Quality gate definitions and test architecture.

### `scripts/`
- `scripts/src/foundation-test.ts`: Automated verification ensuring all constitutional, architectural, and governance documents exist and satisfy required integrity assertions.
- `scripts/src/secret-scan.ts`: Regex-based scanner detecting potential committed secrets, API keys, and private keys.
