import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = join(import.meta.dirname, "..", "..");

// 1. Verify Test Environment Isolation
const envTestExamplePath = join(root, ".env.test.example");
assert.ok(existsSync(envTestExamplePath), ".env.test.example must exist for test environment isolation");

const envTestContent = readFileSync(envTestExamplePath, "utf8");
assert.match(envTestContent, /DATABASE_URL=/);
assert.match(envTestContent, /test|localhost|127\.0\.0\.1/, "Test database URL must point to local/test instance");

// Ensure production credentials/hosts are NEVER referenced in test configs
assert.doesNotMatch(envTestContent, /production|prod\.kfin/i, "Test environment must not reference production domains");

// 2. Verify Test Fixtures Directory & Synthetic Data Rule
const fixtureReadme = join(root, "tests/fixtures/README.md");
assert.ok(existsSync(fixtureReadme), "tests/fixtures/README.md must document synthetic fixture rules");

const fixtureContent = readFileSync(fixtureReadme, "utf8");
assert.match(fixtureContent, /synthetic/i, "Fixtures must explicitly declare synthetic data policy");
assert.match(fixtureContent, /Zero Real Forensic Data/i, "Fixtures must explicitly prohibit real forensic data");

console.log("✅ Integration test foundation passed: Test environment isolation and synthetic data policy verified.");
