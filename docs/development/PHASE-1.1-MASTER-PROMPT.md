# KFIN — KENYA FORENSIC INTELLIGENCE NETWORK

# SUB-PHASE 1.1 MASTER IMPLEMENTATION PROMPT

## DATABASE & PERSISTENCE IMPLEMENTATION

**Parent Phase:** Phase 1 — Core System Implementation Foundation  
**Sub-Phase:** 1.1  
**Sub-Phase Name:** Database & Persistence Implementation  
**Status:** Authoritative Implementation Prompt  
**Depends On:** Phase 1 Master Prompt + Phase 0 Foundation (0.1, 0.2, 0.3)  
**Precedes:** Sub-Phase 1.2 — Identity, Authentication & Access Control  
**Production Functionality:** Foundational database schemas, Drizzle ORM models, migration pipelines, repository abstractions, and synthetic test datasets.  

---

# 1. MISSION & OBJECTIVE

You are implementing **KFIN Sub-Phase 1.1**.

Your responsibility is to translate the approved KFIN Final ERD, Canonical Domain Model, and Technical Architecture into an **operational, production-grade, highly auditable database foundation**.

This sub-phase establishes:
1. PostgreSQL schema definitions and Drizzle ORM models across all KFIN core domains.
2. Robust schema migrations supporting reproducible deployment across Local, Test, Staging, and Production environments.
3. Strict referential integrity, primary/foreign keys, uniqueness constraints, check constraints, and performance indexes.
4. Universal temporal, provenance, and data-classification metadata columns across all forensic entities.
5. Append-only, tamper-evident audit and custody table structures.
6. A clean, decoupled Repository / Data Access Layer in `lib/db/` preventing direct or raw database leakages into UI or external presentation layers.
7. Automated database migration testing, schema validation, and 100% synthetic test seed data.

---

# 2. ABSOLUTE SCOPE BOUNDARY

Sub-Phase 1.1 establishes the **persistence architecture and database models**.

### Permitted in 1.1:
* Defining table schemas, enums, relations, indexes, and constraints.
* Authoring deterministic migration files and seed scripts.
* Implementing typed repository interfaces and database access helpers.
* Establishing synthetic fixtures and database integration test suites.

### Strictly PROHIBITED in 1.1:
* Writing HTTP API routes or Express endpoints (Deferred to 1.8).
* Implementing password hashing, JWT issuing, or login controllers (Deferred to 1.2).
* Implementing complex forensic matching algorithms or graph intelligence (Deferred to 1.5 & Phase 2).
* Connecting to real institutional databases (DCI, Judiciary, Hospitals, etc.).
* Introducing real citizen, criminal, case, or DNA profile data.

---

# 3. CORE ENTITY CATALOG & SCHEMA TOPOLOGY

To ensure clean domain separation and prevent monolithic database clutter, tables must be organized into logical domain groupings within the PostgreSQL persistence layer:

```text
KFIN Database Architecture
├── 1. Governance & Identity Domain (Users, Organizations, Clearances, Roles, Sessions)
├── 2. Case Management Domain (Cases, Participants, Offenses, Case Notes)
├── 3. Evidence & Custody Domain (Evidence Items, Custody Transfers, Seals, Storage Locations)
├── 4. DNA Indexing Domain (Biological Samples, DNA Profiles, STR Alleles, Index Memberships)
├── 5. Forensic Laboratory Domain (Lab Submissions, Examination Requests, Lab Results)
└── 6. Audit & Provenance Domain (Audit Events, Data Disclosures, Provenance Logs)
```

---

## 3.1 Domain Group 1: Governance, Organizations & Identity

1. **`organizations`**: Accredited forensic laboratories, law enforcement directorates (e.g., DCI), judiciary stations, and partner agencies.
   * Attributes: `id` (UUID), `code` (unique, e.g., 'DCI-HQ', 'NPHL'), `name`, `type` (Enum: `LAW_ENFORCEMENT`, `FORENSIC_LAB`, `JUDICIARY`, `HEALTH_AGENCY`), `status`, `created_at`, `updated_at`.
2. **`clearance_levels`**: Hierarchy of national security clearances required to view sensitive records.
   * Attributes: `id` (UUID), `level` (Integer, 1 to 5), `code` (Enum: `PUBLIC`, `INTERNAL`, `RESTRICTED`, `CONFIDENTIAL`, `HIGHLY_RESTRICTED`), `description`.
3. **`users`**: Personnel authorized to interact with KFIN.
   * Attributes: `id` (UUID), `organization_id` (FK), `clearance_level_id` (FK), `national_id_hash`, `email`, `badge_number`, `password_hash`, `account_status` (Enum: `PENDING`, `ACTIVE`, `SUSPENDED`, `LOCKED`, `DISABLED`), `mfa_enabled`, `last_login_at`, timestamps.
4. **`roles` & `user_roles`**: RBAC role mappings.
   * Roles: `FORENSIC_ANALYST`, `EVIDENCE_CUSTODIAN`, `INVESTIGATING_OFFICER`, `LAB_DIRECTOR`, `AUDITOR`, `SYSTEM_ADMIN`.
5. **`permissions` & `role_permissions`**: Granular capability permissions (e.g., `case:create`, `dna:search`, `evidence:transfer`).

---

## 3.2 Domain Group 2: Forensic Case Management

1. **`cases`**: The primary operational envelope for forensic investigations.
   * Attributes: `id` (UUID), `case_number` (Unique format, e.g., `KFIN-CASE-2026-XXXX`), `originating_org_id` (FK), `lead_investigator_id` (FK), `classification` (Enum: `RESTRICTED`, `CONFIDENTIAL`, `HIGHLY_RESTRICTED`), `status` (Enum: `DRAFT`, `OPEN`, `ACTIVE`, `SUSPENDED`, `CLOSED`, `ARCHIVED`), `incident_date`, `incident_location_geom` (PostGIS / Coordinates), `created_at`, `updated_at`.
2. **`case_participants`**: Persons of interest, victims, missing persons, or witnesses associated with a case.
   * Attributes: `id` (UUID), `case_id` (FK), `participant_type` (Enum: `SUSPECT`, `VICTIM`, `MISSING_PERSON`, `ELIMINATION_SUBJECT`, `UNKNOWN_REMAINS`), `pseudo_id`, `created_at`.
3. **`case_notes`**: Immutable chronological investigative and case tracking notes.

---

## 3.3 Domain Group 3: Evidence & Immutable Chain of Custody

1. **`storage_locations`**: Secure facilities, evidence vaults, lockers, and cold storage units.
   * Attributes: `id` (UUID), `organization_id` (FK), `facility_code`, `vault_number`, `shelf_identifier`, `temperature_controlled` (Boolean).
2. **`evidence_items`**: Physical specimens, biological matter, firearms, narcotics, and digital media seized.
   * Attributes: `id` (UUID), `case_id` (FK), `item_number` (Unique per case), `description`, `evidence_type` (Enum: `BIOLOGICAL_SPECIMEN`, `TOUCH_DNA_SWAB`, `WEAPON`, `CLOTHING`, `DIGITAL_MEDIA`, `DOCUMENT`), `collection_timestamp`, `collected_by_id` (FK), `current_location_id` (FK), `current_custodian_id` (FK), `tamper_seal_number`, `integrity_hash` (SHA-256), `status` (Enum: `COLLECTED`, `SUBMITTED`, `IN_VAULT`, `CHECKED_OUT_LAB`, `IN_COURT`, `DISPOSED`, `RETURNED`), `classification`, `created_at`.
3. **`custody_transfers`**: Immutable ledger of all custody movements.
   * Attributes: `id` (UUID), `evidence_id` (FK), `releasing_officer_id` (FK), `receiving_officer_id` (FK), `transfer_reason` (Enum: `LAB_ANALYSIS`, `COURT_PROCEEDING`, `VAULT_STORAGE`, `DISPOSAL`), `authorization_reference`, `transfer_timestamp`, `source_location_id` (FK), `destination_location_id` (FK), `seal_intact` (Boolean), `notes`.
   * **Rule:** Zero updates or deletes permitted. Append-only ledger table.

---

## 3.4 Domain Group 4: Biological Samples & DNA Indices

1. **`biological_samples`**: Aliquots and extracts derived from physical evidence items or reference donors.
   * Attributes: `id` (UUID), `evidence_id` (FK nullable for reference donors), `case_id` (FK), `sample_type` (Enum: `WHOLE_BLOOD`, `BUCCAL_SWAB`, `BONE_FRAGMENT`, `SEMEN_STAIN`, `HAIR_ROOT`, `TISSUE`), `extraction_method`, `quantification_ng_per_ul`, `storage_freezer_id` (FK), `created_at`.
2. **`dna_profiles`**: Structured Short Tandem Repeat (STR) genetic profiles.
   * Attributes: `id` (UUID), `sample_id` (FK), `profile_identifier` (Unique, e.g., `KFIN-DNA-XXXXXXXX`), `index_type` (Enum: `CONVICTED_OFFENDER`, `FORENSIC_CRIME_SCENE`, `MISSING_PERSONS`, `UNIDENTIFIED_REMAINS`, `ELIMINATION_STAFF`, `REFERENCE`), `profile_quality` (Enum: `COMPLETE`, `PARTIAL_HIGH`, `PARTIAL_LOW`, `MIXTURE`), `loci_count` (Integer), `legal_authority_ref`, `expungement_eligible_date`, `status` (Enum: `ACTIVE`, `FLAGGED_EXPUNGEMENT`, `ARCHIVED`, `RESTRICTED`), `created_at`.
3. **`str_alleles`**: Normalized CODIS / European Standard Set loci allele values.
   * Attributes: `id` (UUID), `dna_profile_id` (FK), `locus_name` (e.g., `D3S1358`, `vWA`, `FGA`, `D8S1179`, `D21S11`, `D18S51`, `D5S818`, `D13S317`, `D7S820`, `TH01`, `TPOX`, `CSF1PO`, `AMELOGENIN`), `allele_1`, `allele_2`, `allele_3` (for tri-alleles/mixtures), `allele_4`.

---

## 3.5 Domain Group 5: Forensic Examination & Laboratory Workflows

1. **`lab_submissions`**: Formal inter-agency requests for forensic laboratory analysis.
   * Attributes: `id` (UUID), `case_id` (FK), `submitting_org_id` (FK), `receiving_lab_id` (FK), `urgency` (Enum: `ROUTINE`, `EXPEDITED`, `CRITICAL`), `status` (Enum: `SUBMITTED`, `ACCEPTED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`), `submission_timestamp`.
2. **`examination_requests`**: Specific tests requested per evidence item (e.g., DNA profiling, ballistics, toxicology).
   * Attributes: `id` (UUID), `submission_id` (FK), `evidence_id` (FK), `assigned_analyst_id` (FK nullable), `analysis_type`, `stage` (Enum: `PENDING_ASSIGNMENT`, `EXTRACTION`, `QUANTIFICATION`, `AMPLIFICATION`, `ELECTROPHORESIS`, `TECHNICAL_REVIEW`, `ADMIN_REVIEW`, `APPROVED`), `notes`.
3. **`lab_reports`**: Formal expert forensic certificate of results.
   * Attributes: `id` (UUID), `examination_request_id` (FK), `report_number` (Unique), `reporting_analyst_id` (FK), `technical_reviewer_id` (FK), `approving_director_id` (FK), `conclusion_summary`, `formal_report_hash`, `issued_at`.

---

## 3.6 Domain Group 6: Universal Audit, Provenance & Governance

1. **`audit_events`**: Immutable system-wide access and state-change journal.
   * Attributes: `id` (UUID), `actor_id` (FK nullable for unauthenticated), `actor_ip_address`, `action` (Enum: `AUTH_LOGIN`, `CASE_CREATE`, `CASE_VIEW`, `EVIDENCE_TRANSFER`, `DNA_INDEX_SEARCH`, `DNA_MATCH_CONFIRM`, `REPORT_APPROVE`, `PERMISSION_CHANGE`), `entity_type`, `entity_id`, `event_timestamp`, `outcome` (Enum: `SUCCESS`, `DENIED`, `FAILURE`), `metadata` (JSONB for contextual attribution).
2. **`data_disclosures`**: Tracking legal disclosure of forensic evidence to judicial proceedings or defense counsel.

---

# 4. UNIVERSAL METADATA & CONSTRAINTS SPECIFICATION

Every table (with the exception of immutable log ledgers) must implement the standard KFIN auditing contract:

```typescript
export const commonColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
  dataClassification: varchar("data_classification", { length: 32 }).default("INTERNAL").notNull(),
};
```

### Constraints & Invariants:
1. **Immutable Tables:** `custody_transfers` and `audit_events` MUST NOT possess an `updated_at` or `version` column. They are write-once, append-only.
2. **Referential Integrity:** All foreign keys pointing to cases, evidence, or samples MUST use `onDelete: "restrict"`. No cascading deletions of forensic records.
3. **Indexes:**
   * B-Tree indexes on all foreign key columns (`case_id`, `evidence_id`, `sample_id`, `user_id`).
   * Unique index on composite identifiers (`case_number`, `profile_identifier`, `item_number`).
   * Partial indexes on active records (e.g. `WHERE status = 'ACTIVE'`).

---

# 5. TECHNICAL STACK & DRIZZLE CONFIGURATION

* **Language:** TypeScript 5.9+ in strict mode.
* **ORM:** Drizzle ORM (`drizzle-orm/pg-core`).
* **Migration Engine:** Drizzle Kit (`drizzle-kit`).
* **Database Driver:** `pg` (node-postgres) with connection pooling.
* **Target Dialect:** PostgreSQL 16+.
* **Locations:**
  * Schema definitions: `lib/db/src/schema/*.ts`
  * Schema aggregate: `lib/db/src/schema/index.ts`
  * Database client & pool: `lib/db/src/index.ts`
  * Migrations folder: `database/migrations/`
  * Migration test scripts: `scripts/src/db-migration-test.ts`

---

# 6. STEP-BY-STEP IMPLEMENTATION PLAN

### Step 1: Schema Implementation (`lib/db/src/schema/`)
- [ ] `enums.ts`: All domain enums (Clearance, Case Status, Evidence Types, Custody Transfer Reasons, DNA Index Types, Lab Stages, Audit Actions).
- [ ] `identity.ts`: `organizations`, `clearance_levels`, `users`, `roles`, `user_roles`, `permissions`, `role_permissions`.
- [ ] `cases.ts`: `cases`, `case_participants`, `case_notes`.
- [ ] `evidence.ts`: `storage_locations`, `evidence_items`, `custody_transfers`.
- [ ] `dna.ts`: `biological_samples`, `dna_profiles`, `str_alleles`.
- [ ] `laboratory.ts`: `lab_submissions`, `examination_requests`, `lab_reports`.
- [ ] `audit.ts`: `audit_events`, `data_disclosures`.
- [ ] `index.ts`: Export all tables, relations, and TypeScript types.

### Step 2: Drizzle Migration Generation
- [ ] Configure `lib/db/drizzle.config.ts` to output migrations into `database/migrations/`.
- [ ] Run `drizzle-kit generate` to generate the initial baseline migration SQL.
- [ ] Ensure migration SQL is deterministic, syntax-checked, and committed to version control.

### Step 3: Repository Pattern & Data Access Layer
- [ ] Implement typed repository interfaces in `lib/db/src/repositories/` for Cases, Evidence, DNA Profiles, and Audit Logs.
- [ ] Enforce data classification and clearance filtering at the query construction boundary.

### Step 4: Synthetic Seed Data & Database Test Harness
- [ ] Create `database/seeds/synthetic-seed.ts` providing realistic, completely fictional synthetic seed data for local testing.
- [ ] Create `scripts/src/db-migration-test.ts` to validate schema compilation, relationship constraints, and synthetic seed validity.
- [ ] Expose `pnpm run db:test` in `package.json`.

### Step 5: Verification & Quality Gate Audit
- [ ] Run `pnpm run typecheck` across all composite projects.
- [ ] Run `pnpm run lint` ensuring zero architectural boundary violations.
- [ ] Run `pnpm run validate` confirming all 10 quality gates pass cleanly.

---

# 7. ACCEPTANCE CRITERIA & GATE CHECKLIST

Sub-Phase 1.1 will be marked **PASS** only when:

1. [ ] **Schema Completeness:** All 18 core tables across the 6 domain groups are fully declared in Drizzle ORM with strict typing.
2. [ ] **Constraint Verification:** Primary keys, foreign keys (`RESTRICT`), unique constraints, and check constraints are in place.
3. [ ] **Immutability Contract:** `custody_transfers` and `audit_events` tables are strictly designed for append-only operation.
4. [ ] **Zero Forensic Leakage:** Zero real citizen, criminal, case, or DNA data exists anywhere in migrations, schemas, or seed files.
5. [ ] **Clean Migration Generation:** Drizzle migrations compile into versioned SQL in `database/migrations/`.
6. [ ] **Repository Layer:** Abstracted data access repositories implemented for core entities.
7. [ ] **CI & Validation Green:** `pnpm run validate` passes with exit code 0.
8. [ ] **Completion Documentation:** `docs/development/PHASE-1.1-COMPLETION-REPORT.md` is authored and committed.

**DO NOT PROCEED TO SUB-PHASE 1.2 UNTIL ALL SUB-PHASE 1.1 CRITERIA ARE MET.**

# END OF SUB-PHASE 1.1 MASTER IMPLEMENTATION PROMPT
