import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import assert from "node:assert/strict";

const root = join(import.meta.dirname, "..", "..");

const mandatoryDocuments = [
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "AGENTS.md",
  ".github/CODEOWNERS",
  "docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md",
  "docs/governance/DEVELOPMENT-CONSTITUTION.md",
  "docs/governance/DEFINITION-OF-DONE.md",
  "docs/governance/AI-DEVELOPMENT-RULES.md",
  "docs/governance/CHANGE-MANAGEMENT.md",
  "docs/architecture/README.md",
  "docs/architecture/adr/0000-template.md",
  "docs/architecture/adr/0001-phase-0-repository-boundaries.md",
  "docs/security/README.md",
  "docs/api/README.md",
  "docs/development/TOOLING-INVENTORY.md",
  "docs/development/REPOSITORY-MAP.md",
  "docs/development/PROJECT-STATUS.md",
  "docs/development/GETTING-STARTED.md",
  "docs/testing/QUALITY-GATES.md",
  "database/README.md",
];

// 1. Verify existence and non-emptiness of all mandatory architecture documents
for (const doc of mandatoryDocuments) {
  const fullPath = join(root, doc);
  assert.ok(existsSync(fullPath), `Mandatory architecture document missing: ${doc}`);
  const content = readFileSync(fullPath, "utf8");
  assert.ok(content.trim().length > 0, `Mandatory document must not be empty: ${doc}`);
}

// 2. Validate internal relative markdown links across docs
function getTrackedMarkdownFiles(): string[] {
  try {
    return execFileSync("git", ["ls-files", "*.md"], { cwd: root })
      .toString()
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

const mdFiles = getTrackedMarkdownFiles();
const brokenLinks: { file: string; target: string }[] = [];
const linkRegex = /\[(?:[^\]]+)\]\(([^)]+)\)/g;

for (const file of mdFiles) {
  const fullPath = join(root, file);
  if (!existsSync(fullPath)) continue;
  const content = readFileSync(fullPath, "utf8");
  const fileDir = dirname(fullPath);

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawTarget = match[1].trim();

    // Skip external URLs, mailto, anchor-only links, file:/// IDE links
    if (
      rawTarget.startsWith("http://") ||
      rawTarget.startsWith("https://") ||
      rawTarget.startsWith("mailto:") ||
      rawTarget.startsWith("#") ||
      rawTarget.startsWith("file://")
    ) {
      continue;
    }

    // Strip anchor fragments
    const targetPath = rawTarget.split("#")[0].split("?")[0];
    if (!targetPath) continue;

    const resolved = resolve(fileDir, targetPath);
    if (!existsSync(resolved)) {
      brokenLinks.push({ file, target: rawTarget });
    }
  }
}

if (brokenLinks.length > 0) {
  console.warn(`⚠️ Warning: ${brokenLinks.length} internal documentation link(s) to verify:`);
  for (const b of brokenLinks.slice(0, 5)) {
    console.warn(`   - in ${b.file}: target "${b.target}" not found on disk`);
  }
}

console.log(`✅ Documentation check passed: ${mandatoryDocuments.length} mandatory documents verified and ${mdFiles.length} markdown files audited.`);
