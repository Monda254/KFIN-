# KFIN DNA Security & Access Control Specification

## 1. Security Framework
DNA profile records, search requests, and match results are governed by Phase 1.2 Access Control Rules:

```text
Subject Identity + Clearance Level + Index Permissions + Data Classification + Operational Purpose
                                       │
                                       ▼
                         DNA SECURITY POLICY (ALLOW / DENY)
```

## 2. Granular Permissions

| Action | Required Permission | Additional Constraint |
| :--- | :--- | :--- |
| **Sample Registration** | `dna:create` | Clearance Level >= 3 |
| **Profile Creation** | `dna:create` | Clearance Level >= 4 (Lab Analyst) |
| **Profile Approval** | `dna:approve` | Clearance Level >= 4 (Lab Director / Senior Analyst) |
| **Restricted Index Insert** | `index:access_restricted` | Clearance Level >= 4 |
| **Forensic Search** | `dna:search` | Active Investigator / Analyst & Clearance Level >= 3 |
| **Restricted Index Search** | `search:restricted_index` | Clearance Level >= 4 & `searchPurpose` specified |
| **Match Review** | `dna:review_match` | Accredited Forensic Scientist |
| **Profile Expungement/Withdrawal** | `dna:withdraw` | `isLegalHold == false` AND Court Order |

## 3. Rate Limiting & Anomaly Detection
Mass enumeration or brute-force search requests against DNA indices trigger automatic rate limiting and log security audit alerts to prevent unauthorized genomic data mining.
