import {
  type CaseStatus,
  InvalidStateTransitionError,
  PreconditionFailedError,
} from "../types";

export interface TransitionContext {
  actorId: string;
  reason: string;
  hasLeadInvestigator: boolean;
  activeRequestsCount?: number;
}

export class CaseStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<CaseStatus, readonly CaseStatus[]> = {
    DRAFT: ["OPEN"],
    OPEN: ["ACTIVE", "SUSPENDED"],
    ACTIVE: ["SUSPENDED", "CLOSED"],
    SUSPENDED: ["ACTIVE"],
    CLOSED: ["REOPENED", "ARCHIVED"],
    REOPENED: ["ACTIVE"],
    ARCHIVED: [], // Terminal retention state
  };

  /**
   * Checks if a transition from current to target status is topologically valid.
   */
  public static canTransition(current: CaseStatus, target: CaseStatus): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[current] ?? [];
    return allowed.includes(target);
  }

  /**
   * Evaluates transition legality and business preconditions.
   * Throws InvalidStateTransitionError or PreconditionFailedError if invalid.
   */
  public static validateTransition(
    current: CaseStatus,
    target: CaseStatus,
    context: TransitionContext
  ): void {
    if (!this.canTransition(current, target)) {
      throw new InvalidStateTransitionError(
        current,
        target,
        `Transition from ${current} to ${target} is prohibited by KFIN Case Lifecycle Specification`
      );
    }

    if (!context.reason || context.reason.trim().length < 5) {
      throw new PreconditionFailedError(
        `State transition to ${target} requires an explicit reason of at least 5 characters`
      );
    }

    // Preconditions based on target state
    switch (target) {
      case "ACTIVE":
        if (!context.hasLeadInvestigator) {
          throw new PreconditionFailedError(
            "Cannot transition case to ACTIVE without an assigned Lead Investigator"
          );
        }
        break;

      case "CLOSED":
        if (current !== "ACTIVE") {
          throw new PreconditionFailedError(
            `Case must be in ACTIVE status before it can be closed (current: ${current})`
          );
        }
        if (context.activeRequestsCount && context.activeRequestsCount > 0) {
          throw new PreconditionFailedError(
            `Cannot close case with ${context.activeRequestsCount} outstanding laboratory or examination requests`
          );
        }
        break;

      case "REOPENED":
        if (current !== "CLOSED") {
          throw new PreconditionFailedError(
            `Only CLOSED cases can be transitioned to REOPENED (current: ${current})`
          );
        }
        break;

      case "ARCHIVED":
        if (current !== "CLOSED") {
          throw new PreconditionFailedError(
            `Only CLOSED cases can be transitioned to ARCHIVED (current: ${current})`
          );
        }
        break;
    }
  }
}
