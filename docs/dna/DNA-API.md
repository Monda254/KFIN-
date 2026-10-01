# KFIN DNA REST API Specification

## 1. Endpoints Overview

| Method | Endpoint | Description | Expected Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/dna/samples` | Register biological sample | `201 Created` |
| `POST` | `/api/dna/profiles` | Create DNA profile with STR loci | `201 Created` |
| `GET` | `/api/dna/profiles` | Query DNA profiles with filters | `200 OK` |
| `GET` | `/api/dna/profiles/:id` | Detailed DNA profile view | `200 OK` |
| `POST` | `/api/dna/profiles/:id/approve` | Approve profile into active index | `200 OK` |
| `POST` | `/api/dna/profiles/:id/withdraw` | Withdraw profile from active index | `200 OK` |
| `GET` | `/api/dna/indices` | List national DNA indices & member counts | `200 OK` |
| `POST` | `/api/dna/searches` | Execute authorized DNA search | `201 Created` |
| `GET` | `/api/dna/searches/:id` | Get search request & candidate matches | `200 OK` |
| `POST` | `/api/dna/matches/:id/review` | Perform scientific match review | `200 OK` |
| `GET` | `/api/dna/profiles/:id/provenance` | Trace complete profile provenance | `200 OK` |

## 2. Standard Error Responses
- `403 Forbidden`: `UnauthorizedDnaActionError` (Insufficient clearance / index permissions)
- `404 Not Found`: `DnaProfileNotFoundError`
- `409 Conflict`: `DnaConcurrencyConflictError` (Version mismatch)
- `412 Precondition Failed`: `DnaLegalHoldViolationError` (Attempted expungement of Legal Hold profile)
