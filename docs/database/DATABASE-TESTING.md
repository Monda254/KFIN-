# KFIN — DATABASE TESTING & INTEGRITY VALIDATION SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.1 — Database & Persistence Implementation  
**Author:** Principal QA Architect & Forensic Data-Integrity Engineer  
**Status:** Authoritative Database Testing Guide  

---

## 1. Testing Philosophy & Verification Scope

The KFIN persistence layer is subjected to rigorous automated verification. Unlike traditional web applications that only test ORM mappings, KFIN verifies the relational engine directly against the live PostgreSQL database.

The test suite exercises six critical categories:
1. **Structural Integrity:** Verifies the existence of all 27 domain tables and required extensions.
2. **Referential Integrity & Delete Behavior:** Verifies that `ON DELETE RESTRICT` actively prevents orphan creation and illegal cascades.
3. **Domain & Uniqueness Constraints:** Verifies that duplicate business identifiers are rejected at the database level.
4. **Forensic Immutability:** Verifies that append-only ledgers (`custody_transfers`, `audit_events`) lack mutable columns.
5. **Biometric DNA Data Precision:** Verifies locus-by-locus storage and profile relationships for the 20 standard CODIS loci.
6. **Zero Real Forensic Data Audit:** Verifies that no real personal, institutional, or citizen data exists in the test database.

---

## 2. Test Execution & CLI Commands

The database test suite is implemented in [`scripts/src/db-test.ts`](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/scripts/src/db-test.ts) and integrated into workspace scripts:

### Execute Full Database Test Suite:
```bash
pnpm --filter @workspace/scripts run db:test
```

### Expected Standard Output:
```text
=====================================================================
             KFIN DATABASE INTEGRITY & PERSISTENCE TEST SUITE
=====================================================================
Test 1: All 27 KFIN domain tables exist in public schema ... ✅ PASS
Test 2: PostGIS, UUID, and Pgcrypto extensions are active ... ✅ PASS
Test 3: Foreign Key RESTRICT prevents deleting active case with evidence ... ✅ PASS
Test 4: Unique constraints reject duplicate case numbers ... ✅ PASS
Test 5: Custody transfers and audit events possess immutable ledger structure ... ✅ PASS
Test 6: Synthetic DNA profile contains verified 20 standard CODIS STR loci ... ✅ PASS
Test 7: Zero real citizen or personal identifiers in persistence layer ... ✅ PASS

=====================================================================
       ALL 7/7 DATABASE INTEGRITY TESTS PASSED! ✅
=====================================================================
```

---

## 3. Detailed Test Catalog

### 3.1 Structural Verification Test
* **Objective:** Ensure all 27 core domain entities are registered as base tables in PostgreSQL `information_schema.tables` and that extensions (`uuid-ossp`, `pgcrypto`, `postgis`) are installed in `pg_extension`.
* **Failure Condition:** Any missing table or inactive extension causes immediate test termination.

### 3.2 Referential Delete Restriction Test
* **Objective:** Prove that attempting to execute `DELETE FROM cases WHERE id = $case_id` on a case with dependent evidence items throws PostgreSQL error code `23503` (`foreign_key_violation`).
* **Forensic Significance:** Proves that evidence and investigations cannot be casually or accidentally orphaned or destroyed.

### 3.3 Business Identifier Uniqueness Test
* **Objective:** Prove that inserting a duplicate `case_number` throws PostgreSQL error code `23505` (`unique_violation`).
* **Forensic Significance:** Guarantees that no two court cases or police files can share the same identifier.

### 3.4 Forensic Ledger Immutability Structure Test
* **Objective:** Query `information_schema.columns` for `custody_transfers` and `audit_events` to assert that `updated_at`, `updated_by`, and `version` columns do not exist.
* **Forensic Significance:** Guarantees that historical custody events and audit actions cannot be updated in-place.

### 3.5 DNA STR Loci Verification Test
* **Objective:** Verify that the synthetic DNA profile `KFIN-SYN-DNA-2026-0001` contains exactly 20 standard CODIS STR loci in `str_alleles`.
* **Forensic Significance:** Guarantees that the schema faithfully represents standard forensic STR multiplex kits.

### 3.6 Zero Real Forensic Data Safety Audit
* **Objective:** Assert that 100% of user emails match `@kfin.test` and 100% of case numbers begin with `KFIN-SYN-`.
* **Forensic Significance:** Enforces statutory compliance with Kenya's Data Protection Act (2019) prohibiting real operational data in non-production tiers.

---

## 4. Related Documents

* [Database Architecture Specification](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-ARCHITECTURE.md)
* [Database Security Architecture](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/database/DATABASE-SECURITY.md)
