# KFIN — Case Domain Architecture & Aggregate Root Specification

**Document Reference:** `docs/cases/CASE-DOMAIN.md`  
**Phase:** 1.3 — Core Domain & Case Management Foundation  
**System:** Kenya Forensic Intelligence Network (KFIN)  
**Status:** Canonical & Authoritative  

---

## 1. Architectural Philosophy: The Case as Aggregate Root

In the Kenya Forensic Intelligence Network (KFIN), a **Case** is not a simple database record or a generic ticketing container. The Case is the **authoritative Aggregate Root** and the central operational backbone of forensic intelligence across Kenya's statutory justice system.

Every forensic artifact in KFIN belongs to, references, or originates from an active Case:
* **Physical exhibits and biological evidence** (`evidence_items`)
* **Custody ledgers and transfer manifests** (`custody_transfers`)
* **DNA profiles, STR allele matrices, and matching requests** (`dna_profiles`, `str_alleles`, `dna_matching_requests`)
* **Laboratory submissions and examination requests** (`lab_submissions`, `examination_requests`)
* **Formal expert laboratory reports** (`lab_reports`)
* **Legal holds and data retention directives** (`legal_holds`, `retention_policies`)
* **Inter-agency disclosures** (`data_disclosures`)

### Aggregate Invariants
The Case aggregate root strictly enforces the following core domain invariants:
1. **Consistency Boundary:** All state modifications, status transitions, transfers, and personnel assignments must flow through the Case aggregate root to ensure business rules are evaluated atomically.
2. **Optimistic Concurrency Control (OCC):** Every update, transition, and transfer evaluates an incrementing integer `version`. Stale updates fail immediately with `ConcurrencyConflictError` (HTTP 409).
3. **Immutability of Origin:** Once created, a Case's unique reference number (`case_number`), originating organization (`originating_org_id`), and historical creation event cannot be overwritten or deleted.
4. **Historical Lineage Preservation:** Transferring a case to another agency or officer updates the active responsibility pointer while creating an immutable record in `case_transfers`, preserving complete jurisdictional provenance.
5. **Decoupled Entity Roster:** People involved in the crime or incident (`case_participants`) are strictly separated in schema and identity from police officers and laboratory analysts (`case_assignments`).
6. **Synthetic Reference Safety Invariant:** All development and synthetic cases must match the prefix pattern `KFIN-SYN-%`.

---

## 2. Domain Entities & Value Objects

### 2.1 The Case Aggregate Root (`CaseRecord`)
The primary entity representing the investigation:
* `id`: UUID (Primary Key)
* `case_number`: Authoritative Case Reference Number (`KFIN-SYN-<ORG>-<YEAR>-<HEX>`)
* `title`: Concise investigation descriptor
* `description`: Factual synopsis of the criminal or forensic incident
* `originating_org_id`: Statutory agency initiating the docket (DCI, NPS, NPHL, etc.)
* `lead_investigator_id`: Active primary investigator responsible for the docket
* `status`: Lifecycle state (`DRAFT`, `OPEN`, `ACTIVE`, `SUSPENDED`, `CLOSED`, `REOPENED`, `ARCHIVED`)
* `case_type`: Domain typology (`CRITICAL_INCIDENT`, `SERIOUS_CRIME`, `CRIMINAL_INVESTIGATION`, `CORONER_INVESTIGATION`, `DISASTER_VICTIM_IDENTIFICATION`, `UNIDENTIFIED_REMAINS`, `COLD_CASE_REVIEW`)
* `priority`: Urgency classification (`ROUTINE`, `PRIORITY`, `EXPEDITED`, `CRITICAL`)
* `incident_date`: ISO timestamp of incident occurrence
* `incident_county`: Statutory Kenyan County (e.g., Nairobi, Mombasa, Nakuru)
* `incident_location_coords`: Spatial PostGIS Point representation (`ST_Point(lon, lat, 4326)`)
* `data_classification`: Security clearance requirement (`PUBLIC`, `INTERNAL`, `RESTRICTED`, `CONFIDENTIAL`, `HIGHLY_RESTRICTED`)
* `closure_reason`: Documented justification when entering `CLOSED` status
* `closed_at`: Timestamp of closure
* `closed_by_id`: Officer executing closure
* `reopened_reason`: Mandatory justification when transitioning `CLOSED` $\rightarrow$ `REOPENED`
* `reopened_at`: Timestamp of reopening
* `reopened_by_id`: Officer authorizing reopening
* `version`: Optimistic locking integer counter
* `created_at` / `updated_at`: Audit timestamps

### 2.2 Case Personnel Assignment (`CaseAssignmentRecord`)
Formal multi-agency investigator assignments:
* `id`: UUID
* `case_id`: Foreign key referencing parent Case
* `user_id`: Assigned officer/analyst
* `organization_id`: Institutional affiliation at time of assignment
* `case_role`: Assigned functional duty (`PRIMARY_INVESTIGATOR`, `CO_INVESTIGATOR`, `LEAD_ANALYST`, `EXAMINER`, `EVIDENCE_OFFICER`, `PROSECUTOR`, `CASE_MANAGER`)
* `access_scope`: Authorization boundary (`FULL_ACCESS`, `READ_ONLY`, `EVIDENCE_ONLY`, `REPORTS_ONLY`, `RESTRICTED_EXHIBIT`)
* `assigned_by_id`: Authorizing supervisor
* `assigned_at`: Assignment timestamp
* `revoked_at`: Timestamp of revocation (null if currently active)
* `revocation_reason`: Mandatory audit reason for removal
* `is_active`: Boolean flag indicating active duty status

### 2.3 Case Responsibility Transfer (`CaseTransferRecord`)
Immutable transfer ledger for inter-agency transitions:
* `id`: UUID
* `case_id`: Parent Case
* `from_org_id` / `to_org_id`: Relinquishing and receiving statutory institutions
* `from_investigator_id` / `to_investigator_id`: Relinquishing and receiving lead officers
* `transfer_reason`: Factual basis for jurisdictional handover
* `authorization_reference`: Statutory authorization docket (e.g., court order, DCI director warrant)
* `notes`: Operational transition notes
* `transferred_by_id`: Officer executing the transfer
* `transferred_at`: Immutable timestamp

### 2.4 Case Participant Roster (`CaseParticipantRecord`)
Persons of interest, victims, and witnesses:
* `id`: UUID
* `case_id`: Parent Case
* `participant_type`: Role in crime (`SUSPECT`, `VICTIM`, `WITNESS`, `PERSON_OF_INTEREST`, `ELIMINATION_SUBJECT`, `NEXT_OF_KIN`, `INFORMANT`)
* `pseudonym`: Protective pseudonym (e.g., `SYN-SUSPECT-A`, `SYN-VICTIM-01`)
* `id_document_type` / `id_document_number`: Encrypted/tokenized national identity references
* `demographics`: Structured JSON metadata (age range, sex, residency)
* `data_classification`: Privacy classification level
* `notes`: Operational remarks
* `is_active`: Soft-deletion preservation flag

### 2.5 Case Journal Note (`CaseNoteRecord`)
Investigative diary and progress logs:
* `id`: UUID
* `case_id`: Parent Case
* `author_id`: Officer authoring the note
* `note_text`: Factual log entry
* `is_confidential`: Boolean flag restricting visibility to cleared investigators

### 2.6 Case Cross-Link (`CaseLinkRecord`)
Non-destructive relationships between investigations:
* `id`: UUID
* `source_case_id` / `target_case_id`: Linked cases
* `link_type`: Relationship nature (`RELATED`, `DUPLICATE_CANDIDATE`, `MERGED_REFERENCE`, `CO_DEFENDANT`, `CROSS_JURISDICTIONAL`)
* `notes`: Justification for linkage
* `linked_by_id`: Officer creating link

---

## 3. Authoritative Case Numbering Scheme

The KFIN Case Reference Number generator adheres to the pattern:
```
KFIN-[SYN-]<ORG_PREFIX>-<YEAR>-<ENTROPY_HEX>
```
* `KFIN`: National system prefix
* `SYN-`: Mandatory synthetic safety token in test/development environments
* `<ORG_PREFIX>`: Sanitized uppercase 2-8 character statutory agency code (e.g., `DCIHQ`, `NPHL`, `ODPP`)
* `<YEAR>`: 4-digit UTC registration year (e.g., `2026`)
* `<ENTROPY_HEX>`: 6-character uppercase cryptographic hexadecimal string (3 bytes entropy)

Example: `KFIN-SYN-DCIHQ-2026-E84188`

Validation is executed via the canonical regular expression:
```typescript
const CASE_NUMBER_REGEX = /^KFIN-(?:SYN-)?[A-Z0-9]{2,12}-\d{4}-[A-Z0-9]{4,10}$/;
```

---

## 4. Domain Service Orchestration (`CaseService`)

The `CaseService` coordinates domain logic, access control, state validation, persistence, and audit logging:
1. **Authorization Check:** Evaluates caller `Subject` against required permission (e.g., `case:create`, `case:update`, `case:assign`, `case:transfer`, `case:close`).
2. **Access Control Matrix & ABAC:** Checks institutional tenancy, clearance level vs data classification, and Break-Glass elevations.
3. **State Machine Verification:** Asserts that status transitions and operational actions satisfy topological lifecycle rules and guard conditions.
4. **Optimistic Locking:** Asserts that input `expectedVersion` matches the current aggregate version before persistence.
5. **Persistence Repository:** Executes mutations inside transactional PostgreSQL queries.
6. **Audit Event Emission:** Records comprehensive security and operational events in `audit_events` with zero-PII sanitization.
7. **Field-Level Minimization:** Redacts sensitive geographic coordinates and details if caller clearance is below the resource classification.

---

## 5. Domain Error Hierarchy

All domain exceptions inherit from `Error` with structured machine-readable error codes:
* `CaseNotFoundError`: Thrown when a case ID does not resolve (HTTP 404).
* `UnauthorizedCaseActionError`: Thrown when authentication or ABAC authorization fails (HTTP 403).
* `InvalidStateTransitionError`: Thrown when attempting an illegal state machine transition (HTTP 400).
* `PreconditionFailedError`: Thrown when a business guard rule is violated, such as active laboratory examinations preventing closure (HTTP 412).
* `ConcurrencyConflictError`: Thrown when an update specifies a stale version (HTTP 409).
