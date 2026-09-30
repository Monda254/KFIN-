# KFIN — ROLE-PERMISSION TRACEABILITY MATRIX

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Traceability Overview

Every functional role in KFIN is explicitly bound to granular atomic permissions. Users cannot be assigned arbitrary ad-hoc privileges without an audit record in `user_roles` and `role_permissions`.

$$\text{User} \overset{1:N}{\longleftrightarrow} \text{User-Role} \overset{N:1}{\longleftrightarrow} \text{Role} \overset{1:N}{\longleftrightarrow} \text{Role-Permission} \overset{N:1}{\longleftrightarrow} \text{Permission}$$

---

## 2. Authoritative Role Taxonomy

| Role Identifier | Functional Purpose | Typical Agency Affiliation | Default Clearance Tier |
| :--- | :--- | :--- | :--- |
| `SECURITY_ADMINISTRATOR` | Identity lifecycle, clearance grants, role bindings, security policy auditing | DCI / KFIN Central Authority | Level 5 (`HIGHLY_RESTRICTED`) |
| `SYSTEM_ADMINISTRATOR` | Technical infrastructure, service identities, API gateway, vault shelf topology | KFIN IT Operations | Level 4 (`CONFIDENTIAL`) |
| `INVESTIGATOR` | Primary investigative case logging, exhibit intake, laboratory submissions | DCI / NPS | Level 3 (`RESTRICTED`) |
| `FORENSIC_EXAMINER` | Crime scene exhibit collection, physical packaging, custodial transfers | DCI Forensic Services | Level 3 (`RESTRICTED`) |
| `LAB_ANALYST` | Biological sample extraction, STR profiling, candidate match evaluation | NPHL / Government Chemist | Level 5 (`HIGHLY_RESTRICTED`) |
| `LAB_REVIEWER` | Technical peer review, report approval, and supervisor sign-off | NPHL Directorate | Level 5 (`HIGHLY_RESTRICTED`) |
| `CASE_MANAGER` | Case lifecycle governance, participant registry, court data disclosures | ODPP / Judiciary | Level 4 (`CONFIDENTIAL`) |
| `EVIDENCE_CUSTODIAN` | Evidence vault management, custody ledger, disposal verification | Evidence Vault Authority | Level 4 (`CONFIDENTIAL`) |
| `DNA_SPECIALIST` | National DNA index queries, candidate match reviews, profile exports | National DNA Bureau | Level 5 (`HIGHLY_RESTRICTED`) |
| `GOVERNANCE_OFFICER` | Statutory retention compliance, judicial preservation holds, expungements | ODPP / Judiciary | Level 4 (`CONFIDENTIAL`) |
| `AUDITOR` | Independent oversight, compliance auditing, immutable log inspection | Independent Police Oversight / Audit Office | Level 5 (`HIGHLY_RESTRICTED`) |
| `INSTITUTIONAL_OFFICER` | Inter-agency liaison officer with read-only shared case access | NPS / Partner Agencies | Level 2 (`INTERNAL`) |

---

## 3. Comprehensive Role-Permission Matrix

| Action / Permission | `SEC_ADM` | `SYS_ADM` | `INVEST` | `EXAMIN` | `ANALYST` | `REVIEW` | `CASE_MGR` | `CUSTOD` | `DNA_SPEC` | `GOV_OFF` | `AUDITOR` | `INST_OFF` | Min Clearance | Purpose Required? | Cross-Org? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `user:create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ❌ |
| `user:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `INTERNAL` | No | ❌ |
| `user:update` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ❌ |
| `user:status_manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ❌ |
| `role:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ❌ |
| `permission:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ❌ |
| `clearance:assign` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ❌ |
| `service:manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ❌ |
| `session:revoke` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | No | ❌ |
| `case:create` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | No | ❌ |
| `case:read` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | `INTERNAL` | No | ❌ |
| `case:update` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | Yes | ❌ |
| `case:status_change` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | Yes | ❌ |
| `case:note_add` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | No | ❌ |
| `case:participant_manage` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | Yes | ❌ |
| `evidence:create` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | No | ❌ |
| `evidence:read` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | `INTERNAL` | No | ❌ |
| `evidence:update` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | Yes | ❌ |
| `evidence:transfer` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ✅ |
| `evidence:dispose` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ❌ |
| `vault:manage` | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | No | ❌ |
| `dna:submit` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ✅ |
| `dna:read` | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | `CONFIDENTIAL` | No | ❌ |
| `dna:search` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ✅ |
| `dna:match_confirm` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ✅ |
| `dna:view_sensitive` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ❌ |
| `dna:export` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes | ❌ |
| `lab:submit` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | Yes | ✅ |
| `lab:examine` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | Yes | ❌ |
| `lab:review` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ❌ |
| `lab:report_create` | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `RESTRICTED` | No | ❌ |
| `lab:report_approve` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `CONFIDENTIAL` | Yes (SoD) | ❌ |
| `audit:read` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | `HIGHLY_RESTRICTED` | Yes | ✅ |
| `disclosure:create` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ✅ |
| `retention:manage` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ❌ |
| `legal_hold:manage` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | `CONFIDENTIAL` | Yes | ❌ |
| `break_glass:activate` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | `HIGHLY_RESTRICTED` | Yes (Ticket) | ✅ |
