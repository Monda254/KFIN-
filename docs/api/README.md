# KFIN API Contracts & Integration Documentation

This directory documents the API architecture, contract lifecycle, and integration standards for the Kenya Forensic Intelligence Network.

---

## 1. Authoritative API Contract Location

In accordance with [KFIN Development Constitution — Section 14: API Development Rules](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md#14-api-development-rules), all KFIN HTTP APIs are treated as strict contracts.

The authoritative contract source of truth is:
- **Canonical OpenAPI 3.1 Spec:** [lib/api-spec/openapi.yaml](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/lib/api-spec/openapi.yaml)

Internal database schemas or ORM models must never be directly exposed as public API responses.

---

## 2. API Code Generation Workflow

KFIN utilizes contract-first code generation via Orval:

```text
lib/api-spec/openapi.yaml
        ↓ (pnpm --filter @workspace/api-spec run codegen)
├── lib/api-zod/ (Runtime Zod request/response validation schemas)
└── lib/api-client-react/ (Typed TanStack Query React hooks)
```

Whenever `openapi.yaml` is modified, regenerate client bindings and schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck:libs
```

---

## 3. Standard API Error Model

All future KFIN API endpoints must conform to a standardized error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHENTICATED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_ERROR",
    "message": "Human-readable description of error without leaking system internals",
    "requestId": "req_uuid_v4",
    "details": []
  }
}
```

Never expose stack traces, database credentials, internal file paths, or sensitive forensic information in error payloads.

---

## 4. Current Phase 0 API Scope

In Phase 0, the API foundation provides only baseline health checking:
- `GET /api/healthz` — Service health and readiness verification.

Operational forensic endpoints (cases, evidence, laboratory, DNA matching, persons, intelligence) are strictly deferred to later phases.
