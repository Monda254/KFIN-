import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = join(import.meta.dirname, "..", "..");

// 1. Verify API Server Production Build Output
const apiDist = join(root, "artifacts/api-server/dist/index.mjs");
assert.ok(existsSync(apiDist), "artifacts/api-server/dist/index.mjs must exist after build");

const apiDistContent = readFileSync(apiDist, "utf8");
assert.ok(apiDistContent.length > 10_000, "API server production bundle must contain compiled code");
assert.match(apiDistContent, /express/, "API server bundle must reference Express");

// 2. Verify KFIN Console Frontend Production Build Output
const consoleHtml = join(root, "artifacts/kfin-console/dist/public/index.html");
assert.ok(existsSync(consoleHtml), "artifacts/kfin-console/dist/public/index.html must exist after build");

const consoleHtmlContent = readFileSync(consoleHtml, "utf8");
assert.match(consoleHtmlContent, /<!doctype html>/i, "Frontend build must produce valid HTML");
assert.match(consoleHtmlContent, /<div id="root">/i, "Frontend HTML must provide root mount point");

console.log("✅ E2E smoke foundation passed: Production backend and frontend artifacts verified.");
