import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { existsSync } from "node:fs";
import { join } from "node:path";
import * as schema from "./schema";

const { Pool } = pg;

// Automatically load root .env file if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPaths = [
    join(process.cwd(), ".env"),
    join(process.cwd(), "..", ".env"),
    join(process.cwd(), "..", "..", ".env"),
  ];
  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      try {
        process.loadEnvFile(envPath);
        break;
      } catch {}
    }
  }
}

const connectionString = process.env.DATABASE_URL;
const isLocalhost = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

export const pool = new Pool({
  connectionString: connectionString || "postgresql://postgres:postgres@localhost:5432/kfin_dev",
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

export * from "./schema";


