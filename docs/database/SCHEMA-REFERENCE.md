# KFIN — DATABASE SCHEMA REFERENCE & DICTIONARY

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.1 — Database & Persistence Implementation  
**Author:** Principal Database Architect & Data Engineer  
**Status:** Complete Schema Reference  

---

## 1. Domain Enumeration Catalog

KFIN utilizes 18 strictly controlled PostgreSQL `ENUM` types to prevent unstructured string drift across forensic workflows:

| Enum Name | Values | Purpose |
| :--- | :--- | :--- |
| `organization_type` | `LAW_ENFORCEMENT`, `FORENSIC_LAB`, `PROSECUTION`, `JUDICIARY`, `CORRECTIONAL`, `EXTERNAL_OVERSIGHT` | Multi-institutional categorization in Kenya's justice sector |
| `user_status` | `ACTIVE`, `SUSPENDED`, `REVOKED`, `PENDING_CLEARANCE` | Officer credential lifecycle state |
| `case_status` | `ACTIVE`, `PENDING_REVIEW`, `SUBMITTED_LAB`, `UNDER_EXAMINATION`, `CLOSED`, `ARCHIVED`, `REOPENED` | Case lifecycle state machine |
| `case_priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, `EXPEDITED` | Investigation priority queue |
| `participant_role` | `VICTIM`, `SUSPECT`, `WITNESS`, `PERSON_OF_INTEREST`, `ELIMINATION_DONOR`, `MISSING_PERSON`, `UNIDENTIFIED_REMAINS` | Canonical role within an investigation |
| `evidence_category` | `BIOLOGICAL`, `CHEMICAL`, `DIGITAL`, `DOCUMENT`, `BALLISTIC`, `TRACE`, `PHYSICAL_OBJECT`, `TOXICOLOGY`, `FINGERPRINT` | Material classification of seized items |
| `custody_action` | `INITIAL_SEIZURE`, `CHECK_IN`, `CHECK_OUT`, `TRANSFER`, `SUBMITTED_TO_LAB`, `RECEIVED_FROM_LAB`, `COURT_SUBMISSION`, `DISPOSED`, `RETURNED_TO_OWNER` | Chain of custody legal event taxonomy |
| `bio_sample_type` | `BLOOD`, `BUCCAL_SWAB`, `SEMEN`, `SALIVA`, `BONE`, `TOOTH`, `HAIR_ROOT`, `TISSUE`, `TOUCH_DNA` | Biological substrate for DNA profiling |
| `dna_index_type` | `FORENSIC_UNKNOWN`, `OFFENDER`, `ARRESTEE`, `MISSING_PERSON`, `UNIDENTIFIED_REMAINS`, `ELIMINATION`, `REFERENCE` | National CODIS-compatible index partition |
| `profile_source_type` | `KNOWN_REFERENCE`, `EVIDENCE_SAMPLE`, `UNKNOWN_REMAINS`, `SURROGATE_REFERENCE` | Origin classification of biological profile |
| `dna_match_type` | `EXACT`, `PARTIAL`, `FAMILIAL`, `NO_MATCH` | Computational DNA comparison result type |
| `match_status` | `PENDING_VERIFICATION`, `CONFIRMED_MATCH`, `REJECTED`, `INCONCLUSIVE` | Forensic analyst verification status |
| `lab_service_type` | `DNA_PROFILING`, `BALLISTICS`, `TOXICOLOGY`, `DIGITAL_FORENSICS`, `QUESTIONED_DOCUMENTS`, `TRACE_ANALYSIS`, `FINGERPRINT_ANALYSIS` | National forensic laboratory division |
| `submission_status` | `DRAFT`, `SUBMITTED`, `RECEIVED`, `REJECTED`, `IN_ANALYSIS`, `COMPLETED` | Laboratory submission lifecycle |
| `report_status` | `DRAFT`, `PEER_REVIEW`, `SUPERVISOR_APPROVED`, `RELEASED`, `AMENDED` | Formal laboratory report state |
| `audit_action_type` | `CREATE`, `READ`, `UPDATE`, `DELETE`, `SEARCH`, `EXPORT`, `DISCLOSE`, `LOGIN`, `LOGOUT`, `MATCH_EXECUTE`, `PERMISSION_CHANGE` | Complete forensic audit trail action taxonomy |
| `classification_level` | `UNCLASSIFIED`, `RESTRICTED`, `CONFIDENTIAL`, `SECRET`, `TOP_SECRET` | Kenya National Information Security Classification |
| `retention_basis` | `STATUTORY`, `CASE_ACTIVE`, `COURT_ORDER`, `EXPUNGEMENT_ELIGIBLE`, `PERMANENT_HISTORICAL` | Legal basis for retention and disposal |

---

## 2. Table Catalog by Domain Context

### 2.1 Identity & Institutional Governance

#### `organizations`
* **Purpose:** Stores registered Kenyan government security agencies, forensic institutes, prosecution offices, and regional headquarters.
* **Columns:**
  * `id` (`UUID PK`, `DEFAULT gen_random_uuid()`): Internal identifier.
  * `code` (`VARCHAR(50) UNIQUE NOT NULL`): Institutional prefix (e.g., `DCI-KENYA`, `NPS`, `ODPP`, `KFIN-HQ`).
  * `name` (`VARCHAR(255) NOT NULL`): Official agency title.
  * `type` (`organization_type NOT NULL`): Institutional category.
  * `county` (`VARCHAR(100) NOT NULL`): County jurisdiction (47 counties).
  * `station` (`VARCHAR(150) NOT NULL`): Specific branch or division.
  * `is_active` (`BOOLEAN DEFAULT true NOT NULL`).
  * Audit columns: `created_at`, `created_by`, `updated_at`, `updated_by`, `version`.

#### `clearance_levels`
* **Purpose:** Defines the 5 security clearance tiers authorized for accessing sensitive evidence and investigative records.
* **Columns:**
  * `id` (`UUID PK`): Internal identifier.
  * `level_code` (`classification_level UNIQUE NOT NULL`).
  * `name` (`VARCHAR(100) NOT NULL`).
  * `numeric_rank` (`INTEGER UNIQUE NOT NULL`, 1 to 5).
  * `description` (`TEXT`).

#### `users`
* **Purpose:** Registered forensic scientists, investigating officers, administrators, and chain-of-custody handlers.
* **Columns:**
  * `id` (`UUID PK`): Internal identifier.
  * `service_number` (`VARCHAR(100) UNIQUE NOT NULL`): Official police or civil service identification number.
  * `first_name` (`VARCHAR(100) NOT NULL`), `last_name` (`VARCHAR(100) NOT NULL`).
  * `email` (`VARCHAR(255) UNIQUE NOT NULL`), `phone` (`VARCHAR(50)`).
  * `organization_id` (`UUID FK -> organizations(id) RESTRICT`).
  * `clearance_level_id` (`UUID FK -> clearance_levels(id) RESTRICT`).
  * `status` (`user_status DEFAULT 'PENDING_CLEARANCE' NOT NULL`).
  * Audit contract.

#### `roles`, `permissions`, `user_roles`, `role_permissions`
* **Purpose:** Relational Role-Based Access Control (RBAC) foundation enforcing granular forensic capabilities (e.g., `DNA_PROFILE_VIEW`, `EVIDENCE_SEAL_BREAK`, `COURT_EXPORT`).

---

### 2.2 Cases & Investigative Management

#### `cases`
* **Purpose:** Root case file registry tracking criminal, disaster victim identification (DVI), or missing-persons investigations.
* **Columns:**
  * `id` (`UUID PK`), `case_number` (`VARCHAR(100) UNIQUE NOT NULL`).
  * `title` (`VARCHAR(255) NOT NULL`), `description` (`TEXT`).
  * `originating_org_id` (`UUID FK -> organizations(id) RESTRICT`).
  * `lead_investigator_id` (`UUID FK -> users(id) RESTRICT`).
  * `status` (`case_status DEFAULT 'ACTIVE' NOT NULL`).
  * `priority` (`case_priority DEFAULT 'MEDIUM' NOT NULL`).
  * `incident_date` (`TIMESTAMPTZ NOT NULL`), `incident_county` (`VARCHAR(100) NOT NULL`), `incident_location` (`TEXT`).
  * `coordinates` (`geometry(Point, 4326)`): PostGIS geographic coordinates of incident site.
  * `classification` (`classification_level DEFAULT 'RESTRICTED' NOT NULL`).
  * Audit contract.

#### `case_participants`
* **Purpose:** Connects identified individuals, victims, witnesses, and suspects to active cases without conflating identity with biological profiles.
* **Columns:**
  * `id` (`UUID PK`), `case_id` (`UUID FK -> cases(id) RESTRICT`).
  * `national_id_number` (`VARCHAR(50)`), `passport_number` (`VARCHAR(50)`).
  * `first_name` (`VARCHAR(100) NOT NULL`), `last_name` (`VARCHAR(100) NOT NULL`), `alias` (`VARCHAR(100)`).
  * `role` (`participant_role NOT NULL`).
  * `is_elimination_sample_donor` (`BOOLEAN DEFAULT false NOT NULL`).
  * Audit contract.

#### `case_notes`, `case_status_history`
* **Purpose:** Immutable timeline records capturing investigative journal entries and formal state transitions with reason and actor attribution.

---

### 2.3 Evidence & Custody Domain

#### `storage_locations`
* **Purpose:** Secure physical evidence vaults, refrigeration units, drying cabinets, and laboratory lockers.
* **Columns:**
  * `id` (`UUID PK`), `facility_id` (`UUID FK -> organizations(id) RESTRICT`).
  * `room` (`VARCHAR(100) NOT NULL`), `unit` (`VARCHAR(100) NOT NULL`), `shelf_bin` (`VARCHAR(100)`).
  * `temperature_controlled` (`BOOLEAN DEFAULT false NOT NULL`), `target_temp_celsius` (`VARCHAR(20)`).
  * Audit contract.

#### `evidence_items`
* **Purpose:** Physical and digital forensic items collected from crime scenes or reference subjects.
* **Columns:**
  * `id` (`UUID PK`), `evidence_barcode` (`VARCHAR(100) UNIQUE NOT NULL`).
  * `case_id` (`UUID FK -> cases(id) RESTRICT`), `submitting_org_id` (`UUID FK -> organizations(id) RESTRICT`).
  * `current_location_id` (`UUID FK -> storage_locations(id) RESTRICT`).
  * `category` (`evidence_category NOT NULL`), `description` (`TEXT NOT NULL`).
  * `packaging_type` (`VARCHAR(100) NOT NULL`), `tamper_seal_number` (`VARCHAR(100) NOT NULL`).
  * `is_sealed` (`BOOLEAN DEFAULT true NOT NULL`), `source_participant_id` (`UUID FK -> case_participants(id) RESTRICT`).
  * `collection_date` (`TIMESTAMPTZ NOT NULL`), `collection_officer_id` (`UUID FK -> users(id) RESTRICT`).
  * Audit contract.

#### `custody_transfers` (IMMUTABLE FORENSIC LEDGER)
* **Purpose:** Court-admissible chain-of-custody log.
* **Columns:**
  * `id` (`UUID PK`), `evidence_id` (`UUID FK -> evidence_items(id) RESTRICT NOT NULL`).
  * `action` (`custody_action NOT NULL`).
  * `transferred_from_user_id` (`UUID FK -> users(id)`), `transferred_to_user_id` (`UUID FK -> users(id) NOT NULL`).
  * `from_location_id` (`UUID FK -> storage_locations(id)`), `to_location_id` (`UUID FK -> storage_locations(id)`).
  * `transfer_timestamp` (`TIMESTAMPTZ DEFAULT NOW() NOT NULL`).
  * `reason_for_transfer` (`TEXT NOT NULL`), `authorization_reference` (`VARCHAR(255)`).
  * `seal_verified_intact` (`BOOLEAN NOT NULL`), `new_seal_number` (`VARCHAR(100)`).
  * `notes` (`TEXT`), `recorded_by` (`UUID FK -> users(id) NOT NULL`), `recorded_at` (`TIMESTAMPTZ DEFAULT NOW() NOT NULL`).
  * **Strict Ledger:** No `updated_at`, no `updated_by`, no `version`.

---

### 2.4 Forensic DNA Intelligence Domain

#### `biological_samples`
* **Purpose:** Physical biological substrates extracted or sampled from evidence items or buccal donors.
* **Columns:**
  * `id` (`UUID PK`), `sample_barcode` (`VARCHAR(100) UNIQUE NOT NULL`).
  * `evidence_id` (`UUID FK -> evidence_items(id) RESTRICT NOT NULL`).
  * `sample_type` (`bio_sample_type NOT NULL`), `extraction_method` (`VARCHAR(150)`).
  * `quantity_remaining_ul` (`VARCHAR(50)`), `is_consumed_entirely` (`BOOLEAN DEFAULT false NOT NULL`).
  * Audit contract.

#### `dna_indices`
* **Purpose:** Partitioned national DNA databases (e.g., Forensic Unknown, Convicted Offender, Elimination).
* **Columns:**
  * `id` (`UUID PK`), `index_code` (`VARCHAR(50) UNIQUE NOT NULL`), `name` (`VARCHAR(150) NOT NULL`).
  * `index_type` (`dna_index_type NOT NULL`), `retention_policy_years` (`INTEGER`), `is_active` (`BOOLEAN DEFAULT true NOT NULL`).

#### `dna_profiles`
* **Purpose:** CODIS-standard STR/Y-STR forensic DNA profiles derived from biological samples.
* **Columns:**
  * `id` (`UUID PK`), `profile_identifier` (`VARCHAR(100) UNIQUE NOT NULL`).
  * `sample_id` (`UUID FK -> biological_samples(id) RESTRICT NOT NULL`).
  * `dna_index_id` (`UUID FK -> dna_indices(id) RESTRICT NOT NULL`).
  * `source_type` (`profile_source_type NOT NULL`).
  * `kit_name` (`VARCHAR(100) NOT NULL`), `loci_count` (`INTEGER NOT NULL`).
  * `electrophoresis_run_id` (`VARCHAR(100)`), `analysis_software` (`VARCHAR(100)`).
  * `is_complete_profile` (`BOOLEAN DEFAULT true NOT NULL`), `is_mixture` (`BOOLEAN DEFAULT false NOT NULL`).
  * `contributor_count` (`INTEGER DEFAULT 1 NOT NULL`), `classification` (`classification_level DEFAULT 'RESTRICTED' NOT NULL`).
  * Audit contract.

#### `str_alleles`
* **Purpose:** Granular locus-by-locus STR call persistence for the 20 standard CODIS loci + Amelogenin (e.g., D3S1358, vWA, FGA, D8S1179, D21S11, D18S51, D5S818, D13S317, D7S820, TH01, TPOX, CSF1PO, AMEL, D1S1656, D2S441, D10S1248, D12S391, D22S1045, D2S1338, D16S539, D19S433, Penta D, Penta E).
* **Columns:**
  * `id` (`UUID PK`), `dna_profile_id` (`UUID FK -> dna_profiles(id) RESTRICT NOT NULL`).
  * `locus_name` (`VARCHAR(30) NOT NULL`).
  * `allele_1` (`VARCHAR(10) NOT NULL`), `allele_2` (`VARCHAR(10)`), `allele_3` (`VARCHAR(10)`), `allele_4` (`VARCHAR(10)`).
  * `height_rfu_1` (`INTEGER`), `height_rfu_2` (`INTEGER`), `is_microvariant` (`BOOLEAN DEFAULT false NOT NULL`).

#### `dna_matching_requests`, `dna_matching_results`
* **Purpose:** Decoupled persistence for forensic match executions, algorithms, candidate matches, log-likelihood ratios, and analyst validation.

---

### 2.5 Laboratory & Examination Domain

#### `lab_submissions`, `examination_requests`, `lab_reports`
* **Purpose:** Forensic case intake, formal examination assignments, and multi-signature validated lab report deliverables with digital file integrity hashes.

---

### 2.6 Audit, Security & Data Governance Domain

#### `audit_events` (IMMUTABLE FORENSIC AUDIT LEDGER)
* **Purpose:** Cryptographically attributable, append-only record of every system interaction.
* **Columns:**
  * `id` (`UUID PK`), `actor_id` (`UUID FK -> users(id)`), `actor_service_number` (`VARCHAR(100)`).
  * `action` (`audit_action_type NOT NULL`), `resource_type` (`VARCHAR(100) NOT NULL`), `resource_id` (`VARCHAR(100)`).
  * `classification` (`classification_level NOT NULL`).
  * `ip_address` (`VARCHAR(50)`), `user_agent` (`TEXT`), `correlation_id` (`VARCHAR(100)`).
  * `previous_state` (`JSONB`), `new_state` (`JSONB`), `details` (`TEXT`).
  * `recorded_at` (`TIMESTAMPTZ DEFAULT NOW() NOT NULL`).
  * **Strict Ledger:** No `updated_at`, no `updated_by`, no `version`.

#### `data_disclosures`, `retention_policies`, `legal_holds`
* **Purpose:** Judicial data disclosure tracking, statutory lifecycle management, and court-mandated preservation holds preventing automated expungement.

---

## 3. Related Documents

* [Database Architecture Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-ARCHITECTURE.md)
* [Data Lifecycle, Retention & Legal Holds](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATA-LIFECYCLE.md)
