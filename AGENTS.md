# KFIN AI Coding Agent Instructions

This document governs all automated coding agents, AI pair programmers, and subagents operating within the KFIN repository.

---

## 1. Prime Directive: Constitutional Alignment

You must strictly obey the [KFIN Development Constitution](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md) and [AI-DEVELOPMENT-RULES.md](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/AI-DEVELOPMENT-RULES.md).

The authority hierarchy is absolute:
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

---

## 2. Scope Boundaries

1. **Current Phase:** Phase 0 — Development Foundation.
2. **Current Sub-Phase:** Sub-Phase 0.2 — Repository, Monorepo & Development Workspace Foundation.
3. **Absolute Prohibitions:**
   - NEVER implement operational case management, evidence indexing, chain-of-custody tracking, laboratory analysis, DNA matching, missing persons, or criminal intelligence logic in Phase 0.
   - NEVER fabricate test execution, coverage, or results.
   - NEVER disable, bypass, or weaken failing quality gates to create a false green status.
   - NEVER introduce real citizen identity records, actual criminal histories, or genuine DNA profiles.
   - NEVER alter architectural boundaries or service separations without an approved ADR.

---

## 3. Workflow for AI Agents

1. **Inspect Before Acting:** Read the current phase/sub-phase prompt, relevant architecture docs in `docs/architecture/`, and existing workspace implementations.
2. **Preserve Existing Architecture:** Do not rename domain concepts, merge distinct packages, or create circular dependencies.
3. **Run Real Verification:** Run actual commands (`pnpm test`, `pnpm run quality:ci`) and report actual results honestly.
4. **Architectural Deviation Rule:** If an architectural change or missing abstraction is identified:
   ```text
   STOP → EXPLAIN → DOCUMENT → REQUEST/CREATE ADR → AWAIT AUTHORIZATION
   ```
5. **Strict Stop Condition:** When the authorized sub-phase tasks and acceptance gate pass, STOP immediately. Do not autonomously drift into subsequent sub-phases.
