# KFIN Evidence Authorization Specification

## 1. Governance & ABAC/RBAC Framework
Evidence authorization in KFIN integrates with Phase 1.2 Access Control Rules, enforcing multi-factor policy evaluations:

```text
Subject Identity + Roles + Clearance Level + Organization + Permissions + Legal Hold Status
                                       │
                                       ▼
                       EVIDENCE POLICY ENGINE (ALLOW / DENY)
```

## 2. Action-Level Permissions

| Action | Required Permission | Additional Constraints |
| :--- | :--- | :--- |
| **`CREATE`** | `evidence:create` | Active investigator role & matching organization |
| **`READ`** | `evidence:read` | Subject clearance level >= Evidence classification level |
| **`SEAL` / `SEAL_BREAK`** | `evidence:update` | Active custodian or assigned lab analyst |
| **`TRANSFER`** | `evidence:transfer` | Active custodian identity |
| **`RECEIVE`** | `evidence:transfer` | Designated target receiving officer |
| **`RETRIEVE` / `RETURN`** | `vault:manage` | Storage facility authorization |
| **`EXAMINE`** | `lab:examine` | Accredited lab analyst identity |
| **`DISPOSE`** | `evidence:dispose` | `isLegalHold == false` AND court authorization reference |
| **`LEGAL_HOLD`** | `legal_hold:manage` | Judicial or senior supervisory clearance |

## 3. Separation of Duties (SoD)
- An officer cannot receive a transfer that they initiated themselves without secondary verification.
- Evidence under an active Legal Hold (`isLegalHold = true`) cannot be destroyed or disposed of under any circumstances (`LegalHoldViolationError`).
