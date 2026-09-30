# KFIN — Case Domain Events Specification

**Document Reference:** `docs/cases/CASE-EVENTS.md`  
**Phase:** 1.3 — Core Domain & Case Management Foundation  
**System:** Kenya Forensic Intelligence Network (KFIN)  
**Status:** Canonical & Authoritative  

---

## 1. Domain Event Architecture

Domain Events represent significant business facts that have occurred within the Case aggregate boundary. In KFIN, domain events decouple synchronous state persistence from downstream notification, audit logging, and inter-service messaging.

### Guiding Principles:
1. **Past Tense Naming:** Events are facts that have already occurred (e.g., `CaseCreatedEvent`, `CaseStatusChangedEvent`).
2. **Immutability:** Once instantiated and published, event payloads cannot be altered.
3. **Correlation Tracking:** Every event carries a `correlationId` to trace the originating user transaction across services.
4. **Idempotency:** Subscribers must handle event redelivery gracefully without generating duplicate state changes.

---

## 2. Canonical Case Event Catalog

All case domain events implement the base interface `CaseDomainEvent`:
```typescript
export interface BaseCaseEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: string;
  correlationId: string;
  actorId: string;
  actorBadge: string;
}
```

### Event Types:
* **`CaseCreatedEvent`**: Emitted upon successful initialization and opening of a new case.
* **`CaseStatusChangedEvent`**: Emitted when a case transitions between lifecycle states, carrying `fromStatus`, `toStatus`, and `transitionReason`.
* **`CasePersonnelAssignedEvent`**: Emitted when an officer/analyst is assigned to a case, specifying `assignedUserId`, `caseRole`, and `accessScope`.
* **`CaseAssignmentRevokedEvent`**: Emitted upon assignment termination, specifying `revokedUserId` and `revocationReason`.
* **`CaseTransferredEvent`**: Emitted when jurisdiction or lead investigator changes, specifying `fromOrgId`, `toOrgId`, `fromInvestigatorId`, `toInvestigatorId`, and `transferReason`.
* **`CaseParticipantAddedEvent`**: Emitted when a participant is registered in the case roster.
* **`CaseParticipantRemovedEvent`**: Emitted when a participant is deactivated from the roster.
* **`CaseNoteAddedEvent`**: Emitted when an investigative journal note is committed.
* **`CaseLinkedEvent`**: Emitted when a cross-case association is registered.

---

## 3. Event Publisher & Subscribers

The in-memory `DomainEventPublisher` provides asynchronous dispatch to registered subscribers:
```typescript
export class DomainEventPublisher {
  private static handlers: Map<string, Array<(event: any) => Promise<void>>> = new Map();

  public static subscribe<T extends CaseDomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }

  public static async publish(event: CaseDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map((h) => h(event).catch((err) => console.error("Event handler failed:", err))));
  }
}
```

### Default Subscribers:
* **Audit Event Bridge:** Translates domain events into immutable ledger entries in `audit_events`.
* **Search / Cache Invalidation:** Evicts stale read projections and search caches upon state changes.
* **Notification Dispatcher:** Dispatches email/SMS alerts to newly assigned investigators.
