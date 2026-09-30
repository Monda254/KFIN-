# KFIN — Case Access Control, Clearance & Minimization Specification

**Document Reference:** `docs/cases/CASE-ACCESS-CONTROL.md`  
**Phase:** 1.3 — Core Domain & Case Management Foundation  
**System:** Kenya Forensic Intelligence Network (KFIN)  
**Status:** Canonical & Authoritative  

---

## 1. Access Control Model Overview

Access control in the KFIN Case Domain integrates:
* **Role-Based Access Control (RBAC):** Base permissions granted according to assigned operational roles.
* **Attribute-Based Access Control (ABAC):** Multi-dimensional environmental and contextual rules.
* **Multi-Level Security (MLS) Clearance Hierarchy:** Strict security classifications from `PUBLIC` (Level 1) to `HIGHLY_RESTRICTED` (Level 5).
* **Jurisdictional Boundary Tenancy:** Separation across statutory institutional bodies (`DCI-HQ`, `NPHL-LAB`, `ODPP-HQ`, `NPS-HQ`).
* **Field-Level Data Minimization:** Contextual redaction of sensitive geographic and demographic data when security clearance is insufficient for full unredacted access.

---

## 2. Core Case Permissions

The security engine recognizes the following canonical case permissions:

| Permission Code | Description | Authorized Roles |
| :--- | :--- | :--- |
| `case:create` | Initialize and open a new case docket | `INVESTIGATOR`, `CASE_MANAGER`, `ADMINISTRATOR` |
| `case:read` | View case metadata and investigation briefs | All authenticated roles with sufficient clearance |
| `case:update` | Modify case title, description, priority | `INVESTIGATOR` (assigned), `CASE_MANAGER`, `ADMINISTRATOR` |
| `case:assign` | Assign officers, examiners, and analysts | `CASE_MANAGER`, `DIRECTOR_FORENSIC_SERVICES`, `ADMINISTRATOR` |
| `case:transfer` | Transfer jurisdiction or lead officer | `CASE_MANAGER`, `DIRECTOR_FORENSIC_SERVICES`, `ADMINISTRATOR` |
| `case:close` | Conclude and seal an active case | `CASE_MANAGER`, `DIRECTOR_FORENSIC_SERVICES`, `ADMINISTRATOR` |
| `case:reopen` | Reopen a concluded docket | `CASE_MANAGER`, `DIRECTOR_FORENSIC_SERVICES`, `ADMINISTRATOR` |
| `case:link` | Establish non-destructive cross-case links | `INVESTIGATOR`, `CASE_MANAGER`, `ANALYST`, `ADMINISTRATOR` |

---

## 3. Institutional Tenancy & Cross-Agency Boundaries

By default, an officer can only view or manage cases originated by their statutory agency (`originating_org_id === subject.organizationId`) or where their agency has an active assignment in `case_assignments`.

Cross-agency access is permitted under three strict circumstances:
1. **Multi-Agency Case Assignment:** The officer's institution has been formally assigned to the case in `case_assignments`.
2. **Statutory Oversight Authority:** The caller holds an institutional oversight role (`AUDITOR`, `CHIEF_PROSECUTOR`, `ODPP_SPECIAL_PROSECUTOR`).
3. **Emergency Break-Glass Access:** The officer has an active, time-bound break-glass session recorded in `break_glass_events`.

Attempts to access cases across agency boundaries without meeting these criteria are rejected with `UnauthorizedCaseActionError` (HTTP 403) and logged as an `ACCESS_DENIED` security audit event.

---

## 4. Multi-Level Clearance & Field-Level Data Minimization

When a case is classified with a security level higher than an officer's personal clearance level:
* **Example:** A Case is classified as `RESTRICTED` (Level 3) or `CONFIDENTIAL` (Level 4), but the requesting officer only holds `INTERNAL` (Level 2) clearance.
* **Standard RBAC Behavior:** Reject the entire query.
* **KFIN Forensic Data Minimization Policy:**
  If the officer possesses the necessary functional permission (`case:read`) and valid tenancy, but lacks clearance for classified details:
  1. The Case metadata envelope is returned so administrative continuity is preserved.
  2. The sensitive narrative description is replaced with `[REDACTED — INSUFFICIENT SECURITY CLEARANCE]`.
  3. High-precision PostGIS geographic coordinates are redacted (`incidentLocationCoords = null`).
  4. The access event is logged with metadata indicating minimized data delivery.

```typescript
if (subject.clearanceLevel < caseRecord.dataClassificationLevel) {
  return {
    ...caseRecord,
    description: "[REDACTED — INSUFFICIENT SECURITY CLEARANCE]",
    incidentLocationCoords: null,
  };
}
```

---

## 5. Journal Note Confidentiality

Case diary entries (`case_notes`) contain investigative findings, informant references, and sensitive operational notes.
* **Standard Notes (`is_confidential = false`):** Visible to all officers authorized to view the parent case.
* **Confidential Notes (`is_confidential = true`):** Filtered out unless the viewing officer possesses `RESTRICTED` (Level 3) clearance or higher.
* Officers with `INTERNAL` clearance querying notes will receive only non-confidential notes. No error or indication of hidden records is leaked.

---

## 6. Object-Level Insecure Direct Object Reference (IDOR) Defense

KFIN strictly validates object-level authorization on every request involving a specific case ID or sub-resource (assignments, transfers, participants, notes, links).

Every service method verifies:
1. Does the target resource exist? If not, return `CaseNotFoundError` (HTTP 404).
2. Does the caller have permission on this specific instance based on tenant, assignment, and clearance? If not, reject with `UnauthorizedCaseActionError` (HTTP 403).
3. The server never relies on client-supplied parameters for authorization, effectively eliminating IDOR and privilege escalation attacks.
