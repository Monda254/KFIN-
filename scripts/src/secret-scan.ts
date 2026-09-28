import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const ignored = new Set([".env", ".env.local", ".env.development", ".env.test"]);
const secretPatterns = [
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|github_pat|sk_live|sk_test)_[A-Za-z0-9_]{16,}\b/,
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
const findings: string[] = [];

for (const file of files) {
  const name = file.split("/").pop() ?? file;
  if (ignored.has(name)) continue;

  let contents: string;
  try {
    if (statSync(join(root, file)).size > 1_000_000) continue;
    contents = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }

  for (const pattern of secretPatterns) {
    if (pattern.test(contents)) {
      findings.push(relative(root, file));
      break;
    }
  }
}

if (findings.length > 0) {
  console.error(`Potential committed secret detected in: ${findings.join(", ")}`);
  process.exit(1);
}

console.log(`Secret scan passed for ${files.length} tracked files.`);