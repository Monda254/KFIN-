import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = join(import.meta.dirname, "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

const requiredDocuments = [
  "docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md",
  "docs/governance/DEVELOPMENT-CONSTITUTION.md",
  "docs/governance/DEFINITION-OF-DONE.md",
  "docs/governance/AI-DEVELOPMENT-RULES.md",
  "docs/governance/CHANGE-MANAGEMENT.md",
  "docs/architecture/adr/0000-template.md",
  "docs/architecture/adr/0001-phase-0-repository-boundaries.md",
  "docs/architecture/README.md",
  "docs/security/README.md",
  "docs/api/README.md",
  "docs/development/SETUP.md",
  "docs/development/GETTING-STARTED.md",
  "docs/development/PROJECT-STATUS.md",
  "docs/development/REPOSITORY-MAP.md",
  "docs/development/PHASE-0-SECURITY-AUDIT.md",
  "docs/development/PHASE-0-ARCHITECTURAL-AUDIT.md",
  "docs/development/PHASE-0-RECONCILIATION.md",
  "docs/development/PHASE-0-TRACEABILITY.md",
  "docs/development/PHASE-0.1-COMPLETION-REPORT.md",
  "docs/development/PHASE-0.2-TRACEABILITY.md",
  "docs/development/PHASE-0.2-COMPLETION-REPORT.md",
  "docs/development/PHASE-0-COMPLETION-REPORT.md",
  "docs/testing/QUALITY-GATES.md",
  "database/README.md",
  "database/migrations/README.md",
  "database/seeds/README.md",
  "database/fixtures/README.md",
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "AGENTS.md",
  ".editorconfig",
  ".gitattributes",
  ".nvmrc",
  ".github/CODEOWNERS",
];

for (const document of requiredDocuments) {
  assert.ok(read(document).length > 0, `${document} must not be empty`);
}

const constitution = read("docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md");
assert.match(constitution, /Document ID:\*\* KFIN-GOV-001/);
assert.match(constitution, /## 4\. Architectural Authority/);
assert.match(constitution, /## 21\. Forensic Integrity/);
assert.match(constitution, /## 30\. AI-Assisted Development/);
assert.match(constitution, /## 40\. Definition of Done/);
assert.match(constitution, /## 52\. Phase 0\.1 Boundary and Stop Condition/);
assert.match(constitution, /AI-Assisted Development/);
assert.match(constitution, /Real DNA profiles/);

const adrTemplate = read("docs/architecture/adr/0000-template.md");
assert.match(adrTemplate, /## Security impact/);
assert.match(adrTemplate, /## Data impact/);
assert.match(adrTemplate, /## Operational impact/);

const openApi = read("lib/api-spec/openapi.yaml");
const healthRoute = read("artifacts/api-server/src/routes/health.ts");
assert.match(openApi, /operationId: healthCheck/);
assert.match(healthRoute, /\/healthz/);

const subPhaseReport01 = read("docs/development/PHASE-0.1-COMPLETION-REPORT.md");
assert.match(subPhaseReport01, /Acceptance gate:\*\* PASS/);
assert.match(subPhaseReport01, /Phase 1 status:\*\* LOCKED/);

const subPhaseReport02 = read("docs/development/PHASE-0.2-COMPLETION-REPORT.md");
assert.match(subPhaseReport02, /Acceptance Result:\*\* \*\*PASS\*\*/);

const projectStatus = read("docs/development/PROJECT-STATUS.md");
assert.match(projectStatus, /Current Sub-Phase:\*\* (0\.2|1\.1|1\.2|1\.3)/);

const agentsMd = read("AGENTS.md");
assert.match(agentsMd, /Prime Directive/);

const codeowners = read(".github/CODEOWNERS");
assert.match(codeowners, /@kfin-governance\/core-maintainers/);

const completionReport = read("docs/development/PHASE-0-COMPLETION-REPORT.md");
assert.match(completionReport, /Phase 1 is locked/);

console.log(`Foundation tests passed for ${requiredDocuments.length} required documents.`);