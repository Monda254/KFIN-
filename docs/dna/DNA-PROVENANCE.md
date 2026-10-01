# KFIN DNA Provenance & Historical Reconstruction Specification

## 1. Provenance Chain
KFIN guarantees 100% historical traceability for every DNA profile, search, candidate match, and scientific conclusion:

```text
Case / Incident
   ↓
Evidence Item (Chain of Custody & Seals)
   ↓
Biological Sample (Freezer & Extraction)
   ↓
DNA Processing & STR Loci Profile
   ↓
Index Registration & Approval
   ↓
Search Job Snapshot
   ↓
Candidate Comparison Result
   ↓
Forensic Reviewer Rationale
   ↓
Authorized Forensic Intelligence
```

## 2. Historical Provenance Trace API
The `GET /api/dna/profiles/:id/provenance` endpoint reconstructs the complete chain of custody and biological sample origin for any DNA profile record, verifying physical evidence provenance before judicial submission.
