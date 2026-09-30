# KFIN — DATA LIFECYCLE, RETENTION & EXPUNGEMENT SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.1 — Database & Persistence Implementation  
**Author:** Principal Forensic Data-Integrity Engineer  
**Status:** Authoritative Governance & Lifecycle Specification  

---

## 1. Information Lifecycle Management (ILM) Overview

Forensic data in KFIN is governed by statutory, constitutional, and international standards. A simplistic `DELETE FROM records WHERE age > 7 years` routine is legally and forensically unacceptable.

The persistence layer implements a multidimensional lifecycle model supporting six distinct operational states:

```
┌───────────┐      Investigation Complete      ┌─────────────┐
│  ACTIVE   │ ───────────────────────────────► │ RESTRICTED  │
└─────┬─────┘                                  └──────┬──────┘
      │                                               │
      │ Court Hold Triggered                          │ Statutory Period Reached
      ▼                                               ▼
┌───────────┐                                  ┌─────────────┐
│ RETAINED  │ ◄─────────────────────────────── │  ARCHIVED   │
│  (HOLD)   │         Legal Hold Lifted        └──────┬──────┘
└───────────┘                                         │
                                                      │ Court Expungement Order
                                                      ▼
                                               ┌─────────────┐
                                               │  EXPUNGED   │
                                               │ (Attributed)│
                                               └─────────────┘
```

---

## 2. Controlled Forensic Lifecycle States

| State | Operational Definition | Relational Treatment |
| :--- | :--- | :--- |
| **`ACTIVE`** | Case is open or under active forensic laboratory examination. Evidence is circulating or stored in working lockers. | Full read/write within authorization boundaries. Included in national DNA matching queries. |
| **`RESTRICTED`** | Sensitive investigation, internal affairs inquiry, or high-profile prosecution. | Accessible only to officers holding explicit clearance and role assignments. Standard queries exclude records. |
| **`RETAINED`** | Subject to active judicial preservation order or ongoing appellate review (`legal_holds`). | Read-only. **Immune** to automated archival, disposal, or expungement jobs. |
| **`SUPERSEDED`** | Prior version of an amended laboratory report or re-analyzed electropherogram. | Preserved historically for courtroom disclosure; points to newer version via `supersedes_id`. |
| **`ARCHIVED`** | Inactive or closed case exceeding active operational timeframe. | Moved to cold storage / read-only partitions. Requires elevated administrative clearance to retrieve. |
| **`EXPUNGED`** | Record lawfully ordered purged by High Court (e.g., acquitted arrestee DNA). | Biological profile deleted; attribution record and judicial order preserved in `audit_events` and `data_disclosures`. |

---

## 3. Retention Policies (`retention_policies`)

Statutory retention schedules are defined per resource category:

| Resource Category | Default Basis | Retention Period | Applicable Kenyan / Forensic Benchmark |
| :--- | :--- | :--- | :--- |
| **Capital Offences (Murder, Treason)** | `PERMANENT_HISTORICAL` | Indefinite (Permanent) | Criminal Procedure Code (Cap. 75) |
| **Felonies (General)** | `STATUTORY` | 30 Years post-closure | Evidence Act (Cap. 80) |
| **Misdemeanors / Infractions** | `STATUTORY` | 10 Years post-closure | National Police Service Act |
| **Arrestee DNA (Unconvicted)** | `EXPUNGEMENT_ELIGIBLE` | Upon Court Acquittal | Kenya Constitution Art. 31 (Privacy) |
| **Elimination Samples** | `CASE_ACTIVE` | Case Closure + 90 Days | ISO/IEC 17025 Quality Manual |
| **Audit Trails & Logs** | `PERMANENT_HISTORICAL` | 50 Years (Immutable) | National Cybersecurity & Forensics Standard |

---

## 4. Legal Holds (`legal_holds`)

When a judicial subpoena, parliamentary inquiry, or appellate review mandates preservation:
1. An authorized compliance officer inserts a row into `legal_holds`:
   * `resource_type` (e.g., `CASES`, `EVIDENCE_ITEMS`, `DNA_PROFILES`)
   * `resource_id`
   * `hold_reference` (e.g., High Court Case No. / Subpoena ID)
   * `issued_by_authority`
   * `is_active = true`
2. Database check functions and background maintenance jobs evaluate active legal holds before any status change. Any automated purge operation on a record under legal hold is blocked at the transaction level.

---

## 5. Lawful Expungement Protocol

When the High Court issues an expungement order for an acquitted individual's DNA profile:
1. **Validation:** The judicial order and verification reference are recorded in `data_disclosures` and `audit_events`.
2. **Profile Purge:** The STR allele loci (`str_alleles`) and DNA profile (`dna_profiles`) are removed from active matching indices.
3. **Ledger Preservation:** The chain-of-custody transfer ledger and audit logs **are not destroyed**. They record that the profile was expunged pursuant to judicial order `HC-EXP-2026-XXXX`, preserving institutional accountability without retaining biometric data.

---

## 6. Related Documents

* [Database Schema Reference](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/SCHEMA-REFERENCE.md)
* [Database Security Architecture](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-SECURITY.md)
