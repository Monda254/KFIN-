# KFIN Development Constitution

**Document:** KFIN Development Constitution  
**Document ID:** KFIN-GOV-001  
**Version:** 0.1.0  
**Status:** Approved for Phase 0 foundation work; formal governance appointments TBD  
**Effective Date:** 2026-09-21  
**Owner:** Phase Owner / Architecture Authority — TBD  
**Classification:** Use the approved KFIN classification; final taxonomy TBD  
**Supersedes:** N/A  
**Related Documents:** KFIN Master Specification; Phase 0 Master Prompt; Sub-Phase 0.1 Master Implementation Prompt; approved Security & Threat Model; approved Data Governance Specification; approved Technical Architecture Specification

## 1. Purpose

KFIN is intended to become a national forensic intelligence and information-management ecosystem. Its eventual information may be sensitive, legally significant, operationally important and exchanged across institutions. This constitution establishes the engineering rules that provide consistency, accountability, security and reproducibility throughout the implementation lifecycle.

It prevents significant KFIN behavior from depending solely on undocumented developer memory. Important rules must be documented, version-controlled, traceable and enforceable where technically possible.

## 2. Scope

This constitution governs developers, technical leads, architects, security engineers, database engineers, DevOps engineers, testers, documentation contributors, AI-assisted development, automated coding agents and future implementation teams. It applies to KFIN repositories, services, applications, databases, APIs and infrastructure throughout all phases unless a higher-authority specification explicitly supersedes a provision.

Phase 0 establishes governance and engineering foundations only. It does not implement cases, persons, evidence, specimens, laboratory workflows, DNA, intelligence, interoperability, production authorization or forensic AI.

## 3. KFIN Engineering Principles

KFIN development follows these principles:

1. **Security by design:** security is considered before implementation.
2. **Privacy by design:** unnecessary collection and exposure are minimized.
3. **Least privilege:** each user, service and process receives only required access.
4. **Explicit architecture:** significant decisions are visible and documented.
5. **Traceability:** requirements connect to implementation, verification and acceptance.
6. **Reproducibility:** development and delivery are repeatable.
7. **Testability:** behavior is designed to be verified.
8. **Fail securely:** failure must not silently weaken security.
9. **No silent data mutation:** sensitive information is not changed outside controlled mechanisms.
10. **No false success:** unverified work is not reported as successful.
11. **Minimal trust:** trust is explicit rather than assumed.
12. **Separation of duties:** critical responsibilities are separated where appropriate.
13. **Evidence preservation:** future forensic information must preserve integrity and provenance.
14. **Controlled change:** important changes are deliberate, reviewable and traceable.

## 4. Architectural Authority

The authority hierarchy is:

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

The approved KFIN Master Specification, Technical Architecture, Security & Threat Model, Data Governance Specification, Workflow Specification, API/Interoperability Specification, Domain Model, ERD and Architectural Reconciliation remain authoritative in the order approved by the project. An ADR records a decision within that hierarchy; it does not silently override a higher-authority specification.

An implementation agent must not redesign the architecture for convenience, substitute a framework without justification, create undocumented service boundaries, change database semantics, change security assumptions or remove requirements.

### Architectural conflict procedure

```text
STOP → IDENTIFY CONFLICT → DOCUMENT → ASSESS IMPACT
     → CREATE/UPDATE ADR → OBTAIN AUTHORIZATION → IMPLEMENT
```

Conflicts must identify the affected requirement, authoritative source, impact and required decision. No conflict may be silently reconciled.

## 5. Requirement Traceability

The KFIN traceability chain is:

```text
Exercise → Architectural Finding → Step → Master Specification
        → Phase → Sub-Phase → Requirement → Implementation
        → Test → Audit → Acceptance
```

Each material requirement must have a stable identifier, a source, an implementation reference, verification evidence and an acceptance status. The project register is maintained in `docs/development/PHASE-0-TRACEABILITY.md`.

### Requirement identifiers

Unless an approved master specification defines another convention:

- `KFIN-REQ-XXXX` — cross-project requirement
- `KFIN-P0-REQ-XXXX` — Phase 0 requirement
- `KFIN-P0.1-REQ-XXXX` — Sub-Phase 0.1 requirement

Competing identifier systems must not be introduced.

## 6. Development Lifecycle

The controlled lifecycle is:

```text
DISCOVERY → REQUIREMENT → DESIGN → IMPLEMENTATION → TEST
→ SECURITY REVIEW → CODE REVIEW → CI → ACCEPTANCE
→ RELEASE → MONITORING
```

Controls are proportional to risk. A trivial documentation correction does not require the same review as an authorization, database, forensic-integrity or cryptographic change, but every change remains within the applicable phase scope.

## 7. Phase and Sub-Phase Governance

Every phase and sub-phase must define objectives, scope, inputs, outputs, dependencies, acceptance criteria, failure conditions and an exit gate. Each sub-phase must be independently verifiable. A later phase must not be assumed complete merely because code exists.

When a phase passes, its completion, unresolved deviations and evidence must be documented. A completed phase is not immutable, but changes affecting it require traceability and change control. Phase 1 is locked until separately authorized.

## 8. Coding Standards

Approved languages must use clear module boundaries, explicit behavior, safe error handling and predictable dependencies.

- **TypeScript:** strict typing, meaningful types, controlled `any`, predictable interfaces and clear boundaries.
- **Python:** type annotations where appropriate, clear modules, explicit errors and predictable dependencies.
- **SQL:** consistent naming, explicit constraints, intentional indexes, safe migrations and transaction awareness.
- **Shell:** documented purpose, safe execution, predictable exit behavior and meaningful exit codes.

Code should favor clarity, maintainability, composability, testability and explicit behavior. Avoid unnecessary abstraction, premature optimization, duplicated business logic, hidden side effects, magic values and dead code.

## 9. Naming Standards

Names for directories, files, variables, functions, classes, interfaces, types, database objects, API resources, events, environment variables, tests and documentation must favor semantic clarity. KFIN domain terminology must be preserved consistently. Domain concepts must not be casually renamed.

Repository and documentation names use stable, descriptive words. Database tables and columns use the approved schema convention. API resources and events use the approved contract terminology. Where the approved convention is not yet defined, the decision is recorded rather than invented.

## 10. Type Safety

Strict TypeScript, explicit API contracts, validation boundaries, typed configuration and typed responses are required wherever applicable. Python code uses typing appropriate to its risk and boundary. Type suppression must not be used merely to make a build pass; each significant suppression requires justification.

## 11. Application Architecture Rules

Application code must preserve the approved architecture and keep these concerns distinct:

```text
Presentation → Application → Domain → Infrastructure
```

UI code must not own domain rules. Controllers must not contain large business processes. Database access must not be scattered through application code. Infrastructure assumptions must not leak into domain logic. The exact architecture remains subject to the approved KFIN Technical Architecture.

## 12. Domain Boundary Rules

Future KFIN domains remain conceptually separable, including identity/access, cases, persons, evidence, specimens, laboratory, DNA, missing persons, unidentified remains, intelligence, interoperability, audit and governance.

Cross-domain interaction uses explicit contracts rather than uncontrolled database coupling. No domain listed here is implemented by this Phase 0 constitution.

## 13. Database Development Rules

Future database work must govern migrations, constraints, foreign keys, indexes, uniqueness, nullability, timestamps, identifiers, transaction integrity, schema review, rollback and migration testing. Sensitive-record integrity must not rely solely on application code when a rule belongs in the database.

Schema modifications must be versioned, reviewable, reproducible and tested. Developers must never be instructed to manually alter production schema outside a controlled migration mechanism. Phase 0 adds no arbitrary business-domain tables.

## 14. API Development Rules

Future APIs are contracts. They must define endpoint naming, HTTP semantics, input validation, response structure, error behavior, pagination, filtering, sorting, versioning, authentication, authorization, rate limiting and idempotency where applicable. Internal database structures must not become an accidental public API.

The error contract must distinguish validation, authentication, authorization, not found, conflict, domain, infrastructure and unexpected failures. Responses must not expose stack traces, secrets, credentials, internal infrastructure details or sensitive forensic information.

## 15. Error Handling

Errors must be explicit, observable, classified and safely presented. Silent failure patterns such as `except: pass` or equivalent suppression are prohibited. Sensitive-operation failures must leave appropriate audit or observability evidence when required by the future architecture.

## 16. Logging

Technical application logs should be structured and support timestamp, severity, service, environment, request ID, correlation ID, event type and relevant non-sensitive context.

Logs must never contain passwords, tokens, private keys, secrets, unnecessary DNA information, unnecessary identity information or sensitive evidence details.

### Application logs and audit records

Application logs describe technical system behavior. Audit records establish security or business accountability. They are not automatically interchangeable. Future audit requirements must use controlled audit mechanisms.

## 17. Configuration Management

Configuration is environment-specific and must be validated. Required configuration must fail clearly when missing. Safe defaults must be documented. The conceptual environments are:

```text
LOCAL → TEST → DEVELOPMENT → STAGING → PRODUCTION
```

Production must not depend on undocumented developer machines or development-only behavior.

## 18. Secrets Management

Secrets must never be committed to Git. This includes passwords, API keys, tokens, private certificate material, private keys and database credentials. Environment templates contain placeholders only. Local development uses approved workspace or environment secret mechanisms, and production credentials are not required for local work.

Leaked credentials are treated as compromised and rotated or revoked; deleting a leaked value from the current file is not sufficient. Secret-management and rotation procedures must be documented without recording secret values.

## 19. Security Development

Secure development must address authentication, authorization, input validation, output encoding, session security, access control, cryptographic material, dependency security, secrets, logging, rate limiting, secure defaults and error handling. These controls must align with the approved KFIN Security & Threat Model rather than inventing an alternative security architecture.

### Clearance and authorization

Future authorization may consider identity, role, institutional affiliation, clearance, resource classification, purpose, context, operation and geographic or institutional boundaries. The exact authorization model belongs to the approved security architecture and is not implemented in 0.1.

## 20. Privacy and Data Protection

Future KFIN development requires data minimization, purpose limitation, controlled access, appropriate retention, documented processing, controlled disclosure, privacy-aware testing and protection of sensitive information.

Real DNA profiles, criminal records, victim data, offender data, evidence records, identity records and sensitive institutional data must not be used in development or test without explicit authorization and appropriate controls. Phase 0 uses synthetic data only.

## 21. Forensic Integrity

Future forensic information must support provenance, integrity, traceability, temporal history, versioning, accountability, controlled modification and historical reconstruction. A normal CRUD mindset must not determine the design of forensic records.

Where a record represents historical forensic fact or evidence activity, controlled append/history mechanisms are preferred over destructive overwriting. Exact implementation follows the approved domain, workflow and data-governance models.

### Chain of custody

Future design must preserve the ability to determine:

```text
WHO → POSSESSED → WHAT → WHEN → FROM WHERE → TO WHERE
    → UNDER WHAT AUTHORIZATION → WITH WHAT RESULT
```

Detailed chain-of-custody workflows belong to later forensic phases.

## 22. Auditability

Future security-sensitive operations must be attributable to authenticated identity, institution, role or authorization context, timestamp, operation, affected resource, outcome and relevant request or correlation information. Audit mechanisms must themselves be protected against unauthorized modification.

## 23. Testing

The KFIN testing hierarchy is:

```text
Unit → Integration → Contract → End-to-End → Security → Regression
```

Tests prove expected, invalid, security, failure and edge-case behavior. Critical workflows require stronger testing than cosmetic changes. Tests must not be created solely to inflate coverage.

## 24. Test Data

Development data is synthetic by default. Synthetic fixtures must be clearly identifiable and must not be mistaken for real forensic records. Real DNA, criminal, victim, offender, evidence, identity and institutional data require explicit authorization and controls that are outside Phase 0.

## 25. Git and Version Control

Git must preserve meaningful history. The main branch must be protected by the repository’s approved controls. Feature work uses reviewable branches or equivalent approved change units. Tags and releases must identify approved states. History must not be rewritten to conceal material changes.

Commits should represent coherent changes and explain purpose. Vague messages such as `stuff`, `changes`, `fix` or `updates` are not acceptable for material work.

## 26. Pull Requests and Code Review

Review assesses correctness, security, architecture, maintainability, tests, documentation, data implications and authorization implications. High-risk changes require stronger review, including authorization, identity, migrations, forensic data, cryptography, interoperability and audit mechanisms.

## 27. Architecture Decision Records

Architecturally significant decisions require an ADR under `docs/architecture/adr/`. Use `0000-template.md` for new records. Trivial coding decisions do not require ADRs. ADR history is preserved; changed decisions are superseded or deprecated rather than silently deleted.

## 28. Dependency Governance

Every major dependency must have a justified purpose and controlled version, source, lockfile entry, vulnerability status, maintenance assessment, compatibility review and licensing consideration where relevant. Unnecessary dependencies are not introduced.

Dependency vulnerabilities are detected, classified, documented, remediated or accepted through an explicit risk process. Warnings must not be suppressed without justification.

## 29. Documentation

Documentation is part of implementation. Features must document purpose, architecture, APIs, configuration, security implications, operations, testing and known limitations where applicable.

Documentation is evidence only when it reflects verified behavior or is explicitly identified as a design requirement. Documentation must not claim operational functionality that has not been implemented.

## 30. AI-Assisted Development

AI agents may assist only within the authorized phase and sub-phase. Before editing, an agent must identify the current phase, inspect authoritative specifications and existing implementation, identify dependencies and conflicts, and confirm scope.

During implementation, an agent must preserve architecture, avoid inventing requirements, use authoritative terminology and record significant decisions. After implementation it must run relevant checks, report actual results, identify uncertainty and stop at the phase boundary.

AI agents must not fabricate implementation, tests, security compliance, integrations or forensic results; silently change architecture; disable failing checks; remove security controls; insert real sensitive data; invent legal requirements; or claim production readiness without evidence.

If an architectural change appears necessary:

```text
STOP → EXPLAIN → DOCUMENT → REQUEST/CREATE ADR
     → WAIT FOR AUTHORIZATION WHERE REQUIRED
```

## 31. Change Management

Changes are classified as:

- **Level 1 — Routine implementation:** no architectural impact.
- **Level 2 — Significant technical change:** potential cross-component impact.
- **Level 3 — Architectural change:** changes structure, security assumptions, domain boundaries, data architecture or technology direction.
- **Level 4 — Critical change:** affects identity, authorization, forensic integrity, DNA data, interoperability, cryptography, audit or security boundaries.

Governance becomes stricter as risk increases. Required records and approval paths are defined in `docs/governance/CHANGE-MANAGEMENT.md`.

## 32. Vulnerability Management

Vulnerabilities follow:

```text
DISCOVER → VALIDATE → CLASSIFY → ASSESS → REMEDIATE
         → VERIFY → DOCUMENT
```

Critical issues must not be hidden because remediation is inconvenient. Unresolved risk requires an explicit owner, rationale, compensating control and review date.

## 33. Incident and Failure Handling

Failed builds, failed migrations, security failures, leaked secrets, dependency vulnerabilities, corrupted environments, failed deployments and unexpected behavior trigger investigation rather than concealment.

The response records what happened, scope, impact, containment, corrective action, verification and remaining risk. Production incident procedures belong to later operational phases, but the development foundation must preserve honest failure evidence.

## 34. Environment Management

Local, test, development, staging and production environments are separate control domains. Each has controlled configuration and access. Production access must be authorized, logged, controlled and limited. Development must not become an accidental production environment.

The target reproducibility path is:

```text
CLONE → INSTALL → CONFIGURE → MIGRATE → RUN → TEST
```

without undocumented manual intervention.

## 35. CI/CD Governance

CI must enforce appropriate quality gates:

```text
FORMAT → LINT → TYPE CHECK → TEST → BUILD → SECURITY → SECRET SCAN
```

The exact pipeline belongs to the applicable repository and infrastructure phases. This constitution establishes the governance requirement; it does not claim that future production delivery controls already exist.

## 36. Observability Principles

Future services should accommodate structured logs, metrics, traces, health checks, request IDs, correlation IDs, service health and operational alerts. Observability must not unnecessarily expose sensitive forensic data. Phase 0 provides only foundation health and logging controls.

## 37. Accessibility

Future interfaces must consider keyboard navigation, semantic HTML, readable contrast, focus management, accessible forms, screen-reader compatibility and responsive behavior during implementation rather than immediately before release.

## 38. Performance Engineering

Do not prematurely optimize, but avoid unbounded queries, uncontrolled data retrieval, excessive network calls, blocking operations, memory leaks, uncontrolled logging and inefficient repeated computation. High-volume forensic searching and matching require dedicated later performance engineering.

## 39. Release Governance

A build, passing tests or complete-looking UI does not alone establish production readiness. Future release decisions must consider functional correctness, security, data integrity, performance, observability, documentation, rollback, disaster recovery, operational readiness and governance. The detailed production gate belongs to later phases.

## 40. Definition of Done

Depending on scope, work is done only when:

```text
Requirement understood → Architecture aligned → Implementation complete
→ Validation complete → Tests written/passed → Security reviewed
→ Documentation updated → Code reviewed → CI passed
→ Acceptance criteria passed
```

Security-sensitive work involving identity, authorization, forensic records, evidence, DNA, audit, interoperability or cryptography requires appropriate security and architecture review. The project Definition of Done is maintained in `docs/governance/DEFINITION-OF-DONE.md`.

## 41. Exceptions

An exception must record the bypassed rule, reason, risk, affected systems, compensating control, owner, approval and expiry or review date. Temporary exceptions must not become permanent undocumented behavior.

## 42. Enforcement

The constitution is enforced through code review, CI, automated scanning, architecture review, security review, pull-request requirements, audits and phase acceptance gates. Important principles must become automated controls wherever practical.

## 43. Governance Ownership

Ownership categories are:

- Architecture Authority
- Engineering Lead
- Security Authority
- Data Governance Authority
- Technical Maintainer
- Repository Maintainer
- Phase Owner

Where formal appointments have not been made, the owner is **TBD — governance appointment required**. No individual or institution is invented by this document.

## 44. Amendment Procedure

An amendment must identify the proposed change, explain its reason, assess impact, assess security and data implications, update related documentation, create an ADR where appropriate, undergo review and approval, and receive a new constitution version. History must not be silently rewritten.

## 45. Constitution Versioning

This constitution has a version, effective date, status and revision history. Changes are recorded here:

| Version | Date | Change | Author/Role | Approval |
| --- | --- | --- | --- | --- |
| 0.1.0 | 2026-09-21 | Initial implementation of the Phase 0.1 constitution | Phase Owner — TBD | Governance approval — TBD |

## 46. Forensic-Specific Development Principles

KFIN differs from an ordinary commercial CRUD application. Future information may be legally significant, operationally significant, sensitive, subject to retention and disclosure controls, auditable and subject to historical reconstruction.

Correctness may involve who changed information, when, why, under which authorization, what existed before, what exists now and what evidence supports the change.

### Provenance, temporal data and lineage

Future information must preserve origin and transformations. Design must distinguish current state, historical state, event time, system time, effective time and recorded time according to the approved data architecture. Analytical outputs must be traceable to source information, especially for intelligence, graph analysis, reporting and AI-assisted capabilities.

### AI and forensic decisions

AI output must not automatically become a forensic fact, legal conclusion, investigative conclusion, DNA interpretation or evidence determination. Future AI features require explicit governance, explainability and human oversight appropriate to their use.

## 47. Interoperability and National-Scale Principles

Future integrations use controlled contracts. Institutions must not receive unrestricted database-level access merely because information must be exchanged. Exchange design considers identity, authorization, purpose, classification, schema, provenance, validation, audit, rate limits, failure, replay and versioning.

KFIN must not assume one institution, one user type, one clearance, one classification, equal trust or small workloads. Institutional boundaries and approved authorization policies must be respected without inventing institutional permissions.

## 48. Security Boundaries and Classification

Future feature design identifies trust transitions:

```text
USER → IDENTITY → AUTHORIZATION → APPLICATION
     → DOMAIN → DATABASE → EXTERNAL SYSTEM
```

Controls must be explicit wherever trust changes. Future KFIN information requires an approved classification taxonomy, such as public, internal, sensitive, restricted or highly restricted only if confirmed by the Data Governance and Security specifications. This constitution does not establish the final taxonomy.

## 49. Development, Production and Recovery

Developers must not directly modify production outside approved operational procedures. Future production access is authorized, logged, controlled and limited.

Backups must be governed, recovery must be tested, critical information must not depend on one uncontrolled copy, restoration must preserve integrity and recovery actions must be auditable. Sensitive migrations consider backup, compatibility, rollback, validation, downtime, integrity, audit and versioning.

External services are not automatically trusted. Before integration, assess transmitted data, authentication, authorization, availability, security, privacy, contractual requirements, failure behavior and dependency risk. Open-source software requires dependency, license, security and maintenance review.

## 50. Implementation Agent Behavior and Non-Invention

Before editing, an implementation agent inspects the repository, existing documentation, relevant KFIN specifications, existing governance artifacts and conflicts. During implementation it preserves useful information, avoids duplication, uses authoritative terminology, documents decisions and does not invent missing organizational facts. After implementation it validates required sections, links, consistency, contradictions and evidence.

The agent must use **TBD** or **TO BE FORMALLY DEFINED** for unknown organizational structures, legal requirements, institutional mandates, clearance levels, named officials, compliance certifications, production capabilities, security certifications, classifications and operational policies.

## 51. Governance Self-Audit

The 0.1 acceptance review must answer:

1. Can a developer determine which document has authority?
2. Can architectural conflicts be resolved without guesswork?
3. Can significant decisions be recorded?
4. Are secrets controlled and trust boundaries recognized?
5. Is least privilege established and can security-sensitive changes receive stronger review?
6. Is sensitive data protected and synthetic data required during development?
7. Are provenance, integrity, temporal data, chain of custody and historical reconstruction recognized?
8. Can an AI agent silently change architecture or fabricate test results? **No.**
9. Is there a Definition of Done, governed testing, code review and CI governance?
10. Can requirements be traced from discovery to implementation and acceptance?

If a critical answer is no, Sub-Phase 0.1 must not pass.

## 52. Phase 0.1 Boundary and Stop Condition

Sub-Phase 0.1 delivers governance, the constitution, ADR foundations, traceability rules, AI governance, security and privacy principles, forensic-integrity principles, Definition of Done and completion evidence.

When the 0.1 acceptance gate passes, stop. Do not automatically implement repository restructuring, frontend or backend scaffolding, database migrations, CI, automated security scanning or application modules as part of 0.1. Those are governed by later sub-phases and require separate authorization.