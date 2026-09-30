import { defineConfig } from "drizzle-kit";
import path from "path";

const dbUrl = process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kfin_dev";

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "../../database/migrations"),
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});

