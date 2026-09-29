# KFIN Engineering Toolchain Specification

**Document ID:** KFIN-DEV-TC-001  
**Phase:** 0.3 — Development Tooling, CI/CD & Quality Automation  
**Authoritative Status:** Approved Toolchain Standard  
**Governed By:** KFIN Technical Architecture  

---

## 1. Toolchain Philosophy

KFIN enforces the **"One Primary Tool" principle**: rather than installing overlapping, redundant, or competing tools, each development and verification domain is governed by an authoritative utility.

```text
TypeScript 5.9 / Node.js 24 / pnpm 10
       │
       ├── Formatting: Prettier 3.x
       ├── Linting: KFIN Architecture Boundary Linter
       ├── Type Checking: TypeScript Compiler (tsc)
       ├── Testing: KFIN Foundation, Contract, Integration & E2E Runners
       ├── Security: KFIN Secret Scanner + KFIN SAST + pnpm audit
       ├── Build: esbuild + Vite 7
       └── CI/CD: GitHub Actions (Pinned Workflows)
```

---

## 2. Toolchain Inventory & Technical Details

### 2.1 Package Management & Monorepo Engine
* **Tool:** `pnpm` (version `10.29.3`)
* **Configuration:** `pnpm-workspace.yaml`, `.npmrc`
* **Features:** Strict workspace boundary isolation, content-addressable storage, symlinked node modules, frozen lockfile verification (`pnpm-lock.yaml`).

### 2.2 Code Formatting
* **Tool:** `prettier` (version `^3.9.6`)
* **Configuration:** `.prettierrc`
* **Command:** `pnpm run format` (auto-format) / `pnpm run format:check` (CI verification)
* **Scope:** Root configuration files and markdown documentation.

### 2.3 Architectural Linting
* **Tool:** `architecture-lint.ts` (custom AST and path-based dependency scanner)
* **Command:** `pnpm run lint` / `pnpm run lint:check`
* **Enforced Invariants:**
  * UI applications (`artifacts/kfin-console`) cannot import database internals or ORM packages.
  * Shared core packages cannot import application-level artifacts.
  * Layer boundaries between domain models and persistence remain inviolate.

### 2.4 Static Type Checking
* **Tool:** TypeScript Compiler (`tsc`, version `~5.9.3`)
* **Configuration:** `tsconfig.base.json`, per-package `tsconfig.json`
* **Command:** `pnpm run typecheck`
* **Features:** Strict type safety, incremental build cache (`--build`), zero implicit any.

### 2.5 Automated Testing Framework
* **Foundation Tests:** `foundation-test.ts` (`pnpm run test:unit`) validates structural presence and integrity of all 35 architectural specs.
* **Contract Tests:** `contract-test.ts` (`pnpm run test:contract`) asserts parity between OpenAPI yaml specifications and backend Express route handlers.
* **Integration Tests:** `integration-test.ts` (`pnpm run test:integration`) verifies environment variable isolation and synthetic data policy enforcement.
* **E2E Smoke Tests:** `e2e-smoke.ts` (`pnpm run test:e2e`) verifies that production bundles for API server and frontend console compile with correct entrypoints.

### 2.6 Application Security Analysis (SAST & Secrets)
* **Secret Scanner:** `secret-scan.ts` (`pnpm run security:secrets`) monitors AWS keys, GitHub tokens, DB connection strings, and private keys.
* **Static Analysis:** `sast-scan.ts` (`pnpm run security:sast`) scans for `eval()`, shell interpolation, weak ciphers, and unescaped DOM injections.
* **Dependency Vulnerability Audit:** `pnpm audit --audit-level=high` (`pnpm run security:dependencies`).

### 2.7 Build & Bundling System
* **Backend API Server:** `build.mjs` utilizing `esbuild` compiling into ESM bundles with externalized Node native drivers.
* **Frontend Web Console:** `vite build` utilizing `vite.config.ts` producing optimized client distribution with asset hashing.

---

## 3. Command Contract Quick Reference

| Command | Action Performed | Local / CI |
| :--- | :--- | :--- |
| `pnpm install` | Install dependencies deterministically | Local / CI |
| `pnpm run clean` | Clean all `dist` and build caches | Local |
| `pnpm run format:check` | Verify code formatting compliance | Local / CI |
| `pnpm run lint` | Execute architectural boundary linter | Local / CI |
| `pnpm run typecheck` | Run strict TypeScript compiler verification | Local / CI |
| `pnpm run test` | Run unit, contract, and integration tests | Local / CI |
| `pnpm run build` | Compile backend and frontend production bundles | Local / CI |
| `pnpm run security` | Execute secrets, SAST, and dependency scans | Local / CI |
| `pnpm run docs:check` | Audit markdown links and mandatory documents | Local / CI |
| `pnpm run validate` | **Single authoritative gate orchestrating all checks** | Local / CI |
