# KFIN DNA Search Engine Architecture

## 1. Overview
The KFIN DNA Search Engine provides purpose-driven, auditable, and reproducible computational searches across authorized national indices.

```text
Target DNA Profile + Search Purpose + Target Indices
                         │
                         ▼
        AUTHORIZATION & ABAC PERMISSION CHECK
                         │
                         ▼
        SEARCH REQUEST SNAPSHOT RECORDING
                         │
                         ▼
           COMPUTATIONAL MATCHING ENGINE
                         │
                         ▼
         CANDIDATE MATCH RESULTS GENERATION
                         │
                         ▼
            SCIENTIFIC REVIEW WORKFLOW
```

## 2. Search Purpose Requirement
Every search request requires a mandatory operational purpose (e.g., `SERIAL_CRIME_INVESTIGATION`, `DISASTER_VICTIM_IDENTIFICATION`, `CONTAMINATION_AUDIT`). Searches submitted without a valid purpose or authorization are rejected and logged to the security audit trail.

## 3. Search Reproducibility
Every search records `algorithmVersion`, query profile version, target index snapshots, and timestamp, allowing any historical search result to be independently audited and reproduced.
