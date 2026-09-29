import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const ignoredFiles = new Set([
  ".env",
  ".env.local",
  ".env.development",
  ".env.test",
  ".env.example",
  ".env.test.example",
  "scripts/src/secret-scan.ts", // Exclude the scanner itself to prevent self-matching regexes
]);

const secretPatterns: { name: string; pattern: RegExp }[] = [
  { name: "AWS Access Key", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: "Private Key", pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "GitHub Token", pattern: /\b(?:ghp|github_pat|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{16,}\b/ },
  { name: "Stripe Secret Key", pattern: /\b(?:sk_live|sk_test|rk_live|rk_test)_[0-9a-zA-Z]{24,}\b/ },
  { name: "Slack Token", pattern: /\bxox[baprs]-[0-9a-zA-Z-]{10,}\b/ },
  { name: "Google API Key", pattern: /\bAIzaSy[0-9A-Za-z_-]{33}\b/ },
  { name: "Hardcoded Database Password", pattern: /\b(?:postgres|postgresql|mysql|mongodb):\/\/(?!postgres:postgres@localhost)[^:\s]+:[^@\s]+@[a-zA-Z0-9.-]+:[0-9]+/ },
];

function trackedFiles(): string[] {
  try {
    return execFileSync("git", ["ls-files", "-z"], { cwd: root })
      .toString()
      .split("\0")
      .filter(Boolean);
  } catch {
    return [];
  }
}

const files = trackedFiles();
const findings: { file: string; rule: string }[] = [];

for (const file of files) {
  const normalizedPath = file.replace(/\\/g, "/");
  if (ignoredFiles.has(normalizedPath)) continue;

  let contents: string;
  try {
    if (statSync(join(root, file)).size > 1_000_000) continue;
    contents = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }

  for (const { name, pattern } of secretPatterns) {
    if (pattern.test(contents)) {
      findings.push({ file: relative(root, file), rule: name });
      break;
    }
  }
}

if (findings.length > 0) {
  console.error("❌ CRITICAL: Potential committed secrets detected:");
  for (const finding of findings) {
    console.error(`   - [${finding.rule}] in file: ${finding.file}`);
  }
  process.exit(1);
}

console.log(`✅ Secret scan passed: ${files.length} tracked files verified clean.`);