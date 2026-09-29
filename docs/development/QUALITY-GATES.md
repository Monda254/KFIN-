# KFIN Quality Gates & Engineering Enforcement Baseline

**Document ID:** KFIN-DEV-QG-001  
**Phase:** 0.3 — Development Tooling, CI/CD & Quality Automation  
**Authoritative Status:** Active Engineering Baseline  
**Governed By:** KFIN Development Constitution  

---

## 1. Objective & Philosophy

The KFIN Quality Gates system converts architectural principles and development policies into **deterministic, automated engineering controls**. 

In adherence to the **Fail-Closed Principle**, uncertainty or failures in verification must result in an immediate pipeline halt (`FAIL`), preventing unverified or non-compliant code from merging into `main` or advancing toward release.

---

## 2. Mandatory Quality Gates

Every code change submitted via Pull Request or committed to `main` must pass the following 10 automated quality gates orchestratable via a single command:

```bash
pnpm run validate
```

| Gate # | Gate Name | Underlying Tool / Mechanism | Command | Enforcement Scope | Blocking Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **QG-01** | **Code Formatting** | Prettier 3.x | `pnpm run format:check` | Repository root & workspace files | Blocking |
| **QG-02** | **Architecture Boundary Lint** | Custom Monorepo Boundary Linter | `pnpm run lint` | 170+ workspace source files | Blocking |
| **QG-03** | **Strict TypeScript Typing** | TypeScript Compiler 5.9.x (`tsc --build`) | `pnpm run typecheck` | All packages (`packages/*`, `artifacts/*`, `scripts`) | Blocking |
| **QG-04** | **Unit & Foundation Tests** | TypeScript Foundation Runner | `pnpm run test:unit` | Documentation integrity & core utilities | Blocking |
| **QG-05** | **Contract Testing** | OpenAPI Contract Validator | `pnpm run test:contract` | Schema alignment against implementation | Blocking |
| **QG-06** | **Integration Isolation** | Test Environment Harness | `pnpm run test:integration` | Synthetic data isolation & test env safety | Blocking |
| **QG-07** | **Deterministic Build** | ESBuild / Vite 7.x | `pnpm run build` | API server bundle & KFIN Console build | Blocking |
| **QG-08** | **E2E Smoke Verification** | Node.js Artifact Validator | `pnpm run test:e2e` | Production artifact entrypoints & assets | Blocking |
| **QG-09** | **Security Verification** | Multi-engine (Secrets, SAST, Audit) | `pnpm run security` | Regex secret patterns, AST SAST, pnpm audit | Blocking (Critical/High) |
| **QG-10** | **Documentation Integrity** | Markdown & Dead Link Auditor | `pnpm run docs:check` | 21 mandatory architecture specs & links | Blocking |

---

## 3. Severity Handling & Merge Eligibility

Any pull request with a failing gate is **ineligible for merge**. Vulnerability severity thresholds are categorized as follows:

| Finding Severity | Pipeline Action | Resolution Requirement |
| :--- | :--- | :--- |
| **Critical** | **Immediate Hard Block** | Must be remediated before any code review or merge can proceed. |
| **High** | **Immediate Hard Block** | Must be resolved or officially remediated by designated security leads. |
| **Medium** | **Tracked with Backlog Item** | Permitted to merge only with documented technical debt item and target resolution phase. |
| **Low / Info** | **Tracked** | Informational; remediated during regular maintenance cycles. |

---

## 4. Architectural & Security Review Requirements

Certain directory and file modifications alter fundamental KFIN security or structural trust boundaries. The following triggers mandate designated CODEOWNER sign-off in addition to green automated checks:

1. **Security Changes (`/docs/security/`, `/scripts/src/secret-scan.ts`, `/scripts/src/sast-scan.ts`)**: Mandates `@security-team` review.
2. **Database & Persistence (`/packages/database/`, `/lib/db/`)**: Mandates `@database-team` review.
3. **API & Interface Contracts (`/lib/api-spec/`)**: Mandates `@api-team` review.
4. **CI/CD & Workflows (`.github/workflows/`, `package.json`)**: Mandates `@devops-lead` review.
5. **Architectural Foundations (`/docs/architecture/`, `/docs/constitution/`)**: Mandates Lead Architect review.

---

## 5. Exception & Emergency Override Process

Casual or undocumented bypasses of quality gates are strictly prohibited. In catastrophic emergency scenarios (e.g., active production credential revocation or hotfix deployment), the following protocol must be enacted:

1. **Formal Emergency Request**: An issue with label `emergency` must be logged stating the business justification, authorizer, and bounded scope.
2. **Two-Person Integrity**: Two authorized project leads must review and approve the PR.
3. **Fail-Closed Log**: The override rationale and commit hash must be logged in `docs/development/TECHNICAL-DEBT.md`.
4. **Post-Incident Remediation**: Full regression testing and quality gate restoration must be verified within 24 hours.

---

## 6. AI Agent Enforcement Rule

In accordance with Phase 0.3 Requirement 115 and 116:

* All AI-generated or AI-assisted code submissions are subject to the **exact same** quality gates, linting, type checks, and security scans as human-written contributions.
* There is **zero AI bypass**. No automated agent is permitted to suppress warnings, remove tests, or weaken thresholds.
