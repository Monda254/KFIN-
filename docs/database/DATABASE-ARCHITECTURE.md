# KFIN — DATABASE ARCHITECTURE SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.1 — Database & Persistence Implementation  
**Author:** Principal Database Architect, Data Engineer & Forensic Data-Integrity Engineer  
**Status:** Authoritative Persistence Architecture Specification  
**Classification:** STRICTLY CONFIDENTIAL // FOR INTERNAL SYSTEM DEVELOPMENT ONLY  

---

## 1. Executive Summary

This document defines the physical and logical database architecture for the **Kenya Forensic Intelligence Network (KFIN)** persistence layer. KFIN serves as the national forensic intelligence and chain-of-custody clearinghouse for Kenya's justice and security sector. The persistence architecture is designed to enforce the primary forensic integrity axiom:

$$\text{Integrity} \longrightarrow \text{Provenance} \longrightarrow \text{Security} \longrightarrow \text{Traceability} \longrightarrow \text{Consistency} \longrightarrow \text{Maintainability} \longrightarrow \text{Performance}$$

KFIN rejects the generic "CRUD" application paradigm where operational tables are casually overwritten or soft-deleted without historical attribution. Instead, the persistence tier operates as a cryptographically verifiable, temporally consistent, multi-tenant forensic ledger integrated with PostgreSQL 17 and PostGIS spatial extensions.

---

## 2. Technology Authority & Extension Topology

The database layer runs on managed PostgreSQL 17 with the following mandatory extensions enabled in the `public` schema:

| Extension | Version | Architectural Purpose & Forensic Rationale |
| :--- | :--- | :--- |
| **`uuid-ossp`** | `v1.1` | Generates cryptographically secure Version 4 UUIDs (`uuid_generate_v4()`) for internal technical primary keys. Prevents ID enumeration attacks and cross-institutional reference collision. |
| **`pgcrypto`** | `v1.3` | Cryptographic hashing (`sha256`, `hmac`), password hashing (`bf` / bcrypt), and digital signature validation directly within database procedures. |
| **`postgis`** | `v3.3.7+` | Spatial indexing, geometric containment, and spatial calculations (`geometry(Point, 4326)`) for incident locations, evidence collection sites, and facility geofences using standard WGS 84. |

---

## 3. Physical Storage & Schema Topology

The database is structured into a unified, high-performance relational schema with strong logical separation across **6 core domain contexts**:

```
                       ┌────────────────────────────────────────┐
                       │     KFIN PostgreSQL 17 Persistence     │
                       │           (PostGIS Enabled)            │
                       └───────────────────┬────────────────────┘
                                           │
         ┌───────────────────┬─────────────┴───────┬───────────────────┐
         │                   │                     │                   │
         ▼                   ▼                     ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 1. Identity &   │ │ 2. Cases &      │ │ 3. Evidence &   │ │ 4. Forensic DNA │
│ Institutional   │ │ Investigation   │ │ Custody Ledger  │ │ Intelligence    │
│ Governance      │ │ Management      │ │ (Immutable)     │ │ Repository      │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ • organizations │ │ • cases         │ │ • storage_locs  │ │ • bio_samples   │
│ • clearance_lvls│ │ • case_parts    │ │ • evidence_items│ │ • dna_indices   │
│ • users         │ │ • case_notes    │ │ • custody_trans │ │ • dna_profiles  │
│ • roles / perms │ │ • status_hist   │ │   (ledger-only) │ │ • str_alleles   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ │ • match_req/res  │
                                                            └─────────────────┘
                                           │
                         ┌─────────────────┴─────────────────┐
                         │                                   │
                         ▼                                   ▼
              ┌─────────────────────┐             ┌─────────────────────┐
              │ 5. Laboratory &     │             │ 6. Audit, Security  │
              │ Examination Domain  │             │ & Governance Domain │
              ├─────────────────────┤             ├─────────────────────┤
              │ • lab_submissions   │             │ • audit_events (imm)│
              │ • exam_requests     │             │ • data_disclosures  │
              │ • lab_reports       │             │ • retention_policies│
              └─────────────────────┘             │ • legal_holds       │
                                                  └─────────────────────┘
```

---

## 4. Architectural Invariants

### 4.1 Identifier Decoupling Strategy
Every entity in KFIN implements a strict two-tier identification policy:
1. **Internal Technical Identifier (`id UUID PK`):** Generated via `gen_random_uuid()` / `uuid_generate_v4()`. Used exclusively for foreign key constraints, internal indexing, and join optimization. These identifiers are **never** exposed to external users or third-party institutions.
2. **Business / Operational Identifier (e.g., `case_number`, `evidence_barcode`, `profile_identifier`):** Unique, human-readable, institutional-prefixed strings (e.g., `KFIN-DCI-CASE-2026-00084`, `EV-2026-NBO-000492`) with dedicated B-Tree unique indexes. These identifiers are immutable once assigned.

### 4.2 Forensic Audit Contract
Every mutable domain table (`cases`, `evidence_items`, `dna_profiles`, `lab_reports`, etc.) must implement the standard KFIN Audit Contract:
* `created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`
* `created_by UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL`
* `updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL`
* `updated_by UUID REFERENCES users(id) ON DELETE RESTRICT NOT NULL`
* `version INTEGER DEFAULT 1 NOT NULL` (Optimistic locking counter)

### 4.3 Immutability of Forensic Ledgers
Historical events—specifically **`custody_transfers`** and **`audit_events`**—are legal and forensic ledgers. They:
* **Do NOT contain** an `updated_at` column.
* **Do NOT contain** an `updated_by` column.
* **Do NOT contain** a `version` column.
* Strictly reject SQL `UPDATE` and `DELETE` operations via database permissions and triggers.

### 4.4 Deletion & Orphan Prevention (`ON DELETE RESTRICT`)
No forensic record may be deleted if dependent or historical relationships exist. All core relationships enforce:
```sql
FOREIGN KEY (parent_id) REFERENCES parent_table(id) ON DELETE RESTRICT ON UPDATE RESTRICT
```
Cascading deletes (`ON DELETE CASCADE`) are prohibited across domain boundaries to guarantee that evidence, DNA profiles, custody events, and audit logs are never accidentally purged.

---

## 5. Storage Decoupling & Digital File Integrity

Relational tables **never** store raw binary files, forensic photography, or sequencing data blobs (BAM, CRAM, large PDF reports).
* Binary assets are persisted in S3-compliant Object Storage (e.g., Supabase Storage / AWS S3).
* The persistence layer maintains cryptographic metadata:
  * `storage_bucket VARCHAR(100)`
  * `storage_key VARCHAR(500)`
  * `file_hash_sha256 VARCHAR(64) NOT NULL` (Hex-encoded SHA-256 integrity checksum)
  * `file_size_bytes BIGINT NOT NULL`
  * `mime_type VARCHAR(100)`

Any modification to a stored file changes its SHA-256 hash, immediately invalidating the relational integrity check and triggering a tamper alert.

---

## 6. Time Zone and Temporal Semantics

* **Canonical Timezone:** All timestamps are strictly persisted using `TIMESTAMP WITH TIME ZONE` (`timestamptz`).
* **Storage Standard:** All values are normalized to UTC in the database engine.
* **Application Conversion:** Presentation layers convert UTC timestamps to East Africa Time (EAT, `UTC+03:00`) for official Kenyan court exhibits and operational views.
* **Temporal Semantics:**
  * `occurred_at`: When the real-world physical event took place (e.g., crime scene collection).
  * `received_at`: When the forensic facility formally took physical custody.
  * `created_at`: When the persistence transaction was committed.
  * `effective_date`: When a legal retention policy or court hold becomes enforceable.

---

## 7. Related Documents

* [ERD Traceability Matrix](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/ERD-TRACEABILITY.md)
* [Database Schema Reference](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/SCHEMA-REFERENCE.md)
* [Indexing Strategy Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/INDEXING-STRATEGY.md)
* [Database Security Architecture](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-SECURITY.md)
