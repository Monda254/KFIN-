# KFIN Engineering Automation Matrix

**Document ID:** KFIN-DEV-AM-001  
**Phase:** 0.3 — Development Tooling, CI/CD & Quality Automation  
**Authoritative Status:** Active Engineering Reference  
**Governed By:** KFIN Development Constitution  

---

## 1. Automation Lifecycle Stages

Engineering validation occurs across four distinct operational checkpoints:

1. **Local Workstation:** Fast feedback for developer ergonomics prior to pushing code.
2. **Pull Request (PR):** Automated merge qualification gate executed on GitHub Actions ephemeral runners.
3. **Main Branch:** Post-merge integration validation, provenance generation, and bundle verification.
4. **Release Gate:** Pre-deployment staging validation, immutability check, and package bundling.

---

## 2. Enforcement Matrix

| Verification Control | Local Dev | Pull Request CI | Main Branch CI | Release Pipeline | Enforcement Policy |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Code Formatting Check** (`format:check`) | ✓ | ✓ | ✓ | ✓ | Deterministic, blocking |
| **Architectural Boundary Lint** (`lint`) | ✓ | ✓ | ✓ | ✓ | Zero layer breaches |
| **Strict Type Checking** (`typecheck`) | ✓ | ✓ | ✓ | ✓ | Fail on any TypeScript error |
| **Unit & Foundation Tests** (`test:unit`) | ✓ | ✓ | ✓ | ✓ | 35 mandatory docs verified |
| **API Contract Tests** (`test:contract`) | ✓ | ✓ | ✓ | ✓ | OpenAPI parity guaranteed |
| **Integration Test Isolation** (`test:integration`) | ✓ | ✓ | ✓ | ✓ | Synthetic data & env isolation |
| **Production Build** (`build`) | Optional | ✓ | ✓ | ✓ | Backend & Frontend build success |
| **E2E Smoke Verification** (`test:e2e`) | Optional | ✓ | ✓ | ✓ | Bundle integrity & entrypoints |
| **Secret Scanning** (`security:secrets`) | ✓ | ✓ | ✓ | ✓ | Zero committed credentials |
| **SAST Security Scan** (`security:sast`) | Optional | ✓ | ✓ | ✓ | Zero unsafe code execution patterns |
| **Dependency Security Audit** (`security:dependencies`) | Optional | ✓ | ✓ | ✓ | Block on High/Critical CVEs |
| **Documentation Link Audit** (`docs:check`) | Optional | ✓ | ✓ | ✓ | Zero dead internal links |
| **Build Metadata & Provenance** | — | — | ✓ | ✓ | Commit SHA & timestamp logged |
| **Release Artifact Packaging** | — | — | — | ✓ | Deterministic tar.gz bundles |
| **Production Deployment Gate** | — | — | — | ✓ | **FAIL-CLOSED** (Phase 0 Lock) |

---

## 3. Local Developer Convenience Commands

To enable rapid iteration without running long-running builds, developers can invoke focused commands:

```bash
# Fast feedback loop before committing
pnpm run format:check
pnpm run lint
pnpm run typecheck
pnpm run test:unit

# Full local validation before pushing
pnpm run validate
```
