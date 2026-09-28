# Contributing to KFIN

Thank you for contributing to the Kenya Forensic Intelligence Network (KFIN).

KFIN is designed as a national forensic intelligence and evidence-management platform. All engineering contributions must adhere strictly to the engineering rules and principles defined in the [KFIN Development Constitution](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md).

---

## 1. Governance & Architectural Authority

Before contributing, familiarize yourself with the governance hierarchy:

```text
KFIN MASTER SPECIFICATION
        ↓
PHASE SPECIFICATION
        ↓
SUB-PHASE SPECIFICATION
        ↓
ADR
        ↓
IMPLEMENTATION
```

1. **Constitutional Compliance:** All contributions must comply with [KFIN-DEVELOPMENT-CONSTITUTION.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md).
2. **Current Phase Scope:** We are currently executing **Phase 0 — Development Foundation**. Operational domain functionality (DNA matching, case management, chain-of-custody, real criminal data) is strictly prohibited in Phase 0.
3. **Architecture Decisions:** Any change altering technology choices, component boundaries, security models, or data models requires an Architecture Decision Record (ADR) under `docs/architecture/adr/` using the template [0000-template.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/architecture/adr/0000-template.md).

---

## 2. Prerequisites & Local Setup

- **Node.js:** Node.js LTS 24.19.0 (see `.nvmrc`)
- **Package Manager:** pnpm (v12.x+)
- **TypeScript:** TypeScript 5.9+

Refer to [GETTING-STARTED.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/development/GETTING-STARTED.md) for full onboarding instructions:

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm run quality:ci
```

---

## 3. Branching & Commit Conventions

### Branch Strategy
- `main`: Protected integration branch.
- `feature/<phase-subphase>-<description>`: E.g., `feature/p0-2-workspace-foundation`
- `fix/<issue-id>-<description>`: E.g., `fix/lint-boundary-check`
- `docs/<description>`: E.g., `docs/update-repository-map`

### Commit Message Expectations
Follow Conventional Commits:
- `feat:` New features / workspace components within authorized scope
- `fix:` Bug fixes
- `docs:` Documentation additions or updates
- `refactor:` Code improvements without architectural changes
- `test:` Test additions or assertions
- `chore:` Routine build, script, or configuration changes
- `security:` Security-related controls or vulnerability remediation

Vague commit messages (`fix`, `changes`, `stuff`, `updates`) are rejected.

---

## 4. Quality Gates & Definition of Done

Every pull request must pass the automated CI quality checks:

```bash
pnpm run quality:ci
```

This verifies:
1. `format:check`: Prettier formatting verification
2. `typecheck`: Strict TypeScript compilation across all packages and apps
3. `test`: Foundation and unit test execution
4. `build`: Build verification of console and server bundles
5. `security:secrets`: Automated scanning for committed credentials and tokens
6. `security:dependencies`: Audit for known high/critical vulnerabilities

Contributions must satisfy the formal [Definition of Done](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/DEFINITION-OF-DONE.md).

---

## 5. Security & Sensitive Data Policy

1. **Zero Real Data:** NEVER introduce real citizen records, real DNA profiles, real forensic evidence, or actual criminal case data. All test data must be synthetic.
2. **Zero Committed Secrets:** Never commit passwords, tokens, API keys, or private certificates. Any committed secret is considered compromised and requires immediate rotation.
3. **Security Reporting:** See [SECURITY.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/SECURITY.md) for vulnerability disclosure instructions.

---

## 6. AI-Assisted Development

AI coding agents and human contributors using AI tools must comply with [AI-DEVELOPMENT-RULES.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/AI-DEVELOPMENT-RULES.md) and [AGENTS.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/AGENTS.md):
- Never fabricate test execution or results.
- Never weaken or disable quality gates to achieve a green build.
- Do not autonomously redefine architecture or exceed current sub-phase authorization.
