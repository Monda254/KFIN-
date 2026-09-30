# KFIN — Case Management REST API Contract Specification

**Document Reference:** `docs/cases/CASE-API.md`  
**Phase:** 1.3 — Core Domain & Case Management Foundation  
**System:** Kenya Forensic Intelligence Network (KFIN)  
**Status:** Canonical & Authoritative  

---

## 1. Overview & Common Conventions

All Case Management endpoints are mounted under `/api/cases` and require:
1. **Authentication:** Valid Bearer JWT access token (`Authorization: Bearer <token>`).
2. **Correlation Tracking:** `X-Correlation-ID` header (generated if absent).
3. **Structured Responses:** Consistent JSON response payloads with domain errors mapped to HTTP status codes.

---

## 2. API Endpoint Matrix

| Method | Path | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/cases` | `case:create` | Initialize and open a new forensic case docket |
| `GET` | `/api/cases` | `case:read` | Search and filter cases across authorized jurisdictions |
| `GET` | `/api/cases/:id` | `case:read` | Retrieve full case details (subject to data minimization) |
| `PATCH` | `/api/cases/:id` | `case:update` | Update case metadata (requires `expectedVersion`) |
| `POST` | `/api/cases/:id/status` | `case:update` | Transition case lifecycle state (requires `expectedVersion`) |
| `POST` | `/api/cases/:id/assignments` | `case:assign` | Assign multi-agency personnel to case |
| `DELETE` | `/api/cases/:id/assignments/:assignmentId` | `case:assign` | Revoke assignment with mandatory reason |
| `GET` | `/api/cases/:id/assignments` | `case:read` | List all historical and active assignments |
| `POST` | `/api/cases/:id/transfers` | `case:transfer` | Transfer case jurisdiction/lead investigator |
| `GET` | `/api/cases/:id/transfers` | `case:read` | Retrieve complete transfer history |
| `GET` | `/api/cases/:id/timeline` | `case:read` | Retrieve chronological timeline reconstruction |
| `GET` | `/api/cases/:id/history` | `case:read` | Retrieve formal status transition log |
| `POST` | `/api/cases/:id/participants` | `case:update` | Register participant/person of interest |
| `DELETE` | `/api/cases/:id/participants/:participantId` | `case:update` | Remove participant with documented reason |
| `GET` | `/api/cases/:id/participants` | `case:read` | List registered case participants |
| `POST` | `/api/cases/:id/notes` | `case:update` | Record investigative journal note |
| `GET` | `/api/cases/:id/notes` | `case:read` | Retrieve journal notes (confidential filtered) |
| `POST` | `/api/cases/:id/links` | `case:link` | Establish non-destructive cross-case link |
| `GET` | `/api/cases/:id/links` | `case:read` | List linked investigations |

---

## 3. Detailed Request / Response Schemas

### 3.1 POST `/api/cases` — Create Case
**Request Body:**
```json
{
  "title": "Homicide Forensic Investigation - Kilimani",
  "description": "Factual overview of scene recovery and initial exhibits accessioned.",
  "originatingOrgId": "dci-hq-uuid",
  "leadInvestigatorId": "user-uuid",
  "caseType": "CRIMINAL_INVESTIGATION",
  "priority": "CRITICAL",
  "incidentDate": "2026-09-25T08:30:00Z",
  "incidentCounty": "Nairobi",
  "incidentLocationCoords": "-1.286389,36.817223",
  "dataClassification": "RESTRICTED"
}
```
**Response (201 Created):**
```json
{
  "id": "case-uuid",
  "caseNumber": "KFIN-SYN-DCIHQ-2026-A1B2C3",
  "title": "Homicide Forensic Investigation - Kilimani",
  "status": "OPEN",
  "version": 1,
  "createdAt": "2026-09-25T10:00:00.000Z"
}
```

### 3.2 POST `/api/cases/:id/status` — State Transition
**Request Body:**
```json
{
  "newStatus": "ACTIVE",
  "reason": "Scene processing completed; exhibit analysis commenced",
  "expectedVersion": 1
}
```
**Response (200 OK):**
```json
{
  "id": "case-uuid",
  "caseNumber": "KFIN-SYN-DCIHQ-2026-A1B2C3",
  "status": "ACTIVE",
  "version": 2
}
```

### 3.3 Error Responses
* **400 Bad Request:** `{"error": "INVALID_STATE_TRANSITION", "message": "Illegal transition from DRAFT to CLOSED"}`
* **403 Forbidden:** `{"error": "FORBIDDEN", "message": "Insufficient security clearance or missing permission"}`
* **404 Not Found:** `{"error": "CASE_NOT_FOUND", "message": "Case not found"}`
* **409 Conflict:** `{"error": "CONCURRENCY_CONFLICT", "message": "Stale version: expected 1, current is 2"}`
* **412 Precondition Failed:** `{"error": "PRECONDITION_FAILED", "message": "Cannot close case: Outstanding lab exams"}`
