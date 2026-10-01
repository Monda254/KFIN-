# KFIN Evidence Domain Specification

## 1. Overview
The **Kenya Forensic Intelligence Network (KFIN)** evidence domain defines the architectural model, data representation, identity schemes, and aggregate boundaries for physical and digital forensic evidence across Kenyan law-enforcement agencies, forensic laboratories, and judicial bodies.

Evidence in KFIN is not a simple inventory row; it is a controlled, tamper-evident forensic object whose identity, origin, physical state, custody, handling, examination, and disposition remain immutably traceable throughout its lifecycle.

## 2. Core Concepts
- **Evidence Item:** The core forensic object associated with a legal case.
- **Evidence Reference:** Human-referenceable, machine-readable, tamper-resistant KFIN identifier.
- **Evidence Taxonomy:** Controlled classification of exhibit types (Biological, Touch DNA, Weapon, Digital Media, Toxicological, etc.).
- **Collection Event:** Explicit metadata capturing collector identity, location, timestamp, and legal authority.
- **Packaging & Sealing:** Controlled tamper-evident packaging and barcode/RFID seal records.
- **Storage Location:** Controlled hierarchical facility model (`Facility -> Room -> Vault -> Shelf -> Container`).

## 3. Domain Model Hierarchy
```text
CASE
 │
 ├── EVIDENCE ITEM (Aggregate Root)
 │      │
 │      ├── COLLECTION EVENT
 │      ├── SEALS (Active & Historical)
 │      ├── CUSTODY LEDGER (Immutable Events)
 │      ├── TRANSFERS (Initiation & Receipt)
 │      ├── EXAMINATIONS (Analytical Activities)
 │      ├── DERIVATIVES (Sample Lineage Tree)
 │      ├── INTEGRITY VERIFICATIONS (SHA-256 Hashes)
 │      ├── CUSTODY EXCEPTIONS (Discrepancy Ledger)
 │      └── DISPOSITIONS (Authorized Destruction / Return)
```

## 4. Security & Classification Boundaries
Every evidence exhibit inherits or specifies a classification level (`UNCLASSIFIED`, `RESTRICTED`, `CONFIDENTIAL`, `SECRET`, `TOP_SECRET`) which governs access rights, storage restrictions, export authorization, and retention policies in accordance with Phase 1.2 Access Control Rules.
