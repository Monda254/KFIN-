# Change Management

## Change classes

- **Implementation change:** changes code without changing the approved architecture.
- **Technical decision:** selects or configures a tool or implementation approach and may require an ADR.
- **Architectural change:** changes technology, boundaries, data strategy, security posture or a durable system behavior; requires an ADR before implementation.
- **Requirement change:** changes what the phase must deliver; must be traced to the authoritative specification and accepted before work continues.

## Required record

Every material change records its context, source requirement, alternatives considered, decision, rationale, consequences, affected components, status and date. Unresolved conflicts are not hidden inside refactors or chat history.

## Failure handling

Failed builds, tests, migrations, security checks, secret detections, invalid configuration and missing documentation remain visible. A gate may be retried after a fix, but it may not be bypassed without an explicit, documented and authorized exception.