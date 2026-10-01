import { ProfileStatus, InvalidDnaTransitionError } from "../types";

export interface StateTransitionResult {
  allowed: boolean;
  reason?: string;
}

export class DnaProfileStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<ProfileStatus, ProfileStatus[]> = {
    DRAFT: ["PROCESSING", "QUALITY_REVIEW", "ACTIVE", "WITHDRAWN"],
    PROCESSING: ["QUALITY_REVIEW", "ACTIVE", "WITHDRAWN"],
    QUALITY_REVIEW: ["ACTIVE", "SUSPENDED", "WITHDRAWN"],
    ACTIVE: ["SUSPENDED", "WITHDRAWN", "EXPIRED"],
    SUSPENDED: ["ACTIVE", "WITHDRAWN"],
    WITHDRAWN: [],
    EXPIRED: ["ACTIVE", "WITHDRAWN"],
  };

  public static canTransition(from: ProfileStatus, to: ProfileStatus): StateTransitionResult {
    if (from === to) {
      return { allowed: true };
    }

    const allowedNext = this.ALLOWED_TRANSITIONS[from] || [];
    if (!allowedNext.includes(to)) {
      return {
        allowed: false,
        reason: `Illegal DNA profile lifecycle transition from state '${from}' to '${to}'`,
      };
    }

    return { allowed: true };
  }

  public static assertTransition(from: ProfileStatus, to: ProfileStatus): void {
    const check = this.canTransition(from, to);
    if (!check.allowed) {
      throw new InvalidDnaTransitionError(check.reason || "Illegal DNA profile transition");
    }
  }
}
