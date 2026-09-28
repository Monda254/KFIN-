# Database Boundary & Strategy

This directory houses future database migration tooling, seed data scripts, and test fixtures for the Kenya Forensic Intelligence Network.

---

## 1. Architectural Boundaries

- **Database Client & Schemas:** Located in [lib/db/](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/lib/db/).
- **Current Phase 0 Scope:** The database package contains connection infrastructure and schema hooks, but intentionally contains **zero business/domain tables**.
- **Prohibition:** Operational database tables (cases, evidence, DNA profiles, persons) must NOT be created in Phase 0. Schema creation occurs only under future authorized phases.

---

## 2. Directory Structure

```text
database/
├── migrations/  → Version-controlled DDL migrations
├── seeds/       → Local development synthetic seeds
├── fixtures/    → Synthetic test fixtures
└── README.md    → This specification
```

---

## 3. Strict Synthetic Data Policy

In accordance with [KFIN Development Constitution — Section 20 & 24](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md#20-privacy-and-data-protection), all seed and fixture data must be **100% synthetic**.

Never insert real:
- Kenyan citizen personal information (national IDs, names, addresses)
- Real DNA electropherogram data, STR allele frequencies, or CODIS profiles
- Real forensic evidence numbers or physical case files
- Real law-enforcement offender or victim data