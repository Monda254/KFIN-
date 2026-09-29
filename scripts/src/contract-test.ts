import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const root = join(import.meta.dirname, "..", "..");

const openApiPath = join(root, "lib/api-spec/openapi.yaml");
const openApiContent = readFileSync(openApiPath, "utf8");

// 1. Verify OpenAPI Header Structure
assert.match(openApiContent, /^openapi:\s*3\.[01]\.\d+/m, "OpenAPI version must be 3.0+ or 3.1+");
assert.match(openApiContent, /title:\s*Api/m, "API Title must be defined");
assert.match(openApiContent, /version:\s*0\.1\.0/m, "API Version must be 0.1.0");

// 2. Verify Contract Endpoints
assert.match(openApiContent, /\/healthz:/, "Contract must specify /healthz endpoint");
assert.match(openApiContent, /operationId:\s*healthCheck/, "healthCheck operation must be declared");
assert.match(openApiContent, /HealthStatus:/, "HealthStatus schema component must be defined");

// 3. Verify Implementation Route Alignment
const routePath = join(root, "artifacts/api-server/src/routes/health.ts");
const routeContent = readFileSync(routePath, "utf8");
assert.match(routeContent, /router\.get\(\s*["']\/healthz["']/, "Express health router must implement GET /healthz");
assert.match(routeContent, /HealthCheckResponse\.parse/, "Health route must validate against zod schema contract");

console.log("✅ Contract tests passed: OpenAPI specification aligns with server implementation.");
