import {
  IntelligenceLeadData,
  IntelligenceLeadStatus,
  CaseLinkData,
  CaseLinkStatus,
  IntelligenceInvalidStateTransitionError,
  IntelligenceSeparationOfDutiesError,
  IntelligenceUserContext,
} from "../types.js";

export class IntelligenceLeadAggregate {
  private data: IntelligenceLeadData;

  constructor(data: IntelligenceLeadData) {
    this.data = { ...data };
  }

  public getData(): IntelligenceLeadData {
    return { ...this.data };
  }

  public assignInvestigator(
    investigatorId: string,
    orgId: string,
    userContext: IntelligenceUserContext
  ): IntelligenceLeadData {
    if (this.data.status !== "NEW" && this.data.status !== "ASSIGNED") {
      throw new IntelligenceInvalidStateTransitionError(
        `Cannot assign lead in state ${this.data.status}`
      );
    }

    this.data.assignedInvestigatorId = investigatorId;
    this.data.assignedOrgId = orgId;
    this.data.status = "ASSIGNED";
    this.data.updatedAt = new Date();
    return this.getData();
  }

  public startReview(userContext: IntelligenceUserContext): IntelligenceLeadData {
    if (this.data.status !== "ASSIGNED" && this.data.status !== "NEW") {
      throw new IntelligenceInvalidStateTransitionError(
        `Cannot start review for lead in state ${this.data.status}`
      );
    }

    this.data.status = "UNDER_REVIEW";
    this.data.updatedAt = new Date();
    return this.getData();
  }

  public resolveReview(
    decision: "CONFIRMED" | "REJECTED" | "INCONCLUSIVE",
    reviewNotes: string,
    userContext: IntelligenceUserContext
  ): IntelligenceLeadData {
    if (this.data.status !== "UNDER_REVIEW" && this.data.status !== "ASSIGNED") {
      throw new IntelligenceInvalidStateTransitionError(
        `Cannot resolve lead review from state ${this.data.status}`
      );
    }

    if (!reviewNotes || reviewNotes.trim().length === 0) {
      throw new Error("Review notes are required when resolving an intelligence lead");
    }

    // SoD check: assigned investigator cannot be the sole reviewer approving confirmation
    if (
      decision === "CONFIRMED" &&
      this.data.assignedInvestigatorId &&
      this.data.assignedInvestigatorId === userContext.userId
    ) {
      throw new IntelligenceSeparationOfDutiesError(
        "Assigned investigator cannot be the sole reviewer confirming an intelligence lead"
      );
    }

    this.data.status = decision;
    this.data.reviewedById = userContext.userId;
    this.data.reviewNotes = reviewNotes;
    this.data.reviewedAt = new Date();
    this.data.updatedAt = new Date();
    return this.getData();
  }

  public closeLead(userContext: IntelligenceUserContext): IntelligenceLeadData {
    this.data.status = "CLOSED";
    this.data.updatedAt = new Date();
    return this.getData();
  }
}

export class CaseLinkAggregate {
  private data: CaseLinkData;

  constructor(data: CaseLinkData) {
    this.data = { ...data };
  }

  public getData(): CaseLinkData {
    return { ...this.data };
  }

  public reviewCaseLink(
    decision: "CONFIRMED" | "REJECTED",
    proposedById: string,
    userContext: IntelligenceUserContext
  ): CaseLinkData {
    if (this.data.status !== "PROPOSED" && this.data.status !== "UNDER_REVIEW") {
      throw new IntelligenceInvalidStateTransitionError(
        `Cannot review case link in state ${this.data.status}`
      );
    }

    // SoD: the proposer cannot confirm their own case link
    if (decision === "CONFIRMED" && proposedById === userContext.userId) {
      throw new IntelligenceSeparationOfDutiesError(
        "Separation of Duties violation: Proposer cannot approve their own case link confirmation"
      );
    }

    this.data.status = decision;
    this.data.approvedById = userContext.userId;
    this.data.approvedAt = new Date();
    this.data.updatedAt = new Date();
    return this.getData();
  }
}
