# KFIN Tooling Inventory

**Document ID:** KFIN-DEV-008  
**Phase:** Phase 0 — Development Foundation  
**Sub-Phase:** 0.3 — Development Tooling, CI/CD & Quality Automation  
**Classification:** Internal Technical Governance  
**Status:** Approved & Enforced  

---

## 1. Overview

This document records the authoritative inventory of all engineering tools, compilers, linters, security scanners, and automation frameworks established for the Kenya Forensic Intelligence Network (KFIN) development repository.

In strict compliance with the **Tooling Principle** (Phase 0.3 Master Implementation Prompt §7), KFIN maintains *one primary authoritative tool* per engineering function to eliminate redundancy, operational overhead, and conflicting quality standards.

---

## 2. Tooling Registry

| Tool | Category | Purpose | Scope | Status | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Node.js 24 LTS** | Runtime Environment | Authoritative execution runtime for services, scripts, and build tooling | Repository-wide | Active | Infrastructure & Tooling |
| **pnpm 10 / 12** | Package Management | Deterministic, workspace-isolated dependency management with supply-chain age controls | Monorepo-wide | Active | Core Maintainers |
| **TypeScript 5.9** | Compiler & Type Safety | Static type enforcement with strict null checks and project references | All TS packages & artifacts | Active | Architecture Review Board |
| **Prettier 3.9** | Code Formatter | Deterministic code formatting with standardized rules | Monorepo-wide | Active | Core Maintainers |
| **ESLint & Architecture Boundary Linter** | Static Code & Architecture Linting | Identifies code defects, unhandled promises, and architectural boundary violations | All packages & artifacts | Active | Core Maintainers |
| **Node Test Runner / TSX** | Unit & Integration Test Engine | Fast, zero-dependency foundation test execution for utilities, configs, and health | Monorepo tests & scripts | Active | Testing & QA Lead |
| **OpenAPI Contract Validator** | Contract Testing | Validates API schemas (`openapi.yaml`) against registered Express route definitions | `lib/api-spec`, `artifacts/api-server` | Active | API & Interoperability Lead |
| **esbuild 0.28** | Production Bundler | High-speed ESM bundling for backend artifacts and runtime workers | `artifacts/api-server` | Active | Core Maintainers |
| **Vite 7.3** | Frontend Build Engine | High-performance client build and bundling for the forensic dashboard | `artifacts/kfin-console` | Active | Frontend Architecture Lead |
| **Secret Scan Engine** | Secret Detection | Scans all tracked repository files for high-entropy tokens, AWS keys, and private keys | Monorepo-wide | Active | Security Review Board |
| **SAST Scanner** | Static Application Security | Scans codebase for dangerous eval, command injection, path traversal, and unsafe crypto | Monorepo-wide | Active | Security Review Board |
| **pnpm audit** | Software Composition Analysis (SCA) | Automated detection of known CVE vulnerabilities in third-party dependencies | Monorepo dependencies | Active | Security Review Board |
| **Documentation & Link Validator** | Documentation CI | Verifies existence, integrity, and markdown link validity of architectural documents | `docs/`, `database/`, repository | Active | Governance & Compliance |
| **GitHub Actions** | CI/CD Platform | Orchestration of mandatory quality gates, PR checks, main branch verification, and releases | Repository `.github/workflows` | Active | Infrastructure & Tooling |
| **Vercel Gateway** | Deployment Platform | Serverless preview and deployment verification for KFIN Console and API Gateway | Repository deployments | Active | Core Maintainers |

---

## 3. Tool Justification & Retention Assessment

Each tool has been evaluated against the six mandatory questions in Phase 0.3 §3:

1. **Node.js & pnpm:**
   - *Problem Solved:* Deterministic package installation with hardened lockfile verification.
   - *Why Required:* Monorepo architecture requires strict workspace symlink isolation and supply-chain delay filters (`minimumReleaseAge: 1440`).
   - *Maintenance Burden:* Minimal; automated lockfile updates.

2. **TypeScript 5.9:**
   - *Problem Solved:* Eliminates runtime type errors and enforces contract consistency across monorepo boundaries.
   - *Why Required:* Forensic intelligence requires compile-time correctness for data models and API schemas.
   - *Maintenance Burden:* Low; standardized `tsconfig.base.json`.

3. **Prettier & Linters:**
   - *Problem Solved:* Eliminates formatting debates and prevents architectural boundary breaches (e.g. frontend importing database internals).
   - *Why Required:* Enforces pristine code hygiene and forensic auditability.
   - *Maintenance Burden:* Zero; fully automated in CI and local `pnpm run validate`.

4. **Secret Scanner & SAST Scanner:**
   - *Problem Solved:* Detects committed credentials and unsafe code patterns before code is merged.
   - *Why Required:* Sovereign national forensic system; credentials must never enter source control.
   - *Maintenance Burden:* Lightweight custom TSX engine; zero external cloud service dependency.

---

## 4. Single Authoritative Tool Principle

KFIN explicitly prohibits competing tools in the same workspace category:
- **No overlapping package managers:** `pnpm` is strictly enforced via `only-allow pnpm` preinstall hook; `npm` and `yarn` are blocked.
- **No overlapping formatters:** Prettier is the sole code formatter.
- **No overlapping build tools:** `esbuild` for Node backend, `Vite` for React frontend.
- **No overlapping CI engines:** GitHub Actions is the authoritative CI pipeline.
