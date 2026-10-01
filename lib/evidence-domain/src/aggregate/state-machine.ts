import type { EvidenceStatus } from "../types";

export interface StateTransitionResult {
  allowed: boolean;
  reason?: string;
}

export class EvidenceStateMachine {
  private static readonly TRANSITIONS: Record<EvidenceStatus, EvidenceStatus[]> = {
    COLLECTED: ["PACKAGED", "SEALED", "TRANSFERRED", "STORED", "RETRIEVED", "EXCEPTION"],
    PACKAGED: ["SEALED", "TRANSFERRED", "STORED", "EXCEPTION"],
    SEALED: ["TRANSFERRED", "STORED", "RETRIEVED", "RECEIVED", "EXCEPTION"],
    TRANSFERRED: ["RECEIVED", "EXCEPTION", "TRANSFERRED"],
    RECEIVED: ["STORED", "RETRIEVED", "EXAMINED", "IN_VAULT", "CHECKED_OUT_LAB", "EXCEPTION"],
    STORED: ["RETRIEVED", "TRANSFERRED", "EXAMINED", "DISPOSED", "ARCHIVED", "EXCEPTION"],
    IN_VAULT: ["RETRIEVED", "TRANSFERRED", "EXAMINED", "DISPOSED", "ARCHIVED", "EXCEPTION", "STORED"],
    RETRIEVED: ["EXAMINED", "RETURNED", "STORED", "CHECKED_OUT_LAB", "IN_COURT", "EXCEPTION"],
    CHECKED_OUT_LAB: ["EXAMINED", "RETURNED", "STORED", "EXCEPTION"],
    IN_COURT: ["RETURNED", "STORED", "TRANSFERRED", "EXCEPTION"],
    EXAMINED: ["RETURNED", "STORED", "TRANSFERRED", "DISPOSED", "ARCHIVED", "EXCEPTION"],
    RETURNED: ["STORED", "IN_VAULT", "TRANSFERRED", "DISPOSED", "ARCHIVED", "EXCEPTION"],
    SUBMITTED: ["RECEIVED", "TRANSFERRED", "STORED", "EXCEPTION"],
    EXCEPTION: ["STORED", "RETURNED", "SEALED", "TRANSFERRED", "RECEIVED", "DISPOSED"],
    DISPOSED: ["ARCHIVED"],
    ARCHIVED: [],
  };

  public static canTransition(current: EvidenceStatus, next: EvidenceStatus): StateTransitionResult {
    if (current === next) {
      return { allowed: true };
    }

    const allowedNextStates = this.TRANSITIONS[current] || [];
    if (allowedNextStates.includes(next)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Invalid evidence lifecycle transition from '${current}' to '${next}'. Allowed next states: [${allowedNextStates.join(", ")}].`,
    };
  }

  public static validateTransition(current: EvidenceStatus, next: EvidenceStatus): void {
    const result = this.canTransition(current, next);
    if (!result.allowed) {
      throw new Error(result.reason);
    }
  }
}
