import {
  KinshipInvestigationData,
  RelationshipHypothesisData,
  KinshipStatus,
  KinshipLegalBasisMissingError,
  KinshipSeparationOfDutiesError,
} from "../types";
import { KinshipStateMachine } from "./kinship-state-machine";

export class KinshipInvestigationAggregate {
  private investigation: KinshipInvestigationData;
  private hypotheses: RelationshipHypothesisData[] = [];

  constructor(investigation: KinshipInvestigationData, hypotheses: RelationshipHypothesisData[] = []) {
    if (!investigation.legalBasis || investigation.legalBasis.trim() === "") {
      throw new KinshipLegalBasisMissingError("Kinship investigation requires a documented statutory/legal basis.");
    }
    this.investigation = investigation;
    this.hypotheses = hypotheses;
  }

  public get data(): KinshipInvestigationData {
    return { ...this.investigation };
  }

  public get activeHypotheses(): readonly RelationshipHypothesisData[] {
    return [...this.hypotheses];
  }

  public addHypothesis(hypothesis: RelationshipHypothesisData): void {
    this.hypotheses.push(hypothesis);
    this.investigation.updatedAt = new Date();
  }

  public transitionState(targetStatus: KinshipStatus, actorId: string): void {
    KinshipStateMachine.validateTransition(this.investigation.status, targetStatus);
    
    // Server-side Separation of Duties check
    if (targetStatus === "ACCEPTED" || targetStatus === "CLOSED") {
      if (actorId === this.investigation.initiatingUserId) {
        throw new KinshipSeparationOfDutiesError(
          "Separation of Duties violation: The actor initiating the kinship investigation cannot authorize or approve the final forensic conclusion."
        );
      }
    }

    this.investigation.status = targetStatus;
    if (targetStatus === "CLOSED") {
      this.investigation.closedAt = new Date();
    }
    this.investigation.updatedAt = new Date();
  }

  public authorize(authorizingActorId: string): void {
    if (authorizingActorId === this.investigation.initiatingUserId) {
      throw new KinshipSeparationOfDutiesError(
        "Separation of Duties violation: Initiating user cannot self-authorize kinship investigation."
      );
    }
    this.transitionState("AUTHORIZED", authorizingActorId);
  }
}
