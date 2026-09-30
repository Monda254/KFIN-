# KFIN — SECURITY CLEARANCE HIERARCHY & GOVERNANCE

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Conceptual Distinction: Role vs. Clearance

KFIN strictly separates functional capability (Role) from information sensitivity access ceilings (Clearance):
* **Role:** Defines **what action** a person is functionally qualified to execute (e.g., an investigator can create a case; an analyst can run PCR amplification).
* **Clearance:** Defines **the sensitivity limit** of data the person is legally trusted to inspect.

$$\text{Action Authorized} \iff \text{Permission Matches} \;\land\; \text{Clearance} \ge \text{Resource Classification} \;\land\; \text{Scope Matches}$$

A user who possesses the permission `dna:read` but only holds clearance level `RESTRICTED` cannot inspect raw CODIS STR alleles marked `HIGHLY_RESTRICTED`. Conversely, a Director holding `HIGHLY_RESTRICTED` clearance cannot perform lab report authoring without the functional role `LAB_ANALYST`.

---

## 2. Canonical Clearance Tiers

| Level | Code | Classification Boundary | Permitted Data Assets |
| :---: | :--- | :--- | :--- |
| **1** | `PUBLIC` | Open Information | Public statutory bulletins, anonymized national forensic trends, missing persons public alerts. |
| **2** | `INTERNAL` | Standard Agency Data | Agency personnel rosters, facility locations, unclassified inter-agency memos. |
| **3** | `RESTRICTED` | Active Investigative Data | Active criminal investigation dossiers, evidence exhibit collection manifests, case participant pseudonyms. |
| **4** | `CONFIDENTIAL` | Sensitive Case & Forensic Data | Full chain-of-custody transfer records, unapproved lab reports, storage vault freezer telemetry, judicial disclosures. |
| **5** | `HIGHLY_RESTRICTED` | Biometric & Audit Core | Raw 20 CODIS STR allele matrices, national convicted offender DNA index, immutable forensic audit trail, break-glass logs. |

---

## 3. Clearance Assignment Governance

1. **Granting Authority:** Security clearance levels can only be assigned or altered by an authorized `SECURITY_ADMINISTRATOR`. Ordinary users and supervisors cannot elevate clearance.
2. **Anti-Self Elevation:** A Security Administrator is prevented by Separation of Duties rule `SOD-002` from modifying their own clearance level.
3. **Revocation & Recalculation:** When a clearance level is revoked or downgraded:
   * Active user sessions are flagged for token recalculation or immediate termination.
   * Cached permissions are immediately invalidated.
   * An audit event (`CLEARANCE_REVOKE`) is appended to `audit_events`.
