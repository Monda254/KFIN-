# KFIN — DATABASE BACKUP, DISASTER RECOVERY & RESTORE SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.1 — Database & Persistence Implementation  
**Author:** Principal Database Architect & Systems Resilience Engineer  
**Status:** Authoritative Backup & Disaster Recovery Runbook  

---

## 1. Resilience & Recovery Objectives

As a national security and forensic justice asset, KFIN mandates strict recovery tolerances:

* **Recovery Point Objective (RPO):** $\le 5\text{ minutes}$. No more than 5 minutes of transactional forensic data may be lost in a catastrophic datacenter event.
* **Recovery Time Objective (RTO):** $\le 30\text{ minutes}$. Complete system operational capability must be restored within 30 minutes.
* **Integrity Invariant:** A restored database must pass 100% of referential and forensic ledger checks before being exposed to user traffic.

---

## 2. Backup Architecture & Strategy

The backup topology combines continuous streaming write-ahead log (WAL) archiving with daily encrypted logical snapshots:

```
┌─────────────────────────────────┐
│     Live KFIN PostgreSQL 17     │
└───────────────┬─────────────────┘
                │
         ┌──────┴───────────────────────────┐
         │ Continuous Streaming             │ Daily Scheduled Snapshot
         ▼                                  ▼
┌───────────────────────────────┐  ┌───────────────────────────────┐
│  Write-Ahead Log (WAL) Stream │  │  Full Logical Encrypted Dump  │
│  (Point-in-Time Recovery)     │  │  (pg_dump Custom Format -Fc)  │
├───────────────────────────────┤  ├───────────────────────────────┤
│ • Retained: 30 Days           │  │ • Retained: 7 Years (Monthly) │
│ • Target: Supabase WAL / S3   │  │ • Cipher: AES-GCM-256         │
└───────────────────────────────┘  └───────────────────────────────┘
```

---

## 3. Physical & Logical Backup Procedures

### 3.1 Logical Backup Script (`pg_dump`)
Logical backups capture consistent schema and data snapshots using PostgreSQL's custom archive format:

```bash
# Export full encrypted logical backup
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  --host="aws-1-eu-central-1.pooler.supabase.com" \
  --port=5432 \
  --username="postgres.nefjrvtdvxjqrcqrtftz" \
  --format=custom \
  --blobs \
  --verbose \
  --file="kfin_backup_$(date +%Y%m%d_%H%M%S).dump" \
  "postgres"

# Encrypt backup archive with recipient public key
gpg --symmetric --cipher-algo AES256 "kfin_backup_*.dump"
```

### 3.2 Continuous WAL Archival
Supabase provides automated, multi-zone WAL replication ensuring microsecond-level point-in-time recovery across European and African data-residency boundaries.

---

## 4. Restoration Verification Runbook

> **Critical Rule:** A backup that has never been restored in an isolated test environment is not a verified backup.

### Step-by-Step Restoration Protocol:
1. **Provision Clean Target Database:**
   ```bash
   createdb -h localhost -U postgres kfin_restore_verification
   ```
2. **Verify Cryptographic Extensions:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   CREATE EXTENSION IF NOT EXISTS "postgis";
   ```
3. **Restore Snapshot:**
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges \
     -h localhost -U postgres -d kfin_restore_verification \
     kfin_backup_snapshot.dump
   ```
4. **Execute Database Integrity Suite:**
   ```bash
   DATABASE_URL="postgresql://postgres:pass@localhost:5432/kfin_restore_verification" \
   pnpm --filter @workspace/scripts run db:test
   ```
5. **Verify Row Counts & Ledgers:**
   * Confirm all 27 tables contain identical row counts to pre-backup metrics.
   * Verify that no custody transfers or audit events were altered during the restore.

---

## 5. Related Documents

* [Database Architecture Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-ARCHITECTURE.md)
* [Database Security Architecture](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-SECURITY.md)
