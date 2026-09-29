import { readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");

interface BoundaryRule {
  id: string;
  description: string;
  sourceScope: RegExp; // which files this rule applies to
  forbiddenPatterns: RegExp[];
}

const boundaryRules: BoundaryRule[] = [
  {
    id: "ARCH-001",
    description: "Frontend applications must never directly import database internals or drivers",
    sourceScope: /^artifacts\/kfin-console\//,
    forbiddenPatterns: [
      /@workspace\/db/,
      /\bdrizzle-orm\b/,
      /\bpg\b/,
      /\.\.\/\.\.\/(?:database|lib\/db)\//,
    ],
  },
  {
    id: "ARCH-002",
    description: "Mockup sandbox must remain isolated from backend database layer",
    sourceScope: /^artifacts\/mockup-sandbox\//,
    forbiddenPatterns: [
      /@workspace\/db/,
      /\bdrizzle-orm\b/,
      /\bpg\b/,
      /\.\.\/\.\.\/(?:database|lib\/db)\//,
    ],
  },
  {
    id: "ARCH-003",
    description: "Core library packages must not import application artifacts",
    sourceScope: /^lib\//,
    forbiddenPatterns: [
      /@workspace\/api-server/,
      /@workspace\/kfin-console/,
      /\.\.\/\.\.\/artifacts\//,
    ],
  },
];

function getTrackedFiles(): string[] {
  try {
    return execFileSync("git", ["ls-files", "-z"], { cwd: root })
      .toString()
      .split("\0")
      .filter((file) => {
        const ext = file.split(".").pop();
        return (
          (ext === "ts" || ext === "tsx" || ext === "js" || ext === "json") &&
          !file.startsWith("node_modules/") &&
          !file.includes("/dist/") &&
          !file.endsWith(".d.ts") &&
          file !== "scripts/src/architecture-lint.ts"
        );
      });
  } catch {
    return [];
  }
}

const files = getTrackedFiles();
const violations: { file: string; line: number; rule: BoundaryRule; match: string }[] = [];

for (const file of files) {
  const normalizedFile = file.replace(/\\/g, "/");
  const applicableRules = boundaryRules.filter((r) => r.sourceScope.test(normalizedFile));
  if (applicableRules.length === 0) continue;

  try {
    const fullPath = join(root, file);
    if (statSync(fullPath).size > 1_000_000) continue;
    const content = readFileSync(fullPath, "utf8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      for (const rule of applicableRules) {
        for (const pattern of rule.forbiddenPatterns) {
          if (pattern.test(line)) {
            violations.push({
              file: normalizedFile,
              line: i + 1,
              rule,
              match: trimmed.substring(0, 100),
            });
          }
        }
      }
    }
  } catch {
    continue;
  }
}

if (violations.length > 0) {
  console.error("❌ CRITICAL: Architectural Boundary Violations Detected:");
  for (const v of violations) {
    console.error(`   - [${v.rule.id}] ${v.rule.description}`);
    console.error(`     At: ${v.file}:${v.line}`);
    console.error(`     Code: ${v.match}`);
  }
  process.exit(1);
}

console.log(`✅ Architectural Boundary Linting passed: Monorepo boundaries strictly respected across ${files.length} audited files.`);
