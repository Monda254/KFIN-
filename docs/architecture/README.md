# KFIN Architecture Documentation

This directory houses architectural documentation, component boundary definitions, and Architecture Decision Records (ADRs) for the Kenya Forensic Intelligence Network.

---

## 1. Architectural Authority Hierarchy

All architectural decisions in KFIN are governed by the formal authority chain established in the [KFIN Development Constitution](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md#4-architectural-authority):

```text
KFIN MASTER SPECIFICATION
        ↓
PHASE SPECIFICATION
        ↓
SUB-PHASE SPECIFICATION
        ↓
ADR
        ↓
IMPLEMENTATION
```

Authoritative architecture documents include:
1. Approved KFIN Master Specification
2. Approved Technical Architecture Specification
3. Approved Security & Threat Model
4. Approved Data Governance Specification
5. Approved Workflow Specification
6. Approved Canonical Domain Model & Final ERD

---

## 2. Monorepo & Application Architecture

Per [ADR-0001: Phase 0 Repository Boundaries](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/architecture/adr/0001-phase-0-repository-boundaries.md), KFIN utilizes a structured pnpm monorepo architecture:

### 4-Tier Application Architecture
```text
Presentation Layer (apps/, artifacts/kfin-console/)
         ↓
Application Service Layer (services/, artifacts/api-server/)
         ↓
Domain Layer (lib/db/src/schema/, shared domain models)
         ↓
Infrastructure Layer (infrastructure/, lib/db/ connection, external adapters)
```

- **Presentation:** Must not own domain rules or directly access databases.
- **Application Services:** Orchestrates use cases and enforces input/output contracts.
- **Domain:** Pure business rules, domain entities, and invariants; isolated from UI or transport concerns.
- **Infrastructure:** Adapters, persistence drivers, and external integrations.

---

## 3. Boundary & Component Rules

1. **Shared Packages (`lib/`):** Shared code must have an explicit, justified reuse requirement. Shared packages must never be used to conceal improper domain coupling.
2. **Database Isolation (`database/`, `lib/db/`):** Database tooling and migrations are decoupled from application logic. Sensitive record integrity belongs in database constraints where technically appropriate.
3. **API Contracts (`lib/api-spec/`):** The OpenAPI specification is the authoritative contract source of truth. Internal database structures are never directly exposed as public API models.

---

## 4. Architecture Decision Records (ADRs)

All architecturally significant decisions must be recorded using the formal ADR template. Historical ADRs are immutable; when a decision changes, the prior ADR is marked `Superseded` by a new record.

- **ADR Template:** [0000-template.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/architecture/adr/0000-template.md)
- **ADR Register:**
  - [ADR-0001: Phase 0 Repository Boundaries](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/architecture/adr/0001-phase-0-repository-boundaries.md) (Accepted)
