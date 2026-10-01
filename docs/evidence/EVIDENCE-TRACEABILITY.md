# KFIN Sub-Phase 1.4 Traceability Matrix
## Evidence & Chain-of-Custody Foundation

This document maps all core requirements of KFIN Master Sub-Phase 1.4 to their corresponding database structures, domain entities, workflow state machines, authorization rules, REST API contracts, audit events, and automated test scenarios.

| Requirement ID | Domain Area | Entity / Table | Workflow / Rule | Authorization Action | API Endpoint | Audit Action | Acceptance Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-EVD-01** | Evidence Registration | `evidence_items` | Registration & Identity | `evidence:create` | `POST /api/evidence` | `EVIDENCE_CREATE` | Test 1: Collection |
| **REQ-EVD-02** | Evidence Identity | `evidence_items.evidence_reference` | KFIN Reference Scheme | `evidence:create` | `POST /api/evidence` | `EVIDENCE_CREATE` | Test 1: Collection |
| **REQ-EVD-03** | Packaging & Sealing | `evidence_items`, `evidence_seals` | Packaging & Tamper Seals | `evidence:seal` | `POST /api/evidence/:id/seal` | `EVIDENCE_SEAL` | Test 1: Collection |
| **REQ-EVD-04** | Seal Breaking & Resealing | `evidence_seals` | Controlled Seal Break | `evidence:seal_break` | `POST /api/evidence/:id/seal-break` | `EVIDENCE_SEAL_BREAK` | Test 3: Broken Seal |
| **REQ-EVD-05** | Chain of Custody | `custody_events` | Immutable Ledger | `evidence:transfer` | `POST /api/evidence/:id/transfer` | `EVIDENCE_TRANSFER` | Test 2: Lab Transfer |
| **REQ-EVD-06** | Custody Receipt & Acceptance | `custody_events` | Multi-party Handshake | `evidence:receive` | `POST /api/evidence/:id/receive` | `EVIDENCE_TRANSFER_RECEIVE` | Test 2: Lab Transfer |
| **REQ-EVD-07** | Storage Vault & Retrieval | `storage_locations`, `custody_events` | Vault Access & Checkout | `evidence:retrieve`, `evidence:return` | `POST /api/evidence/:id/retrieve`, `/return` | `EVIDENCE_RETRIEVE`, `EVIDENCE_RETURN` | Test 5: Vault Retrieval |
| **REQ-EVD-08** | Custody Exceptions & Disputes | `custody_exceptions` | Discrepancy Escalation | `evidence:exception_manage` | `POST /api/evidence/:id/dispute` | `EVIDENCE_EXCEPTION_RAISE` | Test 9: Discrepancy |
| **REQ-EVD-09** | Digital Evidence & Cryptographic Hashes | `evidence_items`, `evidence_integrity_verifications` | SHA-256 Hash Verification | `evidence:verify_integrity` | `POST /api/evidence/:id/verify-integrity` | `EVIDENCE_VERIFY_INTEGRITY` | Test 8: Digital Hash |
| **REQ-EVD-10** | Examination & Sample Inputs/Outputs | `evidence_examinations` | Analytical Provenance | `evidence:examine` | `POST /api/evidence/:id/examinations` | `EVIDENCE_EXAMINE` | Test 6: Examination |
| **REQ-EVD-11** | Derivative Lineage & Subdivision | `evidence_derivatives` | Parent-Child Lineage | `evidence:derivative_create` | `POST /api/evidence/:id/derivatives` | `EVIDENCE_DERIVATIVE_CREATE` | Test 7: Derivative Lineage |
| **REQ-EVD-12** | Disposition & Destruction Governance | `evidence_dispositions` | Authorized Lifecycle End | `evidence:dispose` | `POST /api/evidence/:id/disposition` | `EVIDENCE_DISPOSE` | Test 10: Legal Hold Guard |
