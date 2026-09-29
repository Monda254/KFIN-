# KFIN Technical Debt & Deferred Architecture Register

**Document ID:** KFIN-DEV-DEBT-001  
**Phase:** 0.3 — Development Tooling, CI/CD & Quality Automation  
**Authoritative Status:** Active Engineering Register  
**Governed By:** KFIN Development Constitution  

---

## 1. Purpose & Transparency

In compliance with Phase 0.3 Requirement 113, all known architectural compromises, temporary mock structures, or intentionally deferred engineering capabilities must be formally registered. Hiding technical debt is strictly prohibited.

---

## 2. Deferred Capabilities Register (Phase 0 -> Phase 1+)

The following capabilities are **explicitly deferred** to subsequent implementation phases in accordance with the strict Phase 0 scope boundary:

| Debt ID | Category | Item Description | Deferred From | Target Implementation Phase | Architectural Rationale |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **DEBT-001** | **Forensics** | DNA profile schemas, STR/Y-STR matching algorithms | Phase 0.3 | **Phase 1** | Strict Phase 0 boundary: zero forensic code allowed prior to infrastructure completion. |
| **DEBT-002** | **Evidence** | Chain of custody logging & physical evidence tracking | Phase 0.3 | **Phase 1** | Awaiting Phase 1 immutable ledger and event sourcing model. |
| **DEBT-003** | **Security** | Production mTLS & hardware security module (HSM) signing | Phase 0.3 | **Phase 2** | Production security infrastructure belongs to dedicated security deployment phase. |
| **DEBT-004** | **Database** | Full production database migrations & replica replication | Phase 0.3 | **Phase 1** | Local mock/in-memory database utilized for foundational smoke testing. |
| **DEBT-005** | **Identity** | National identity federation (IPRS / Maisha Namba) integration | Phase 0.3 | **Phase 3** | Third-party institutional integrations require staging network accreditation. |
| **DEBT-006** | **AI / Analytics**| Forensic graph intelligence & similarity matching | Phase 0.3 | **Phase 4** | Advanced forensic analytics build upon validated Phase 1 domain records. |

---

## 3. Engineering Workarounds & Temporary Accommodations

| Workaround ID | File / Component | Workaround Description | Mitigation in Phase 0.3 | Planned Permanent Solution |
| :--- | :--- | :--- | :--- | :--- |
| **WA-001** | `artifacts/api-server/build.mjs` | Externalized Node native drivers (`express`, `pino`) for ESM bundler | esbuild external flags configured | Standardize ESM imports across all backend microservices in Phase 1. |
| **WA-002** | `tests/fixtures/generic/sample-payload.json` | Mock system configuration payload | Hardcoded synthetic data fixture | Dynamic schema-based test fixture generator in Phase 1. |
