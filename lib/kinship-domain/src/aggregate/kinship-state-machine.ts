import { KinshipStatus, KinshipInvalidStateTransitionError } from "../types";

export class KinshipStateMachine {
  private static readonly VALID_TRANSITIONS: Record<KinshipStatus, readonly KinshipStatus[]> = {
    DRAFT: ["AUTHORIZATION_PENDING", "REJECTED"],
    AUTHORIZATION_PENDING: ["AUTHORIZED", "REJECTED"],
    AUTHORIZED: ["ANALYSIS_PENDING", "CLOSED"],
    ANALYSIS_PENDING: ["ANALYZING", "REJECTED"],
    ANALYZING: ["REVIEW_PENDING", "INCONCLUSIVE", "REJECTED"],
    REVIEW_PENDING: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["ACCEPTED", "REJECTED", "INCONCLUSIVE"],
    ACCEPTED: ["CLOSED"],
    REJECTED: ["CLOSED"],
    INCONCLUSIVE: ["ANALYSIS_PENDING", "CLOSED"],
    CLOSED: [],
  };

  public static canTransition(current: KinshipStatus, target: KinshipStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  public static validateTransition(current: KinshipStatus, target: KinshipStatus): void {
    if (!this.canTransition(current, target)) {
      throw new KinshipInvalidStateTransitionError(
        `Invalid Kinship Investigation state transition from '${current}' to '${target}'. Allowed target states: [${(
          this.VALID_TRANSITIONS[current] || []
        ).join(", ")}]`
      );
    }
  }
}
