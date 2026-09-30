# KFIN — DATABASE INDEXING STRATEGY & QUERY OPTIMIZATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.1 — Database & Persistence Implementation  
**Author:** Principal Database Architect & Performance Engineer  
**Status:** Authoritative Indexing Specification  

---

## 1. Indexing Philosophy & Strategy

In a national-scale forensic information system, indexing must balance rapid response times for court submissions and urgent investigative searches with storage overhead and write amplification.

### Design Principles:
1. **Targeted Indexing:** Do not create indexes indiscriminately on every column. Every index must be justified by an approved query pattern.
2. **Deterministic Uniqueness:** Operational business identifiers must use unique B-Tree indexes to prevent collision and race conditions.
3. **Foreign Key Indexing:** Every foreign key column that participates in joins or cascade-prevention checks must be indexed.
4. **Spatial Optimization:** Geographic incident coordinates must utilize GIST spatial indexing.
5. **No Full-Database Unrestricted Searches:** Full-table scans on forensic ledgers are prohibited. Queries must be constrained by organization, case, or temporal ranges.

---

## 2. Index Taxonomy & Catalog

### 2.1 Primary Key & Unique Business Indexes

| Table | Index Target | Index Type | Purpose & Expected Query Pattern |
| :--- | :--- | :--- | :--- |
| `organizations` | `code` | B-Tree Unique | Fast agency lookup during token verification (`WHERE code = 'DCI-HQ'`) |
| `users` | `service_number` | B-Tree Unique | Officer badge / service ID lookup during authentication |
| `users` | `email` | B-Tree Unique | Email login lookup |
| `cases` | `case_number` | B-Tree Unique | Primary operational case lookup (`WHERE case_number = '...'`) |
| `evidence_items` | `evidence_barcode` | B-Tree Unique | Handheld barcode scanner intake (`WHERE evidence_barcode = '...'`) |
| `biological_samples` | `sample_barcode` | B-Tree Unique | Laboratory sample tube scanning |
| `dna_indices` | `index_code` | B-Tree Unique | DNA index partition selection (`WHERE index_code = 'OFFENDER'`) |
| `dna_profiles` | `profile_identifier` | B-Tree Unique | Forensic profile referencing in laboratory reports |
| `lab_submissions` | `submission_number` | B-Tree Unique | Formal intake dossier tracking |
| `lab_reports` | `report_number` | B-Tree Unique | Final forensic laboratory report tracking |

---

### 2.2 Relational Join & Foreign Key Indexes

| Table | Column(s) | Index Type | Query Optimization Pattern |
| :--- | :--- | :--- | :--- |
| `case_participants` | `case_id` | B-Tree | Fetch all participants associated with an active case |
| `case_notes` | `case_id`, `created_at DESC` | Composite B-Tree | Chronological investigative case notebook timeline |
| `case_status_history`| `case_id`, `changed_at DESC` | Composite B-Tree | Historical case audit and state transition timeline |
| `evidence_items` | `case_id` | B-Tree | Retrieve all physical exhibits for court docket compilation |
| `evidence_items` | `current_location_id` | B-Tree | Evidence vault inventory audits and stocktaking |
| `custody_transfers` | `evidence_id`, `transfer_timestamp DESC` | Composite B-Tree | Court-admissible chain-of-custody chronological reconstruction |
| `biological_samples` | `evidence_id` | B-Tree | Find all biological extractions derived from a physical exhibit |
| `dna_profiles` | `sample_id` | B-Tree | Locate all DNA profiles generated from a biological sample |
| `dna_profiles` | `dna_index_id` | B-Tree | Partitioned matching queries against specific national indices |
| `str_alleles` | `dna_profile_id`, `locus_name` | Composite B-Tree | Rapid retrieval of 20 CODIS loci for algorithmic comparison |
| `examination_requests`| `submission_id` | B-Tree | Lab workflow dispatch and section assignment |
| `audit_events` | `actor_id`, `recorded_at DESC` | Composite B-Tree | Internal affairs and compliance user activity audits |
| `audit_events` | `resource_type`, `resource_id` | Composite B-Tree | Resource-level provenance and lifecycle history audit |

---

### 2.3 Spatial & Geographic Indexes

| Table | Column | Index Type | Optimization Pattern |
| :--- | :--- | :--- | :--- |
| `cases` | `coordinates` | PostGIS GIST | Geographic spatial queries (`ST_DWithin`, `ST_Contains`) for regional crime series analysis and jurisdiction mapping |

---

## 3. Query Plan Verification & Performance Targets

Performance baselines using realistic synthetic datasets:

| Query Type | Typical Execution Target | Benchmark Strategy |
| :--- | :--- | :--- |
| Single Case Retrieval by `case_number` | $< 5\text{ ms}$ | Index Seek via B-Tree unique index |
| Evidence Item with Complete Custody Chain | $< 15\text{ ms}$ | Clustered join on `evidence_id` with ordered `custody_transfers` |
| DNA Profile with 20 STR Loci Extraction | $< 10\text{ ms}$ | Index Seek on `profile_identifier` joined with `str_alleles` |
| National DNA Candidate Search Execution | $< 500\text{ ms}$ | Partitioned index scan across target index with locus filters |
| High-Volume Audit Trail Filtering | $< 25\text{ ms}$ | Composite index seek on `(resource_type, resource_id)` |

---

## 4. Related Documents

* [Database Architecture Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-ARCHITECTURE.md)
* [Database Testing Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-TESTING.md)
