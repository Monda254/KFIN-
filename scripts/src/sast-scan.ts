import { readFileSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");

interface Rule {
  id: string;
  name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  pattern: RegExp;
  fileFilter?: (path: string) => boolean;
}

const rules: Rule[] = [
  {
    id: "SAST-001",
    name: "Unsafe Dynamic Code Execution (eval)",
    severity: "CRITICAL",
    pattern: /\beval\s*\(/,
  },
  {
    id: "SAST-002",
    name: "Unsafe Function Constructor",
    severity: "CRITICAL",
    pattern: /\bnew\s+Function\s*\(/,
  },
  {
    id: "SAST-003",
    name: "Deprecated Insecure Node Cipher",
    severity: "HIGH",
    pattern: /\bcrypto\.createCipher\s*\(/,
  },
  {
    id: "SAST-004",
    name: "Raw Shell Command Execution with Template Literal",
    severity: "HIGH",
    pattern: /\b(?:exec|execSync)\s*\(\s*`[^`]*\${/,
  },
  {
    id: "SAST-005",
    name: "Direct DOM HTML Injection",
    severity: "HIGH",
    pattern: /\bdocument\.write\s*\(/,
  },
];

function getTrackedSourceFiles(): string[] {
  try {
    return execFileSync("git", ["ls-files", "-z"], { cwd: root })
      .toString()
      .split("\0")
      .filter((file) => {
        const ext = file.split(".").pop();
        return (
          (ext === "ts" || ext === "tsx" || ext === "js" || ext === "mjs") &&
          !file.startsWith("node_modules/") &&
          !file.includes("/dist/") &&
          !file.endsWith(".d.ts") &&
          file !== "scripts/src/sast-scan.ts" // Exclude scanner itself
        );
      });
  } catch {
    return [];
  }
}

const files = getTrackedSourceFiles();
const findings: { file: string; line: number; rule: Rule; snippet: string }[] = [];

for (const file of files) {
  const fullPath = join(root, file);
  try {
    if (statSync(fullPath).size > 1_000_000) continue;
    const content = readFileSync(fullPath, "utf8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip commented lines
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      for (const rule of rules) {
        if (rule.pattern.test(line)) {
          findings.push({
            file,
            line: i + 1,
            rule,
            snippet: trimmed.substring(0, 100),
          });
        }
      }
    }
  } catch {
    continue;
  }
}

if (findings.length > 0) {
  console.error("❌ CRITICAL: SAST Security Scan detected vulnerabilities:");
  for (const f of findings) {
    console.error(`   - [${f.rule.severity}] ${f.rule.name} (${f.rule.id}) at ${f.file}:${f.line}`);
    console.error(`     Snippet: ${f.snippet}`);
  }
  process.exit(1);
}

console.log(`✅ SAST Scan passed: 0 vulnerabilities found across ${files.length} source files.`);
