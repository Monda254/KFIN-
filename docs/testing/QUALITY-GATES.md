# Phase 0 Quality Gates

The root `quality:ci` command is the canonical local and CI gate:

1. `format:check` for maintained repository control files (`package.json`, `README.md` and `.prettierrc`)
2. `typecheck`
3. `test`
4. `build`
5. `security:secrets`
6. `security:dependencies`

The sequence is fail-closed: a later check does not run as an excuse to ignore an earlier failure, and a failed mandatory check blocks acceptance. Generated client output and the pre-existing UI component scaffold retain their upstream formatting and are not rewritten by this gate.

## Evidence requirements

Each phase report records the command, result, date and any unresolved issue. A green application preview is not evidence that the phase is complete. The phase gate is PASS only when 0.1, 0.2, 0.3 and final reconciliation all pass.

## Test layers

Phase 0 proves the foundation with a repository-structure test, type, build, API health, contract generation, secret and dependency checks. Unit, integration, contract, end-to-end, security and regression test suites are established as future layers and must be added with the functionality they protect.