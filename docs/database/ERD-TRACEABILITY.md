# KFIN Final ERD & Domain-to-Database Traceability Matrix

**Document ID:** KFIN-DB-TRACE-001  
**Phase:** 1.1 — Database & Persistence Implementation  
**Authoritative Status:** Approved Database Engineering Baseline  
**Governed By:** Canonical KFIN Domain Model, Final ERD, and Technical Architecture Specification  

---

## 1. Traceability Architecture

The Kenya Forensic Intelligence Network (KFIN) persistence layer maps directly from the approved Canonical Domain Model and Final ERD into normalized PostgreSQL tables managed by Drizzle ORM. 

Every persistent entity enforces:
* **Primary Key:** Deterministic UUID generation (`defaultRandom()`).
* **Audit & Classification Contract:** `created_at`, `updated_at`, `version`, and `data_classification` (except append-only ledgers).
* **Referential Integrity:** `onDelete: "restrict"` on forensic assets (zero cascading deletes).
* **Provenance & Temporal Attribution:** Explicit actor tracking and version tracking.

---

## 2. Complete Entity Traceability Mapping

| Canonical Domain Concept | Final ERD Entity | Database Table Name | Primary Key | Key Foreign Relationships | Key Constraints & Invariants | Indexes | Data Classification Scope | Provenance & Audit Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Accredited Organization** | `ORGANIZATION` | `organizations` | `id` (UUID) | None | Unique `code` (e.g. `DCI-HQ`, `NPHL`); Valid `type` Enum | B-Tree on `code`, `status` | `INTERNAL` | Logged on creation / status change |
| **Security Clearance** | `CLEARANCE_LEVEL` | `clearance_levels` | `id` (UUID) | None | Unique `level` (1–5) and `code` (`PUBLIC` to `HIGHLY_RESTRICTED`) | B-Tree on `level` | `PUBLIC` | Static governance reference |
| **System Identity** | `USER` | `users` | `id` (UUID) | `organization_id` -> `organizations.id`<br>`clearance_level_id` -> `clearance_levels.id` | Unique `email`, unique `badge_number`, `national_id_hash` check | B-Tree on `email`, `org_id`, `status` | `CONFIDENTIAL` | Full session and access logging |
| **Access Role** | `ROLE` | `roles` | `id` (UUID) | None | Unique `name` (RBAC matrix) | B-Tree on `name` | `INTERNAL` | Immutable role definition |
| **User Role Mapping** | `USER_ROLE` | `user_roles` | `id` (UUID) | `user_id` -> `users.id`<br>`role_id` -> `roles.id` | Composite Unique `(user_id, role_id)` | B-Tree on `user_id`, `role_id` | `CONFIDENTIAL` | Logged on role grant/revoke |
| **Capability Permission**| `PERMISSION` | `permissions` | `id` (UUID) | None | Unique `code` (e.g. `case:create`, `dna:search`) | B-Tree on `code` | `INTERNAL` | Static capability catalog |
| **Role Permission** | `ROLE_PERMISSION` | `role_permissions` | `id` (UUID) | `role_id` -> `roles.id`<br>`permission_id` -> `permissions.id` | Composite Unique `(role_id, permission_id)` | B-Tree on `role_id` | `INTERNAL` | Administrative review gate |
| **Forensic Case** | `CASE` | `cases` | `id` (UUID) | `originating_org_id` -> `organizations.id`<br>`lead_investigator_id` -> `users.id` | Unique `case_number`; Check valid `status` | B-Tree on `case_number`, `status`, `org_id` | `RESTRICTED` to `HIGHLY_RESTRICTED` | State transition audit history |
| **Case Participant** | `CASE_PARTICIPANT`| `case_participants` | `id` (UUID) | `case_id` -> `cases.id` | Valid `participant_type`; `RESTRICT` on delete | B-Tree on `case_id`, `type` | `CONFIDENTIAL` | Tracked to case file |
| **Investigative Note** | `CASE_NOTE` | `case_notes` | `id` (UUID) | `case_id` -> `cases.id`<br>`author_id` -> `users.id` | Write-once content; `is_confidential` flag | B-Tree on `case_id`, `created_at` | `RESTRICTED` | Attribution to author |
| **Case Status History** | `CASE_STATUS_TRANSITION` | `case_status_history` | `id` (UUID) | `case_id` -> `cases.id`<br>`actor_id` -> `users.id` | Append-only transition ledger; previous & new status | B-Tree on `case_id`, `created_at` | `RESTRICTED` | Complete lifecycle provenance |
| **Storage Location** | `STORAGE_LOCATION`| `storage_locations` | `id` (UUID) | `organization_id` -> `organizations.id` | Unique `(org_id, facility_code, vault_number)` | B-Tree on `org_id`, `facility_code` | `INTERNAL` | Physical security monitoring |
| **Physical Evidence** | `EVIDENCE_ITEM` | `evidence_items` | `id` (UUID) | `case_id` -> `cases.id`<br>`collected_by_id` -> `users.id`<br>`current_location_id` -> `storage_locations.id` | Unique `(case_id, item_number)`; SHA-256 `integrity_hash` | B-Tree on `case_id`, `status`, `hash` | `CONFIDENTIAL` to `HIGHLY_RESTRICTED` | Digital checksum & seal tracking |
| **Chain of Custody** | `CUSTODY_TRANSFER` | `custody_transfers` | `id` (UUID) | `evidence_id` -> `evidence_items.id`<br>`releasing_officer_id` -> `users.id`<br>`receiving_officer_id` -> `users.id` | **APPEND-ONLY (No update/delete)**; `seal_intact` boolean | B-Tree on `evidence_id`, `timestamp` | `HIGHLY_RESTRICTED` | Legal chain of custody certificate |
| **Biological Sample** | `BIOLOGICAL_SAMPLE`| `biological_samples`| `id` (UUID) | `evidence_id` -> `evidence_items.id` (nullable for reference)<br>`case_id` -> `cases.id` | Unique `sample_number`; Valid `sample_type` | B-Tree on `evidence_id`, `sample_number` | `HIGHLY_RESTRICTED` | Sample extraction provenance |
| **DNA Index Registry** | `DNA_INDEX` | `dna_indices` | `id` (UUID) | None | Unique `code` (`CONVICTED_OFFENDER`, `CRIME_SCENE`, `MISSING_PERSONS`, etc.) | B-Tree on `code` | `CONFIDENTIAL` | National legal index definitions |
| **DNA Profile** | `DNA_PROFILE` | `dna_profiles` | `id` (UUID) | `sample_id` -> `biological_samples.id`<br>`index_id` -> `dna_indices.id` | Unique `profile_identifier`; Check `loci_count >= 13` | B-Tree on `profile_identifier`, `index_id` | `HIGHLY_RESTRICTED` | Analyst sign-off & technical review |
| **STR Allele Loci** | `STR_ALLELE` | `str_alleles` | `id` (UUID) | `dna_profile_id` -> `dna_profiles.id` | Unique `(dna_profile_id, locus_name)`; Standard loci | B-Tree on `dna_profile_id`, `locus_name` | `HIGHLY_RESTRICTED` | Instrument raw allele verification |
| **DNA Matching Request**| `DNA_MATCH_REQUEST`| `dna_matching_requests` | `id` (UUID) | `target_profile_id` -> `dna_profiles.id`<br>`requested_by_id` -> `users.id` | Search purpose limitation; Status enum | B-Tree on `target_profile_id`, `status` | `HIGHLY_RESTRICTED` | Attributable search authorization |
| **DNA Match Candidate** | `DNA_MATCH_RESULT` | `dna_matching_results` | `id` (UUID) | `request_id` -> `dna_matching_requests.id`<br>`candidate_profile_id` -> `dna_profiles.id` | Match score / shared loci metrics; Human confirmation required | B-Tree on `request_id`, `candidate_id` | `HIGHLY_RESTRICTED` | Human forensic expert sign-off |
| **Laboratory Submission**| `LAB_SUBMISSION` | `lab_submissions` | `id` (UUID) | `case_id` -> `cases.id`<br>`submitting_org_id` -> `organizations.id`<br>`receiving_lab_id` -> `organizations.id` | Unique `submission_number`; Urgency tier enum | B-Tree on `case_id`, `receiving_lab_id` | `RESTRICTED` | Formal inter-agency custody pass |
| **Examination Request** | `EXAMINATION_REQUEST`| `examination_requests`| `id` (UUID) | `submission_id` -> `lab_submissions.id`<br>`evidence_id` -> `evidence_items.id`<br>`analyst_id` -> `users.id` | Stage progression enum; `RESTRICT` on delete | B-Tree on `submission_id`, `stage` | `CONFIDENTIAL` | Workflow state machine tracking |
| **Forensic Lab Report** | `LAB_REPORT` | `lab_reports` | `id` (UUID) | `examination_request_id` -> `examination_requests.id`<br>`reporting_analyst_id` -> `users.id`<br>`approving_director_id` -> `users.id` | Unique `report_number`; SHA-256 `formal_report_hash` | B-Tree on `report_number`, `exam_req_id` | `CONFIDENTIAL` | Separation of duties (analyst != director) |
| **Universal Audit Journal**| `AUDIT_EVENT` | `audit_events` | `id` (UUID) | `actor_id` -> `users.id` (nullable for unauth attempts) | **APPEND-ONLY (No update/delete)**; Action & Outcome enums | B-Tree on `actor_id`, `action`, `timestamp` | `HIGHLY_RESTRICTED` | Tamper-evident immutable audit log |
| **Evidence Disclosure** | `DATA_DISCLOSURE` | `data_disclosures` | `id` (UUID) | `case_id` -> `cases.id`<br>`authorized_by_id` -> `users.id` | Court reference; Recipient agency | B-Tree on `case_id`, `recipient` | `CONFIDENTIAL` | Judicial & discovery accountability |
| **Data Retention Rule** | `RETENTION_POLICY` | `retention_policies` | `id` (UUID) | None | Unique `entity_type` + `classification`; Duration months | B-Tree on `entity_type` | `INTERNAL` | Lawful retention enforcement |
| **Legal Hold** | `LEGAL_HOLD` | `legal_holds` | `id` (UUID) | `case_id` -> `cases.id`<br>`authorized_by_id` -> `users.id` | Invalidation of normal expungement during litigation | B-Tree on `case_id`, `status` | `RESTRICTED` | Compliance protection gate |
