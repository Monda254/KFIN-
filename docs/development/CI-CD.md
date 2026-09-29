# KFIN Continuous Integration & Continuous Delivery (CI/CD) Architecture

**Document ID:** KFIN-DEV-CICD-001  
**Phase:** 0.3 — Development Tooling, CI/CD & Quality Automation  
**Authoritative Status:** Active Engineering Specification  
**Governed By:** KFIN Technical Architecture & Development Constitution  

---

## 1. CI/CD Architecture Overview

The KFIN CI/CD infrastructure is engineered around four isolated workflow boundaries to maintain strict separation of concerns, rapid feedback, and fail-closed quality verification:

```text
Feature Branch
      ↓ (Pull Request)
[Workflow 1: PR CI Pipeline] (.github/workflows/quality.yml)
      │  • Code Formatting Check
      │  • Architecture Boundary Linting
      │  • TypeScript Typecheck (Strict)
      │  • Unit, Contract & Integration Tests
      │  • Secret & SAST Scanning
      │  • Dependency Audit
      │  • Documentation Link Auditing
      ↓ (Merge to main)
[Workflow 2: Main Integration Pipeline] (.github/workflows/main-pipeline.yml)
      │  • Complete Validation Suite
      │  • Monorepo Build Artifact Verification
      │  • Build Metadata Generation & Provenance
      ↓ (Version Tag / Release Dispatch)
[Workflow 3: Release Pipeline] (.github/workflows/release-pipeline.yml)
      │  • Full Quality & Security Gate
      │  • Artifact Bundle Packaging (tar.gz)
      │  • Staging / Dry-Run Release Gate (Fail-closed on production)
```

---

## 2. Pipeline Triggers & Concurrency Controls

| Pipeline Name | Trigger Events | Concurrency Policy | Timeout |
| :--- | :--- | :--- | :--- |
| **Pull Request CI** | `pull_request: branches: [main]` | `cancel-in-progress: true` | 15 minutes |
| **Main Integration** | `push: branches: [main]` | `cancel-in-progress: false` | 20 minutes |
| **Release Pipeline** | `workflow_dispatch` (Manual) | Queue per version tag | 25 minutes |

---

## 3. Environment Separation Matrix

| Environment | Purpose | Infrastructure / Hosting | Data Policy |
| :--- | :--- | :--- | :--- |
| **Local** | Developer workstation iteration | Local Node 24 runtime & local daemons | Mock / In-memory data only |
| **Test** | Automated CI validation runner | GitHub Actions ephemeral Ubuntu runners | Isolated `.env.test.example` synthetic data |
| **Staging** | Pre-release integration & preview | Vercel preview / container staging | Fictional synthetic datasets only |
| **Production** | National forensic operations | Isolated Kenyan Sovereign Cloud (Phase 1+) | STRICTLY LOCKED during Phase 0 |

---

## 4. Permissions & Security Model

In alignment with Phase 0.3 Requirements 66–68:
* **Minimal Scope:** Workflows run with default read-only permissions (`contents: read`).
* **Third-Party Actions:** All external actions are pinned to major or full SHA versions (`actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`).
* **Zero Secret Exposure:** No production credentials, database connection strings, or encryption keys are accessible by CI runners.

---

## 5. Artifact Management & Provenance

During main branch integration and release packaging, build artifacts are compiled deterministically:
* **API Server:** Compiled into ESM bundle (`artifacts/api-server/dist/index.mjs`) via `esbuild`.
* **KFIN Console:** Compiled into static client bundle (`artifacts/kfin-console/dist/public/`) via Vite.
* **Build Metadata:** Recorded in `.build-metadata/build-info.json` capturing commit SHA, timestamp, and runner environment.
* **Immutability:** Released artifact tarballs are keyed to immutable release tags (`vX.Y.Z`).

---

## 6. Failure Handling & Policy

1. **Authoritative CI:** CI is the single authoritative source of truth for code merge eligibility. "Works locally on my machine" is not an acceptable justification for a failing gate.
2. **Fail-Closed Gate:** If any stage of the pipeline encounters an unexpected failure, network timeout, or scanning error, the entire workflow fails closed.
3. **Flaky Test Protocol:** Any test exhibiting non-deterministic behavior must be reported as a technical debt item, quarantined with explicit documentation, and remediated within 48 hours.
