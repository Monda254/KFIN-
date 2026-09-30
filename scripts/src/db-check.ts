import { pool } from "@workspace/db";

async function main() {
  console.log("Testing Supabase PostgreSQL connectivity via @workspace/db ...");
  try {
    const res = await pool.query(`
      SELECT 
        version() as pg_version,
        current_database() as database_name,
        current_user as db_user,
        now() as server_time;
    `);

    const row = res.rows[0];
    console.log("✅ Successfully connected to Supabase Database!");
    console.log(`Database:    ${row.database_name}`);
    console.log(`User:        ${row.db_user}`);
    console.log(`Server Time: ${row.server_time}`);
    console.log(`Version:     ${row.pg_version}`);

    // Check and initialize extensions
    await pool.query("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
    await pool.query("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";");
    try {
      await pool.query("CREATE EXTENSION IF NOT EXISTS postgis;");
    } catch (e: any) {
      console.log("PostGIS notice:", e.message);
    }

    const extRes = await pool.query(`
      SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'postgis');
    `);
    console.log("Installed Extensions:", extRes.rows);


  } catch (err: any) {
    console.error("❌ Database connection error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
