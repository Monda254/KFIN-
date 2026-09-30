# KFIN — DATABASE MIGRATION GUIDE & LIFECYCLE PROCEDURES

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.1 — Database & Persistence Implementation  
**Author:** Principal Database Architect & Data Engineer  
**Status:** Authoritative Migration Guide  

---

## 1. Migration Philosophy & Invariants

In KFIN, database schema evolution is an auditable, strictly controlled engineering process. Manual modifications of staging or production databases through raw interactive consoles are **strictly prohibited**.

### Core Invariants:
1. **Deterministic Versioning:** All schema changes must be represented by a sequentially numbered, immutable SQL migration file located in `database/migrations/`.
2. **Transactional Execution:** Every migration must execute within a transactional block (`BEGIN ... COMMIT`) to ensure atomic application. If any statement encounters an error, the entire migration aborts, leaving the database in its previous valid state.
3. **Session Pooler Mandate:** Migrations that execute Data Definition Language (DDL) or create prepared statements must connect through the PostgreSQL **Session Pooler** (Port `5432`), not the Transaction Pooler (Port `6543`).
4. **Reproducibility:** A completely blank database must be capable of reaching the latest operational state simply by executing the migration suite in sequence.

---

## 2. Directory Structure

```
database/
├── migrations/
│   ├── 0000_huge_thaddeus_ross.sql   # Initial schema DDL (187 statements)
│   └── meta/
│       ├── _journal.json              # Drizzle version manifest
│       └── 0000_snapshot.json         # Ast snapshot of schema
├── seeds/
│   └── synthetic-seed.ts              # 100% synthetic development data
```

---

## 3. Migration Toolchain & Configuration

KFIN utilizes **Drizzle ORM & Drizzle Kit** paired with an autonomous migration runner:

### Configuration: `drizzle.config.ts`
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/src/schema/index.ts",
  out: "./database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### Environment Configuration: `.env`
* `DATABASE_URL`: Application runtime connection string (Supavisor Transaction Pooler, Port `6543`).
* `DATABASE_MIGRATION_URL`: Migration runner connection string (Supavisor Session Pooler, Port `5432`).

---

## 4. Step-by-Step Migration Workflow

### Step 1: Modify Domain TypeScript Schemas
Make the required structural adjustments in `lib/db/src/schema/` (e.g., adding a controlled column, constraint, or table).

### Step 2: Generate Migration SQL
Execute the Drizzle Kit generator to produce a versioned SQL file:
```bash
pnpm --filter @workspace/db run db:generate
```
*Review the generated `.sql` file in `database/migrations/` to verify that no unintended drop or destructive alters were generated.*

### Step 3: Execute Migration on Live Database
Run the KFIN migration runner:
```bash
pnpm --filter @workspace/scripts run migrate
```
The migration runner connects to the database, reads `database/migrations/*.sql`, checks execution status, executes statements in an atomic transaction, and logs execution time.

### Step 4: Validate Database Health
Run the integrity and structure test suite:
```bash
pnpm --filter @workspace/scripts run db:test
```

---

## 5. Failure Recovery & Disaster Procedures

If a migration fails during deployment:
1. **Automatic Rollback:** Because the migration runner wraps executions in `BEGIN ... COMMIT`, PostgreSQL automatically rolls back uncommitted DDL.
2. **Diagnostic Log:** The migration runner emits the exact PostgreSQL error code (e.g., `42P07` for duplicate table, `23503` for foreign key violation) and the statement that failed.
3. **Correction:** Fix the schema definition in TypeScript, re-generate the migration, and re-execute. Never manually edit live database tables to "force" a migration.

---

## 6. Related Documents

* [Database Architecture Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-ARCHITECTURE.md)
* [Database Testing Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-TESTING.md)
