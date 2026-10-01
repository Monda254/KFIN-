# KFIN Evidence REST API Contract Specification

## 1. Endpoints Overview

| Method | Endpoint | Description | Expected Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/evidence` | Register new exhibit | `201 Created` |
| `GET` | `/api/evidence` | Query exhibits with filters | `200 OK` |
| `GET` | `/api/evidence/:id` | Detailed exhibit view & child records | `200 OK` |
| `POST` | `/api/evidence/:id/seal` | Apply tamper seal | `200 OK` |
| `POST` | `/api/evidence/:id/seal-break` | Record controlled seal break | `200 OK` |
| `POST` | `/api/evidence/:id/transfer` | Initiate custody transfer | `200 OK` |
| `POST` | `/api/evidence/:id/receive` | Accept custody transfer | `200 OK` |
| `POST` | `/api/evidence/:id/retrieve` | Vault checkout | `200 OK` |
| `POST` | `/api/evidence/:id/return` | Vault return | `200 OK` |
| `POST` | `/api/evidence/:id/derivatives` | Create sub-sample / derivative | `201 Created` |
| `POST` | `/api/evidence/:id/disposition` | Authorized evidence disposal | `200 OK` |
| `POST` | `/api/evidence/:id/verify-integrity` | Cryptographic hash check | `200 OK` |
| `GET` | `/api/evidence/:id/custody-history` | Complete immutable custody timeline | `200 OK` |

## 2. Standard Error Responses
- `403 Forbidden`: `UnauthorizedEvidenceActionError` (Insufficient permissions / clearance)
- `404 Not Found`: `EvidenceNotFoundError`
- `409 Conflict`: `ConcurrencyConflictError` (Version mismatch)
- `412 Precondition Failed`: `LegalHoldViolationError` (Attempted destruction of legal hold exhibit)
