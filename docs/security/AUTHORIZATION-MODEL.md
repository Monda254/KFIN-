# KFIN — CENTRAL AUTHORIZATION & ACCESS CONTROL ENGINE

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Core Architectural Axioms

KFIN authorization strictly rejects simplistic `is_admin = true` or `role = admin` patterns. The system evaluates multidimensional access policies where an authorized decision is granted only if the entire chain passes:

$$\text{Identity} \longrightarrow \text{Active?} \longrightarrow \text{Permission} \longrightarrow \text{Clearance} \longrightarrow \text{Scope} \longrightarrow \text{Purpose} \longrightarrow \text{SoD} \longrightarrow \text{Audit}$$

### Non-Negotiable Rules:
1. **Default Deny:** Unless an explicit policy permits the action, access is denied.
2. **Fail Closed:** Any technical fault, missing parameter, or internal failure in the policy engine immediately yields `DENY_FAIL_CLOSED_ERROR`.
3. **Object-Level Enforcement (BOLA/IDOR Defense):** Route-level checks are insufficient. Every request targeting a specific resource verifies that the caller has institutional and assignment rights to that exact object.
4. **Zero Frontend Authority:** UI button hiding or route disabling are usability features only. Backend policy evaluation is authoritative.

---

## 2. Evaluation Pipeline

```text
                       INCOMING REQUEST
                              │
                              ▼
                      [1. Authenticate]
                   Valid JWT / API Key?
                        ├── No ──► HTTP 401 Unauthorized
                        └── Yes
                              │
                              ▼
                   [2. Account Status Check]
                   account_status == ACTIVE?
                        ├── No ──► DENY_ACCOUNT_STATUS (HTTP 403)
                        └── Yes
                              │
                              ▼
                     [3. Permission Check]
                 Subject has atomic permission?
                        ├── No ──► Check Break-Glass
                        │            ├── None ──► DENY_INSUFFICIENT_PERMISSION
                        │            └── Valid ─► Elevate with Emergency Audit
                        └── Yes
                              │
                              ▼
                   [4. Clearance vs Class]
             subject.clearance >= resource.class?
                        ├── No ──► DENY_INSUFFICIENT_CLEARANCE
                        └── Yes
                              │
                              ▼
               [5. Separation of Duties (SoD)]
             Violates dual-control constraints?
                        ├── Yes ─► DENY_SOD_VIOLATION
                        └── No
                              │
                              ▼
                 [6. Purpose Limitation Check]
           Action requires purpose & valid purpose?
                        ├── No ──► DENY_PURPOSE_REQUIRED / INVALID
                        └── Yes
                              │
                              ▼
             [7. Scope & Organizational Boundary]
         Same Org OR Authorized Cross-Org Delegation?
                        ├── No ──► DENY_CROSS_ORGANIZATION_BOUNDARY
                        └── Yes
                              │
                              ▼
                 [8. Object-Level Assignment]
             User assigned to specific case/exhibit?
                        ├── No ──► DENY_OBJECT_UNAUTHORIZED
                        └── Yes
                              │
                              ▼
                       ┌─────────────┐
                       │    ALLOW    │ ──► Execute Action & Audit
                       └─────────────┘
```

---

## 3. Separation of Duties (SoD) Rules

| Rule ID | Name | Description | Enforcement Point |
| :--- | :--- | :--- | :--- |
| **SOD-001** | Dual Control on Lab Reports | A reporting forensic analyst cannot review or approve their own laboratory examination report. | `lab:report_approve` |
| **SOD-002** | Privilege Escalation Block | A user cannot modify their own security clearance, roles, permissions, or account status. | `role:manage`, `clearance:assign`, `user:status_manage` |
| **SOD-003** | Immutable Forensic Audit Trail | No user, including `SYSTEM_ADMINISTRATOR`, can update, delete, or truncate records in `audit_events`. | Any write attempt on audit logs |

---

## 4. Purpose-Based Access Control (PBAC)

Forensic operations involving national DNA indices, sensitive investigative exhibits, and judicial disclosures require an explicit, legally recognized purpose:

* `CASE_INVESTIGATION`: Direct evidentiary inquiries for active criminal files.
* `FORENSIC_EXAMINATION`: Laboratory processing, genotyping, and profile extraction.
* `IDENTITY_RESOLUTION`: Disaster victim identification (DVI) or unidentified remains resolution.
* `MISSING_PERSON_INVESTIGATION`: Searching national indices against missing person reference profiles.
* `AUTHORIZED_RESEARCH`: Anonymized epidemiological or method-validation studies.
* `QUALITY_ASSURANCE`: Contamination elimination searches and ISO/IEC 17025 proficiency checks.
* `LEGAL_PROCESS`: Compliance with formal court orders, subpoenas, or judicial disclosures.
* `SYSTEM_ADMINISTRATION`: Maintenance of infrastructure and authorized automated connectors.
