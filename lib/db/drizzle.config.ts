import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";
import { join } from "node:path";

if (!process.env.DATABASE_URL && !process.env.DATABASE_MIGRATION_URL) {
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

const dbUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kfin_dev";

const isLocalhost = !dbUrl || dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "../../database/migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url: dbUrl,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
  },
});

