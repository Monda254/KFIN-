import { rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");

const targets = [
  "artifacts/api-server/dist",
  "artifacts/api-server/.tsbuildinfo",
  "artifacts/kfin-console/dist",
  "artifacts/mockup-sandbox/dist",
  "lib/db/dist",
  "lib/db/tsconfig.tsbuildinfo",
  "lib/api-zod/dist",
  "scripts/tsconfig.tsbuildinfo",
];

let cleanedCount = 0;
for (const target of targets) {
  const fullPath = join(root, target);
  if (existsSync(fullPath)) {
    rmSync(fullPath, { recursive: true, force: true });
    cleanedCount++;
  }
}

console.log(`🧹 Clean completed: ${cleanedCount} build artifacts and cache targets removed.`);
