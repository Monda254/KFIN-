# KFIN — Case Deterministic State Machine Specification

**Document Reference:** `docs/cases/CASE-STATE-MACHINE.md`  
**Phase:** 1.3 — Core Domain & Case Management Foundation  
**System:** Kenya Forensic Intelligence Network (KFIN)  
**Status:** Canonical & Authoritative  

---

## 1. Formal State Machine Definition

The KFIN Case State Machine (`CaseStateMachine`) is a deterministic, finite automaton governing the operational lifecycle of all forensic cases. State transitions cannot occur implicitly or bypass verification gates.

### State Transition Matrix

| From State | Valid Next States | Guard Function / Required Inputs |
| :--- | :--- | :--- |
| `DRAFT` | `OPEN` | Case reference generated; Originating agency & primary investigator set. |
| `OPEN` | `ACTIVE`, `SUSPENDED` | Valid reason; Primary investigator active. |
| `ACTIVE` | `SUSPENDED`, `CLOSED` | If closing: Closure reason, evidence secured, no active lab requests. |
| `SUSPENDED` | `ACTIVE`, `CLOSED` | If closing: Closure reason, evidence secured, no active lab requests. |
| `CLOSED` | `REOPENED`, `ARCHIVED` | If reopening: Reopened reason, supervisor authority. |
| `REOPENED` | `ACTIVE` | Resumption of active investigation. |
| `ARCHIVED` | *None (Terminal)* | Terminal state; transitions strictly forbidden. |

---

## 2. Forbidden Transitions (Default Deny)

The state engine operates on a **default deny** rule. Any transition not explicitly enumerated in the transition graph is strictly rejected with `InvalidStateTransitionError`.

Examples of explicitly rejected illegal transitions:
* `DRAFT` $\rightarrow$ `CLOSED`: A draft intake cannot be closed without being formalized and investigated.
* `DRAFT` $\rightarrow$ `ACTIVE`: A draft must first be officially opened and assigned.
* `CLOSED` $\rightarrow$ `ACTIVE`: Direct transition is forbidden. A case must pass through `REOPENED` with documented justification.
* `ARCHIVED` $\rightarrow$ Any: Archived dockets are permanently sealed for legal compliance.
* Any self-transitions (`ACTIVE` $\rightarrow$ `ACTIVE`): Redundant mutations without state change are rejected.

---

## 3. Transition Guard Rules & Precondition Checks

```typescript
export class CaseStateMachine {
  private static readonly TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
    DRAFT: ["OPEN"],
    OPEN: ["ACTIVE", "SUSPENDED"],
    ACTIVE: ["SUSPENDED", "CLOSED"],
    SUSPENDED: ["ACTIVE", "CLOSED"],
    CLOSED: ["REOPENED", "ARCHIVED"],
    REOPENED: ["ACTIVE"],
    ARCHIVED: [],
  };

  public static canTransition(current: CaseStatus, next: CaseStatus): boolean {
    const allowed = this.TRANSITIONS[current] || [];
    return allowed.includes(next);
  }

  public static validateTransition(current: CaseStatus, next: CaseStatus): void {
    if (!this.canTransition(current, next)) {
      throw new InvalidStateTransitionError(current, next);
    }
  }
}
```

### Precondition 1: Closure Verification (`verifyCanClose`)
When attempting transition to `CLOSED`:
```typescript
export async function verifyCanClose(caseId: string, client: PoolClient): Promise<void> {
  // 1. Evidence items must not be in transit
  const { rows: inTransit } = await client.query(
    "SELECT id FROM evidence_items WHERE case_id = $1 AND status = 'IN_TRANSIT' LIMIT 1;",
    [caseId]
  );
  if (inTransit.length > 0) {
    throw new PreconditionFailedError("Cannot close case: Exhibits remain in intermediate custody transit");
  }

  // 2. Active examination requests must be finalized
  const { rows: activeExams } = await client.query(
    `SELECT er.id FROM examination_requests er
     JOIN lab_submissions ls ON er.submission_id = ls.id
     WHERE ls.case_id = $1 AND er.stage != 'APPROVED'
     LIMIT 1;`,
    [caseId]
  );
  if (activeExams.length > 0) {
    throw new PreconditionFailedError("Cannot close case: Outstanding laboratory examinations remain unresolved");
  }

  // 3. Legal holds check
  const { rows: activeHolds } = await client.query(
    "SELECT id FROM legal_holds WHERE case_id = $1 AND status = 'ACTIVE' LIMIT 1;",
    [caseId]
  );
  if (activeHolds.length > 0) {
    throw new PreconditionFailedError("Cannot close case: Active statutory legal hold exists on docket");
  }
}
```

---

## 4. Concurrency Safety & Versioning

To defend against lost updates and race conditions during simultaneous multi-investigator edits:
1. Every state mutation checks `expectedVersion === current.version`.
2. When the database updates the row:
   ```sql
   UPDATE cases 
   SET status = $1, version = version + 1, updated_at = NOW()
   WHERE id = $2 AND version = $3;
   ```
3. If zero rows are returned, a concurrent modification has occurred, triggering a `ConcurrencyConflictError` (HTTP 409).
