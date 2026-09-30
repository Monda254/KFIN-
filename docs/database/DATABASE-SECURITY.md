# KFIN — DATABASE SECURITY & LEAST-PRIVILEGE ARCHITECTURE

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.1 — Database & Persistence Implementation  
**Author:** Principal Security Architect & Forensic Data-Integrity Engineer  
**Status:** Authoritative Security Architecture Specification  

---

## 1. Security Axioms & Principles

The KFIN database stores national forensic evidence, criminal case registries, biological sample metadata, and chain-of-custody records. The persistence security architecture enforces:

1. **Principle of Least Privilege:** Services, developers, and reporting tools possess only the minimum database permissions required for their specific role.
2. **Mandatory Encryption in Transit:** All database connections must enforce TLS 1.3 encryption. Unencrypted plaintext connections are rejected at the network firewall.
3. **Immutability of Forensic Ledgers:** Chain of custody and audit records cannot be modified or deleted, even by the application service account.
4. **Zero-PII Logging:** Passwords, raw STR allele matrices, and national identification numbers are never emitted to application logs.
5. **Zero Real Data in Non-Production:** Development and test environments use 100% synthetic fictional data with explicit development prefixes.

---

## 2. Database Role Hierarchy & Separation of Duties

The database architecture establishes four distinct PostgreSQL roles:

```
                          ┌────────────────────────┐
                          │   postgres (Admin)     │
                          │   - Disaster Recovery  │
                          │   - Schema Owner       │
                          └───────────┬────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
    │  kfin_migration  │    │     kfin_app     │    │  kfin_reporting  │
    ├──────────────────┤    ├──────────────────┤    ├──────────────────┤
    │ • DDL Execution  │    │ • DML (SELECT,   │    │ • SELECT-Only    │
    │ • Table Alters   │    │   INSERT, UPDATE)│    │ • Anonymized     │
    │ • Index Creation │    │ • NO DDL Access  │    │ • No Ledger      │
    │ • Session Pooler │    │ • Tx Pooler      │    │   Modifications  │
    └──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Role Permissions Matrix:

| Capability | `postgres` (Admin) | `kfin_migration` | `kfin_app` (Runtime) | `kfin_reporting` |
| :--- | :---: | :---: | :---: | :---: |
| `CREATE / ALTER / DROP TABLE` | ✅ | ✅ | ❌ | ❌ |
| `SELECT` on domain tables | ✅ | ✅ | ✅ | ✅ |
| `INSERT / UPDATE` on mutable tables | ✅ | ❌ | ✅ | ❌ |
| `INSERT` on immutable ledgers | ✅ | ❌ | ✅ | ❌ |
| `UPDATE / DELETE` on ledgers (`custody_transfers`, `audit_events`) | ❌ (Blocked) | ❌ | ❌ (Revoked) | ❌ |
| `TRUNCATE` any table | ✅ | ❌ | ❌ | ❌ |

---

## 3. Network & Connection Security

* **SSL Enforcement:** PostgreSQL rejects connections lacking SSL certificates. Cloud poolers utilize encrypted TLS sockets.
* **Pooler Architecture:**
  * **Session Pooler (Port 5432):** Dedicated to schema migrations, prepared statements, and administrative operations.
  * **Transaction Pooler (Port 6543):** Dedicated to high-throughput application API queries with connection reuse and rapid teardown.
* **IP Whitelisting:** Production database instances are isolated within private virtual clouds (VPC) with database access restricted to authorized backend application security groups.

---

## 4. Secrets Management & Environment Hygiene

* Database credentials are never stored in source control.
* All configuration is sourced from environmental variables (`DATABASE_URL`, `DATABASE_MIGRATION_URL`).
* Repository `.gitignore` strictly excludes:
  * `.env`
  * `.env.local`
  * `*.dump`
  * `*.pem`
  * `*.key`
* Secret scanning is automatically enforced via `pnpm run secret-scan` on every commit and CI execution.

---

## 5. Preparation for Phase 1.2 Row-Level Security (RLS)

The Phase 1.1 persistence layer is built to seamlessly support PostgreSQL **Row-Level Security (RLS)** in Phase 1.2:
* Every core entity contains `originating_org_id`, `classification`, or `clearance_level_id`.
* In Phase 1.2, tenant-isolation policies will be applied:
  ```sql
  ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

  CREATE POLICY case_organization_isolation ON cases
    FOR ALL
    TO kfin_app
    USING (
      originating_org_id = current_setting('kfin.current_org_id')::uuid
      OR classification <= current_setting('kfin.current_clearance')::classification_level
    );
  ```

---

## 6. Related Documents

* [Database Architecture Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-ARCHITECTURE.md)
* [Data Lifecycle Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATA-LIFECYCLE.md)
