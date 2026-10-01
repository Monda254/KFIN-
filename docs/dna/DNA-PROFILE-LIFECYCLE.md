# KFIN DNA Profile Lifecycle Specification

## 1. Lifecycle Overview
DNA profiles in KFIN transition through a strictly validated topological state machine:

```text
  DRAFT ──► PROCESSING ──► QUALITY_REVIEW ──► ACTIVE ──► SUSPENDED
   │                                            │           │
   └──────────────────► WITHDRAWN ◄─────────────┴───────────┘
                           ▲
                           │
                        EXPIRED
```

## 2. Lifecycle States

### 2.1 Creation & Ingestion (`DRAFT` & `PROCESSING`)
- Profile data is initially entered by an accredited forensic lab analyst.
- Locus panel and allele values are validated against standardized CODIS/European STR formats.

### 2.2 Quality Review (`QUALITY_REVIEW`)
- Profile undergoes automated and peer quality review (completeness, locus count, mixture evaluation).

### 2.3 Index Activation (`ACTIVE`)
- Upon approval by a lab director or authorized reviewer, the profile transitions to `ACTIVE` and enters its designated national DNA index for searching.

### 2.4 Suspension & Expiration (`SUSPENDED` & `EXPIRED`)
- Temporary removal from active searching during re-analysis, court challenge, or statutory retention expiration.

### 2.5 Withdrawal & Expungement (`WITHDRAWN`)
- Permanent removal from active search indices pursuant to court expungement orders or statutory requirements.
- Enforces strict verification against active Legal Hold status (`DnaLegalHoldViolationError`).
