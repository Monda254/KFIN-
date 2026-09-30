import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@workspace/db";

const migrationsDir = join(import.meta.dirname, "..", "..", "database", "migrations");

async function runMigrations() {
  console.log("=====================================================================");
  console.log("             KFIN DATABASE MIGRATION ENGINE (POSTGRESQL)");
  console.log("=====================================================================");

  const client = await pool.connect();
  try {
    // 1. Ensure tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS __kfin_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // 2. Fetch already applied migrations
    const { rows: appliedRows } = await client.query<{ name: string }>(
      "SELECT name FROM __kfin_migrations ORDER BY id ASC;"
    );
    const appliedNames = new Set(appliedRows.map((r) => r.name));

    // 3. Find pending migration files
    const allFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pendingFiles = allFiles.filter((f) => !appliedNames.has(f));

    if (pendingFiles.length === 0) {
      console.log("✅ Database is already up to date. Zero pending migrations.");
      return;
    }

    console.log(`Found ${pendingFiles.length} pending migration(s) to apply:`);
    for (const file of pendingFiles) {
      console.log(`  - ${file}`);
    }

    // 4. Apply each pending migration inside a transaction
    for (const file of pendingFiles) {
      console.log(`\nApplying migration: ${file} ...`);
      const fullPath = join(migrationsDir, file);
      const content = readFileSync(fullPath, "utf8");

      // Split statements by Drizzle's standard statement-breakpoint delimiter
      const statements = content
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const startTime = Date.now();
      await client.query("BEGIN;");
      try {
        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i];
          try {
            await client.query(stmt);
          } catch (err: any) {
            // Handle idempotent type or extension warnings gracefully
            if (err.message.includes("already exists")) {
              continue;
            }
            throw err;
          }
        }

        // Record migration as applied
        await client.query(
          "INSERT INTO __kfin_migrations (name) VALUES ($1);",
          [file]
        );

        await client.query("COMMIT;");
        const elapsed = Date.now() - startTime;
        console.log(`✅ Applied ${file} successfully in ${elapsed}ms (${statements.length} statements).`);
      } catch (err: any) {
        await client.query("ROLLBACK;");
        console.error(`❌ Migration failed on ${file}:`, err.message);
        throw err;
      }
    }

    console.log("\n=====================================================================");
    console.log("           ALL MIGRATIONS COMPLETED SUCCESSFULLY! 🎉");
    console.log("=====================================================================");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((err) => {
  console.error("Migration execution halted:", err);
  process.exit(1);
});
