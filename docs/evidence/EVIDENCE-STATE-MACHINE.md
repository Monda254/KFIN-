# KFIN Evidence State Machine Specification

## 1. Overview
The `EvidenceStateMachine` validates all state transitions for evidence exhibits to prevent impossible or illegal forensic transitions (e.g., transitioning directly from `ARCHIVED` back to `COLLECTED`).

## 2. Allowed Transitions Map

| Current State | Allowed Next States |
| :--- | :--- |
| **`COLLECTED`** | `PACKAGED`, `SEALED`, `TRANSFERRED`, `STORED`, `EXCEPTION` |
| **`PACKAGED`** | `SEALED`, `TRANSFERRED`, `STORED`, `EXCEPTION` |
| **`SEALED`** | `TRANSFERRED`, `STORED`, `RETRIEVED`, `EXAMINED`, `EXCEPTION` |
| **`TRANSFERRED`** | `RECEIVED`, `EXCEPTION` |
| **`RECEIVED`** | `STORED`, `RETRIEVED`, `EXAMINED`, `TRANSFERRED`, `EXCEPTION` |
| **`STORED`** | `RETRIEVED`, `TRANSFERRED`, `EXAMINED`, `DISPOSED`, `ARCHIVED`, `EXCEPTION` |
| **`RETRIEVED`** | `STORED`, `EXAMINED`, `TRANSFERRED`, `DISPOSED`, `EXCEPTION` |
| **`EXAMINED`** | `STORED`, `RETRIEVED`, `TRANSFERRED`, `SEALED`, `EXCEPTION` |
| **`EXCEPTION`** | `STORED`, `RETRIEVED`, `SEALED`, `TRANSFERRED`, `DISPOSED` |
| **`DISPOSED`** | `ARCHIVED` |
| **`ARCHIVED`** | *(Terminal state — no transitions allowed)* |

## 3. Concurrency Protection
All aggregate mutations require optimistic concurrency verification using the `version` integer property. If the submitted expected version does not match the active database version, a `ConcurrencyConflictError` is raised.
