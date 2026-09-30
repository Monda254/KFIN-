import { pool } from "@workspace/db";
import assert from "node:assert/strict";

async function runDatabaseTests() {
  console.log("=====================================================================");
  console.log("             KFIN DATABASE INTEGRITY & PERSISTENCE TEST SUITE");
  console.log("=====================================================================");

  const client = await pool.connect();
  let passCount = 0;
  let testCount = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    testCount++;
    process.stdout.write(`Test ${testCount}: ${name} ... `);
    try {
      await fn();
      passCount++;
      console.log("✅ PASS");
    } catch (err: any) {
      console.log(`❌ FAIL\n  Error: ${err.message}`);
      throw err;
    }
  };

  try {
    // -------------------------------------------------------------------------
    // 1. Structural Verification
    // -------------------------------------------------------------------------
    await test("All 27 KFIN domain tables exist in public schema", async () => {
      const requiredTables = [
        "organizations", "clearance_levels", "users", "roles", "user_roles",
        "permissions", "role_permissions", "cases", "case_participants",
        "case_notes", "case_status_history", "storage_locations",
        "evidence_items", "custody_transfers", "biological_samples",
        "dna_indices", "dna_profiles", "str_alleles", "dna_matching_requests",
        "dna_matching_results", "lab_submissions", "examination_requests",
        "lab_reports", "audit_events", "data_disclosures", "retention_policies",
        "legal_holds"
      ];

      const { rows } = await client.query<{ table_name: string }>(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
      `);
      const existingTables = new Set(rows.map((r) => r.table_name));

      for (const table of requiredTables) {
        assert.ok(existingTables.has(table), `Table ${table} is missing from public schema!`);
      }
    });

    await test("PostGIS, UUID, and Pgcrypto extensions are active", async () => {
      const { rows } = await client.query<{ extname: string }>(`
        SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'postgis');
      `);
      const activeExts = new Set(rows.map((r) => r.extname));
      assert.ok(activeExts.has("uuid-ossp"), "uuid-ossp extension is missing");
      assert.ok(activeExts.has("pgcrypto"), "pgcrypto extension is missing");
      assert.ok(activeExts.has("postgis"), "postgis extension is missing");
    });

    // -------------------------------------------------------------------------
    // 2. Referential Integrity & Delete Restriction Tests
    // -------------------------------------------------------------------------
    await test("Foreign Key RESTRICT prevents deleting active case with evidence", async () => {
      const { rows: caseRows } = await client.query<{ id: string }>(`
        SELECT id FROM cases WHERE case_number = 'KFIN-SYN-CASE-2026-0001' LIMIT 1;
      `);
      assert.ok(caseRows.length > 0, "Synthetic case not found for foreign key test");
      const caseId = caseRows[0].id;

      // Attempt to delete case should fail with foreign key violation (23503)
      let failed = false;
      try {
        await client.query("DELETE FROM cases WHERE id = $1;", [caseId]);
      } catch (err: any) {
        failed = true;
        assert.equal(err.code, "23503", "Expected PostgreSQL error code 23503 (foreign_key_violation)");
      }
      assert.ok(failed, "Referential integrity failed: Case with dependent evidence items was deleted!");
    });

    // -------------------------------------------------------------------------
    // 3. Domain & Constraint Tests
    // -------------------------------------------------------------------------
    await test("Unique constraints reject duplicate case numbers", async () => {
      let failed = false;
      try {
        await client.query(`
          INSERT INTO cases (case_number, title, description, originating_org_id, lead_investigator_id, status, priority, incident_date, incident_county)
          SELECT 'KFIN-SYN-CASE-2026-0001', 'Duplicate Test', 'Should fail', originating_org_id, lead_investigator_id, 'ACTIVE', 'CRITICAL', NOW(), 'Nairobi'
          FROM cases WHERE case_number = 'KFIN-SYN-CASE-2026-0001' LIMIT 1;
        `);
      } catch (err: any) {
        failed = true;
        assert.equal(err.code, "23505", "Expected PostgreSQL error code 23505 (unique_violation)");
      }
      assert.ok(failed, "Unique constraint failed: Duplicate case_number was inserted!");
    });

    // -------------------------------------------------------------------------
    // 4. Forensic Immutability Tests
    // -------------------------------------------------------------------------
    await test("Custody transfers and audit events possess immutable ledger structure", async () => {
      const { rows: custodyCols } = await client.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'custody_transfers';
      `);
      const custodySet = new Set(custodyCols.map((c) => c.column_name));
      assert.ok(!custodySet.has("updated_at"), "custody_transfers MUST NOT contain updated_at column!");
      assert.ok(!custodySet.has("version"), "custody_transfers MUST NOT contain version column!");

      const { rows: auditCols } = await client.query<{ column_name: string }>(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'audit_events';
      `);
      const auditSet = new Set(auditCols.map((c) => c.column_name));
      assert.ok(!auditSet.has("updated_at"), "audit_events MUST NOT contain updated_at column!");
      assert.ok(!auditSet.has("version"), "audit_events MUST NOT contain version column!");
    });

    // -------------------------------------------------------------------------
    // 5. DNA Profile & Allele Loci Verification
    // -------------------------------------------------------------------------
    await test("Synthetic DNA profile contains verified 20 standard CODIS STR loci", async () => {
      const { rows } = await client.query<{ count: string }>(`
        SELECT COUNT(*)::text as count 
        FROM str_alleles a
        JOIN dna_profiles p ON a.dna_profile_id = p.id
        WHERE p.profile_identifier = 'KFIN-SYN-DNA-2026-0001';
      `);
      assert.equal(parseInt(rows[0].count, 10), 20, "Expected exactly 20 CODIS STR loci for synthetic profile");
    });

    // -------------------------------------------------------------------------
    // 6. Zero Real Forensic Data Safety Audit
    // -------------------------------------------------------------------------
    await test("Zero real citizen or personal identifiers in persistence layer", async () => {
      const { rows: userEmails } = await client.query<{ email: string }>(`
        SELECT email FROM users WHERE email NOT LIKE '%@kfin.test';
      `);
      assert.equal(userEmails.length, 0, "Found non-synthetic user email in database!");

      const { rows: caseNumbers } = await client.query<{ case_number: string }>(`
        SELECT case_number FROM cases WHERE case_number NOT LIKE 'KFIN-SYN-%';
      `);
      assert.equal(caseNumbers.length, 0, "Found non-synthetic case number in database!");
    });

    console.log("\n=====================================================================");
    console.log(`       ALL ${passCount}/${testCount} DATABASE INTEGRITY TESTS PASSED! ✅`);
    console.log("=====================================================================");
  } finally {
    client.release();
    await pool.end();
  }
}

runDatabaseTests().catch((err) => {
  console.error("Database test suite failed:", err);
  process.exit(1);
});
