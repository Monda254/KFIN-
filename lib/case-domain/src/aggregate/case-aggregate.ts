import {
  type CaseRecord,
  type CaseStatus,
  type CasePriority,
  type CaseType,
  type UpdateCaseInput,
  type TransitionCaseStatusInput,
  type TransferCaseInput,
  ConcurrencyConflictError,
  PreconditionFailedError,
} from "../types";
import { CaseStateMachine, type TransitionContext } from "./state-machine";
import {
  type DomainEvent,
  createDomainEvent,
} from "../events/domain-events";
import type { ClassificationLevel } from "@workspace/security";

export class CaseAggregate {
  private readonly events: DomainEvent[] = [];

  constructor(private record: CaseRecord) {}

  public get state(): Readonly<CaseRecord> {
    return Object.freeze({ ...this.record });
  }

  public get uncommittedEvents(): readonly DomainEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events.length = 0;
  }

  /**
   * Validates version against optimistic concurrency lock.
   */
  public verifyVersion(expectedVersion: number): void {
    if (this.record.version !== expectedVersion) {
      throw new ConcurrencyConflictError(expectedVersion, this.record.version);
    }
  }

  /**
   * Applies metadata updates to the case.
   */
  public updateDetails(input: UpdateCaseInput, actorId: string): void {
    this.verifyVersion(input.expectedVersion);

    if (this.record.status === "CLOSED" || this.record.status === "ARCHIVED") {
      throw new PreconditionFailedError(
        `Cannot modify details of a case in ${this.record.status} status`
      );
    }

    if (input.title !== undefined) {
      if (input.title.trim().length < 3) {
        throw new PreconditionFailedError("Case title must be at least 3 characters");
      }
      this.record.title = input.title.trim();
    }

    if (input.description !== undefined) {
      if (input.description.trim().length < 5) {
        throw new PreconditionFailedError("Case description must be at least 5 characters");
      }
      this.record.description = input.description.trim();
    }

    if (input.priority !== undefined) {
      this.record.priority = input.priority;
    }

    if (input.incidentCounty !== undefined) {
      this.record.incidentCounty = input.incidentCounty.trim();
    }

    if (input.incidentLocationCoords !== undefined) {
      this.record.incidentLocationCoords = input.incidentLocationCoords;
    }

    if (input.dataClassification !== undefined) {
      this.record.dataClassification = input.dataClassification;
    }

    this.record.version += 1;
    this.record.updatedAt = new Date();

    this.events.push(
      createDomainEvent("CaseUpdated", this.record.id, actorId, {
        caseNumber: this.record.caseNumber,
        newVersion: this.record.version,
      })
    );
  }

  /**
   * Transitions the case to a new status via the formal state machine.
   */
  public transitionStatus(
    input: TransitionCaseStatusInput,
    actorId: string,
    activeRequestsCount: number = 0
  ): void {
    this.verifyVersion(input.expectedVersion);

    const context: TransitionContext = {
      actorId,
      reason: input.reason,
      hasLeadInvestigator: Boolean(this.record.leadInvestigatorId),
      activeRequestsCount,
    };

    CaseStateMachine.validateTransition(this.record.status, input.newStatus, context);

    const prevStatus = this.record.status;
    this.record.status = input.newStatus;
    this.record.version += 1;
    this.record.updatedAt = new Date();

    if (input.newStatus === "CLOSED") {
      this.record.closedAt = new Date();
      this.record.closedById = actorId;
      this.record.closureReason = input.reason;

      this.events.push(
        createDomainEvent("CaseClosed", this.record.id, actorId, {
          caseNumber: this.record.caseNumber,
          closureReason: input.reason,
        })
      );
    } else if (input.newStatus === "REOPENED") {
      this.record.reopenedAt = new Date();
      this.record.reopenedById = actorId;
      this.record.reopenedReason = input.reason;

      this.events.push(
        createDomainEvent("CaseReopened", this.record.id, actorId, {
          caseNumber: this.record.caseNumber,
          reopenedReason: input.reason,
        })
      );
    } else {
      this.events.push(
        createDomainEvent("CaseStatusChanged", this.record.id, actorId, {
          caseNumber: this.record.caseNumber,
          previousStatus: prevStatus,
          newStatus: input.newStatus,
          reason: input.reason,
        })
      );
    }
  }

  /**
   * Transfers case responsibility to a new lead investigator and/or organization.
   */
  public transferResponsibility(
    input: TransferCaseInput,
    actorId: string
  ): void {
    this.verifyVersion(input.expectedVersion);

    if (this.record.status === "CLOSED" || this.record.status === "ARCHIVED") {
      throw new PreconditionFailedError(
        `Cannot transfer case in ${this.record.status} status`
      );
    }

    if (!input.transferReason || input.transferReason.trim().length < 5) {
      throw new PreconditionFailedError("Transfer requires an explicit statutory/operational reason");
    }

    const prevInvestigator = this.record.leadInvestigatorId;
    const prevOrg = this.record.originatingOrgId;

    this.record.leadInvestigatorId = input.toInvestigatorId;
    if (input.toOrgId) {
      this.record.originatingOrgId = input.toOrgId;
    }
    this.record.version += 1;
    this.record.updatedAt = new Date();

    this.events.push(
      createDomainEvent("CaseTransferred", this.record.id, actorId, {
        caseNumber: this.record.caseNumber,
        fromOrgId: prevOrg,
        toOrgId: input.toOrgId,
        fromInvestigatorId: prevInvestigator,
        toInvestigatorId: input.toInvestigatorId,
        reason: input.transferReason,
      })
    );
  }

  /**
   * Reassigns lead investigator without transferring organization.
   */
  public reassignLeadInvestigator(newInvestigatorId: string, actorId: string): void {
    if (this.record.status === "CLOSED" || this.record.status === "ARCHIVED") {
      throw new PreconditionFailedError(
        `Cannot reassign lead investigator on a ${this.record.status} case`
      );
    }

    const prevInvestigator = this.record.leadInvestigatorId;
    this.record.leadInvestigatorId = newInvestigatorId;
    this.record.version += 1;
    this.record.updatedAt = new Date();

    this.events.push(
      createDomainEvent("CaseAssigned", this.record.id, actorId, {
        caseNumber: this.record.caseNumber,
        previousLeadInvestigatorId: prevInvestigator,
        newLeadInvestigatorId: newInvestigatorId,
        caseRole: "LEAD_INVESTIGATOR",
      })
    );
  }
}
