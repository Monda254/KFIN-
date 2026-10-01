# KFIN Sub-Phase 1.5 Traceability Matrix
## National DNA Indices & Searching/Matching Engine

This document maps all core requirements of KFIN Master Sub-Phase 1.5 to their corresponding database structures, domain entities, workflow state machines, authorization rules, REST API contracts, audit events, and automated test scenarios.

| Requirement ID | Domain Area | Entity / Table | Workflow / Rule | Authorization Action | API Endpoint | Audit Action | Acceptance Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-DNA-01** | Biological Sample Linkage | `biological_samples` | Sample Registration | `dna:create` | `POST /api/dna/samples` | `DNA_SAMPLE_CREATE` | Test 1: Sample Linkage |
| **REQ-DNA-02** | DNA Profile Identity & Loci | `dna_profiles`, `str_alleles` | Profile Ingestion | `dna:create` | `POST /api/dna/profiles` | `DNA_PROFILE_CREATE` | Test 1: Profile Creation |
| **REQ-DNA-03** | Index Membership & Activation | `dna_indices`, `dna_profiles` | Quality Review Approval | `dna:approve` | `POST /api/dna/profiles/:id/approve` | `DNA_PROFILE_APPROVE` | Test 1: Index Activation |
| **REQ-DNA-04** | Authorized Forensic Search | `dna_matching_requests` | Purpose-driven Search | `dna:search` | `POST /api/dna/searches` | `DNA_SEARCH_EXECUTE` | Test 2: Forensic Search |
| **REQ-DNA-05** | No-Match Distinction | `dna_matching_requests` | Complete Search Execution | `dna:search` | `POST /api/dna/searches` | `DNA_SEARCH_NO_MATCH` | Test 3: No-Match Check |
| **REQ-DNA-06** | Scientific Candidate Match Review | `dna_matching_results` | Four-Eyes Review | `dna:review_match` | `POST /api/dna/matches/:id/review` | `DNA_MATCH_REVIEW` | Test 4: Match Review |
| **REQ-DNA-07** | Legal Hold & Expungement Guard | `dna_profiles` | Legal Hold Protection | `dna:withdraw` | `POST /api/dna/profiles/:id/withdraw` | `DNA_EXPUNGEMENT_DENY` | Test 5: Legal Hold Guard |
| **REQ-DNA-08** | Elimination Index Contamination Search | `dna_indices`, `dna_matching_results` | Contamination Alert | `search:restricted_index` | `POST /api/dna/searches` | `DNA_CONTAMINATION_SEARCH` | Test 6: Elimination Search |
| **REQ-DNA-09** | Missing Persons Identification Search | `dna_indices`, `dna_matching_results` | Disaster Victim ID | `dna:search` | `POST /api/dna/searches` | `DNA_MISSING_SEARCH` | Test 7: Missing Person Search |
| **REQ-DNA-10** | ABAC Security Security Gate | Security Engine | Index Access Control | ABAC Policy | `POST /api/dna/searches` | `SECURITY_DENY_AUDIT` | Test 8: Unauthorized Search |
| **REQ-DNA-11** | Historical Provenance Reconstruction | `dna_profiles`, `biological_samples` | Provenance Trace | `dna:read` | `GET /api/dna/profiles/:id/provenance` | `DNA_PROVENANCE_READ` | Test 9: Historical Provenance |
