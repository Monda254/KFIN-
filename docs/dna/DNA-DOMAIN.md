# KFIN DNA Domain Specification

## 1. Overview
The **Kenya Forensic Intelligence Network (KFIN)** DNA domain defines the architecture, data structures, identity schemes, and aggregate boundaries for forensic biological samples, national DNA indices, STR loci profiles, matching request jobs, and candidate review workflows.

DNA in KFIN is a governed forensic intelligence resource. The system preserves strict separation between biological evidence samples, laboratory processing, STR profiles, index eligibility, search requests, candidate matches, scientific review, and authorized investigative leads.

## 2. Core Entities & Taxonomy
- **Biological Sample (`biological_samples`):** Physical sample extracted from evidence or reference donor (Blood, Buccal Swab, Touch DNA, Tissue, Bone, Unidentified Biological).
- **DNA Index (`dna_indices`):** National index category (`FORENSIC`, `OFFENDER`, `MISSING_PERSONS`, `UNIDENTIFIED_REMAINS`, `ELIMINATION`).
- **DNA Profile (`dna_profiles`):** Managed aggregate representing STR allele profile data, locus count, quality score, analyst identity, and approval status.
- **STR Alleles (`str_alleles`):** CODIS/European autosomal STR loci (e.g., `D3S1358`, `vWA`, `FGA`, `D8S1179`, `D21S11`, `D18S51`, `TH01`, `AMEL`).
- **Search Request (`dna_matching_requests`):** Authorized, purpose-driven computational search job snapshot across target indices.
- **Candidate Result (`dna_matching_results`):** Evaluated comparison result carrying locus match counts, stringency, and likelihood ratio scores awaiting scientific review.

## 3. Domain Model Hierarchy
```text
CASE / INCIDENT
 │
 ├── EVIDENCE ITEM (Phase 1.4)
 │      │
 │      └── BIOLOGICAL SAMPLE
 │             │
 │             └── DNA PROCESSING / PROFILE (Aggregate Root)
 │                    │
 │                    ├── STR ALLELES (Loci Panels)
 │                    ├── INDEX MEMBERSHIP (Eligibility & Activation)
 │                    ├── SEARCH REQUESTS (Audit & Configuration)
 │                    └── CANDIDATE MATCHES (Review Workflow)
```
