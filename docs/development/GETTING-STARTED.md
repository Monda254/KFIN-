# Getting Started with KFIN

Welcome to the Kenya Forensic Intelligence Network (KFIN) development repository. This guide provides step-by-step instructions for authorized developers onboarding onto the project.

---

## 1. What is KFIN?

KFIN is a national-scale forensic intelligence, DNA database, and evidence-management platform. It is engineered to support the preservation, analytical interpretation, and authorized inter-institutional exchange of forensic intelligence across Kenyan forensic, law-enforcement, and judicial ecosystems.

## 2. What Phase Are We In?

We are currently in **Phase 0 — Development Foundation**, specifically executing **Sub-Phase 0.2: Repository, Monorepo & Development Workspace Foundation**.
- **Implemented:** Governance constitution, ADR system, pnpm monorepo structure, foundation status console, API health check foundation, synthetic test fixtures, automated secret scanning.
- **Strictly Deferred:** Operational domain functionality (DNA matching, case management, chain-of-custody tracking, live database tables, real citizen data) is locked until authorized in subsequent phases.

## 3. What Software is Required?

- **Operating System:** Windows, Linux, or macOS
- **Node.js:** Node.js LTS 24.19.0 (defined in `.nvmrc`)
- **Package Manager:** `pnpm` v12.x+ (enabled via Corepack: `corepack enable; pnpm -v`)
- **Git:** Git 2.40+
- **PostgreSQL (Optional for Phase 0):** PostgreSQL 16+ is required only when working with local database persistence; Phase 0 schemas contain zero domain tables.

## 4. How Do I Install Dependencies?

From the repository root:

```bash
pnpm install --frozen-lockfile
```

This installs all workspace dependencies across `artifacts/`, `lib/`, and `scripts/` using the verified `pnpm-lock.yaml`.

## 5. How Do I Configure the Environment?

Copy the provided safe environment template:

```bash
cp .env.example .env
```

Review `.env`:
- `PORT=5000` (API Server port)
- `NODE_ENV=development`
- `LOG_LEVEL=info`

> [!IMPORTANT]
> Never put actual production passwords, private keys, or API tokens into `.env`. All secrets must be managed via secure environment injections.

## 6. How Do I Start Local Services?

To run the API Server foundation:

```bash
pnpm --filter @workspace/api-server run dev
```

The service will start on port 5000 with the foundational health endpoint available at `http://localhost:5000/api/healthz`.

## 7. How Do I Run the Application?

To run the KFIN Foundation Console (governance and quality review dashboard):

```bash
pnpm --filter @workspace/kfin-console run dev
```

The console web interface will be accessible at the Vite dev server URL (typically `http://localhost:5173`).

## 8. How Do I Run Tests and Quality Checks?

To run the foundation test suite:

```bash
pnpm test
```

To run the full suite of mandatory CI quality gates (format, typecheck, tests, build, secret scan, vulnerability audit):

```bash
pnpm run quality:ci
```

## 9. Where is Architecture Documented?

- Architecture Overview: [docs/architecture/README.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/architecture/README.md)
- Architecture Decision Records (ADRs): [docs/architecture/adr/](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/architecture/adr/)
- Repository Structure Map: [docs/development/REPOSITORY-MAP.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/development/REPOSITORY-MAP.md)

## 10. Where Are Governance Rules?

- Canonical Development Constitution: [KFIN-DEVELOPMENT-CONSTITUTION.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md)
- Definition of Done: [DEFINITION-OF-DONE.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/DEFINITION-OF-DONE.md)
- AI Development Rules: [AI-DEVELOPMENT-RULES.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/AI-DEVELOPMENT-RULES.md)
- Change Management: [CHANGE-MANAGEMENT.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/CHANGE-MANAGEMENT.md)

## 11. How Do I Contribute?

Read [CONTRIBUTING.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/CONTRIBUTING.md) for detailed guidelines on branch naming, conventional commit conventions, pull request standards, and definition of done verification.

## 12. How Do I Report a Security Issue?

Consult [SECURITY.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/SECURITY.md) for vulnerability disclosure channels. Do NOT post security issues or potential secrets in public pull requests or issues.
