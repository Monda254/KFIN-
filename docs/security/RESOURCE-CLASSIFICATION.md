# KFIN — RESOURCE CLASSIFICATION & DATA ELEMENT PROTECTION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Classification Model

Every persistent entity in KFIN incorporates an explicit `data_classification` column enforcing one of five canonical classification tiers:

1. `PUBLIC`: Open public records and notices.
2. `INTERNAL`: Standard agency internal data.
3. `RESTRICTED`: Active case files, evidence exhibit metadata, participant pseudonyms.
4. `CONFIDENTIAL`: Chain of custody transfer ledger, unapproved examination reports, court disclosures.
5. `HIGHLY_RESTRICTED`: STR allele matrices, national offender DNA indices, append-only forensic audit trail.

---

## 2. Table Classification Defaults

| Table | Default Classification | Security Rationale |
| :--- | :--- | :--- |
| `cases` | `RESTRICTED` | Protects active police investigations from premature disclosure. |
| `case_participants` | `RESTRICTED` | Protects identities of victims, witnesses, and suspects. |
| `case_notes` | `RESTRICTED` / `CONFIDENTIAL` | Confidential investigative journal entries. |
| `evidence_items` | `RESTRICTED` | Physical exhibits and tamper-evident seal details. |
| `custody_transfers` | `CONFIDENTIAL` | Legal chain of custody integrity ledger. |
| `biological_samples` | `RESTRICTED` | Substrate type and extraction volume metadata. |
| `dna_profiles` | `CONFIDENTIAL` | Kit, run metrics, and locus count metadata. |
| `str_alleles` | `HIGHLY_RESTRICTED` | Highly sensitive genetic profile alleles (CODIS 20 loci). |
| `dna_matching_requests` | `HIGHLY_RESTRICTED` | Candidate match inquiries against national offender database. |
| `dna_matching_results` | `HIGHLY_RESTRICTED` | Biometric match scores, likelihood ratios, and candidate hits. |
| `lab_reports` | `CONFIDENTIAL` | Expert forensic conclusions subject to court disclosure. |
| `audit_events` | `HIGHLY_RESTRICTED` | Immutable national forensic provenance and accountability ledger. |
| `break_glass_events` | `HIGHLY_RESTRICTED` | Emergency privilege elevation records subject to judicial scrutiny. |

---

## 3. Field-Level Protection & Redaction

Certain fields contain extreme privacy or cryptographic significance and are subjected to dynamic masking and redaction:
* **National Identification:** Citizen national ID numbers are never stored in plaintext; only salted SHA-256 digests (`national_id_hash`) are persisted.
* **Passwords & Secrets:** Plaintext passwords, TOTP base32 secrets, and API key secrets are never emitted in API responses or telemetry.
* **DNA RFU Peak Heights:** Raw RFU electropherogram peak heights are redacted unless the requester holds `dna:view_sensitive` and `HIGHLY_RESTRICTED` clearance.
