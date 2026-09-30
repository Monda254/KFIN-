import { pool } from "@workspace/db";
import {
  AuthorizationEngine,
  logSecurityEvent,
  type Subject,
  type AccessContext,
  type Resource,
  CLASSIFICATION_TIERS,
} from "@workspace/security";
import { CaseRepository } from "../repository/case-repository";
import { CaseAggregate } from "../aggregate/case-aggregate";
import { DomainEventPublisher } from "../events/domain-events";
import {
  type CaseRecord,
  type CaseParticipantRecord,
  type CaseAssignmentRecord,
  type CaseTransferRecord,
  type CaseLinkRecord,
  type CaseNoteRecord,
  type CaseTimelineItem,
  type CreateCaseInput,
  type UpdateCaseInput,
  type TransitionCaseStatusInput,
  type AssignCaseInput,
  type TransferCaseInput,
  type AddParticipantInput,
  type AddNoteInput,
  type LinkCaseInput,
  type CaseSearchFilter,
  CaseNotFoundError,
  UnauthorizedCaseActionError,
  PreconditionFailedError,
} from "../types";

export class CaseService {
  constructor(private readonly repo: CaseRepository = new CaseRepository()) {}

  /**
   * Helper to evaluate authorization and log security events.
   */
  private async authorizeAndAudit(
    subject: Subject,
    action: string,
    resource: Resource,
    context: Partial<AccessContext>
  ): Promise<void> {
    const fullContext: AccessContext = {
      action,
      ipAddress: context.ipAddress ?? "127.0.0.1",
      correlationId: context.correlationId ?? crypto.randomUUID(),
      purpose: context.purpose,
      ...context,
    };

    const decision = AuthorizationEngine.evaluate(subject, resource, fullContext);

    if (decision.decision !== "ALLOW") {
      // Record ACCESS_DENIED in immutable audit log
      await logSecurityEvent(pool, {
        actorId: subject.userId,
        actorIpAddress: fullContext.ipAddress,
        action: "ACCESS_DENIED",
        entityType: resource.type,
        entityId: resource.id,
        outcome: "DENIED",
        reason: `${decision.reasonCode}: ${decision.explanation}`,
        metadata: {
          requestedAction: action,
          ...decision.auditPayload.metadata,
        },
      });

      throw new UnauthorizedCaseActionError(action, decision.explanation);
    }
  }

  /**
   * Create a new forensic case.
   */
  public async createCase(
    subject: Subject,
    input: CreateCaseInput,
    context: Partial<AccessContext> = {}
  ): Promise<CaseRecord> {
    const classification = input.dataClassification ?? "RESTRICTED";
    const resource: Resource = {
      type: "case",
      id: "NEW_CASE",
      classification,
      ownerOrgId: input.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:create", resource, context);

    const created = await this.repo.createCase(input, subject.userId, subject.organizationCode);

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_CREATE",
      entityType: "case",
      entityId: created.id,
      outcome: "SUCCESS",
      reason: `Case created with reference ${created.caseNumber}`,
      metadata: {
        caseNumber: created.caseNumber,
        caseType: created.caseType,
        priority: created.priority,
        classification: created.dataClassification,
      },
    });

    await DomainEventPublisher.publish({
      eventId: crypto.randomUUID(),
      eventName: "CaseCreated",
      caseId: created.id,
      actorId: subject.userId,
      occurredAt: new Date(),
      payload: { caseNumber: created.caseNumber, title: created.title },
    });

    return created;
  }

  /**
   * Retrieve case details with object-level authorization & field-level minimization.
   */
  public async getCaseById(
    subject: Subject,
    caseId: string,
    context: Partial<AccessContext> = {}
  ): Promise<CaseRecord> {
    const record = await this.repo.findById(caseId);
    if (!record) {
      throw new CaseNotFoundError(caseId);
    }

    // Check clearance tier for field-level minimization
    const userTier = CLASSIFICATION_TIERS[subject.clearanceCode] ?? 1;
    const caseTier = CLASSIFICATION_TIERS[record.dataClassification] ?? 3;
    const isMinimized = userTier < caseTier;

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: isMinimized ? "INTERNAL" : record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    // Object-level authorization check
    await this.authorizeAndAudit(subject, "case:read", resource, context);

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_VIEW",
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      metadata: { caseNumber: record.caseNumber, minimized: isMinimized },
    });

    if (isMinimized) {
      return {
        ...record,
        description: "[REDACTED — INSUFFICIENT SECURITY CLEARANCE]",
        incidentLocationCoords: null,
      };
    }

    return record;
  }

  /**
   * Update case metadata.
   */
  public async updateCase(
    subject: Subject,
    caseId: string,
    input: UpdateCaseInput,
    context: Partial<AccessContext> = {}
  ): Promise<CaseRecord> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:update", resource, {
      purpose: "CASE_INVESTIGATION",
      ...context,
    });

    const aggregate = new CaseAggregate(record);
    aggregate.updateDetails(input, subject.userId);

    await this.repo.saveCase(aggregate.state);

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_UPDATE",
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      metadata: { newVersion: aggregate.state.version },
    });

    for (const evt of aggregate.uncommittedEvents) {
      await DomainEventPublisher.publish(evt);
    }
    aggregate.clearEvents();

    return aggregate.state;
  }

  /**
   * Transition case status via the formal state machine.
   */
  public async transitionCaseStatus(
    subject: Subject,
    caseId: string,
    input: TransitionCaseStatusInput,
    context: Partial<AccessContext> = {}
  ): Promise<CaseRecord> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    // Determine specific permission required
    let action = "case:status_change";
    if (input.newStatus === "CLOSED") {
      action = "case:close";
    } else if (input.newStatus === "REOPENED") {
      action = "case:reopen";
    }

    await this.authorizeAndAudit(subject, action, resource, {
      purpose: "CASE_INVESTIGATION",
      ...context,
    });

    const activeRequests = await this.repo.getActiveExaminationRequestsCount(caseId);
    const aggregate = new CaseAggregate(record);
    aggregate.transitionStatus(input, subject.userId, activeRequests);

    await this.repo.saveCase(aggregate.state);
    await this.repo.recordStatusHistory(
      caseId,
      subject.userId,
      record.status,
      input.newStatus,
      input.reason,
      record.dataClassification
    );

    const auditAction =
      input.newStatus === "CLOSED"
        ? "CASE_CLOSE"
        : input.newStatus === "REOPENED"
        ? "CASE_REOPEN"
        : "CASE_UPDATE";

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: auditAction,
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      reason: input.reason,
      metadata: {
        fromStatus: record.status,
        toStatus: input.newStatus,
      },
    });

    for (const evt of aggregate.uncommittedEvents) {
      await DomainEventPublisher.publish(evt);
    }
    aggregate.clearEvents();

    return aggregate.state;
  }

  /**
   * Assign an investigator or examiner to the case.
   */
  public async assignPersonnel(
    subject: Subject,
    caseId: string,
    input: AssignCaseInput,
    context: Partial<AccessContext> = {}
  ): Promise<CaseAssignmentRecord> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:assign", resource, {
      purpose: "CASE_INVESTIGATION",
      ...context,
    });

    const assignment = await this.repo.addAssignment(
      caseId,
      input,
      subject.userId,
      record.dataClassification
    );

    // If assigned as LEAD_INVESTIGATOR, update the aggregate
    if (input.caseRole === "LEAD_INVESTIGATOR") {
      const aggregate = new CaseAggregate(record);
      aggregate.reassignLeadInvestigator(input.userId, subject.userId);
      await this.repo.saveCase(aggregate.state);

      for (const evt of aggregate.uncommittedEvents) {
        await DomainEventPublisher.publish(evt);
      }
      aggregate.clearEvents();
    }

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_ASSIGN",
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      metadata: {
        assignedUserId: input.userId,
        role: input.caseRole,
        scope: input.accessScope,
      },
    });

    return assignment;
  }

  /**
   * Revoke an active case assignment (historical preservation).
   */
  public async revokeAssignment(
    subject: Subject,
    caseId: string,
    assignmentId: string,
    reason: string,
    context: Partial<AccessContext> = {}
  ): Promise<void> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:assign", resource, {
      purpose: "CASE_INVESTIGATION",
      ...context,
    });

    await this.repo.revokeAssignment(assignmentId, subject.userId, reason);

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_ASSIGN",
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      reason: `Assignment revoked: ${reason}`,
      metadata: { assignmentId },
    });
  }

  /**
   * Transfer case responsibility across institutions/investigators.
   */
  public async transferCase(
    subject: Subject,
    caseId: string,
    input: TransferCaseInput,
    context: Partial<AccessContext> = {}
  ): Promise<CaseTransferRecord> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:transfer", resource, {
      purpose: "CASE_INVESTIGATION",
      ...context,
    });

    const prevInvestigatorId = record.leadInvestigatorId;
    const prevOrgId = record.originatingOrgId;

    const aggregate = new CaseAggregate(record);
    aggregate.transferResponsibility(input, subject.userId);

    const transfer = await this.repo.addTransfer(
      caseId,
      prevOrgId,
      input.toOrgId,
      prevInvestigatorId,
      input.toInvestigatorId,
      input,
      subject.userId,
      record.dataClassification
    );

    await this.repo.saveCase(aggregate.state);

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_TRANSFER",
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      reason: input.transferReason,
      metadata: {
        fromOrg: record.originatingOrgId,
        toOrg: input.toOrgId,
        toInvestigator: input.toInvestigatorId,
      },
    });

    for (const evt of aggregate.uncommittedEvents) {
      await DomainEventPublisher.publish(evt);
    }
    aggregate.clearEvents();

    return transfer;
  }

  /**
   * Add a case participant (suspect, victim, witness, etc.).
   */
  public async addParticipant(
    subject: Subject,
    caseId: string,
    input: AddParticipantInput,
    context: Partial<AccessContext> = {}
  ): Promise<CaseParticipantRecord> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:participant_manage", resource, {
      purpose: "CASE_INVESTIGATION",
      ...context,
    });

    const participant = await this.repo.addParticipant(
      caseId,
      input,
      input.dataClassification ?? record.dataClassification
    );

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_PARTICIPANT_ADD",
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      metadata: {
        participantId: participant.id,
        role: participant.participantType,
      },
    });

    return participant;
  }

  /**
   * Remove a case participant.
   */
  public async removeParticipant(
    subject: Subject,
    caseId: string,
    participantId: string,
    reason: string,
    context: Partial<AccessContext> = {}
  ): Promise<void> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:participant_manage", resource, {
      purpose: "CASE_INVESTIGATION",
      ...context,
    });

    await this.repo.removeParticipant(participantId);

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_PARTICIPANT_REMOVE",
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      reason,
      metadata: { participantId },
    });
  }

  /**
   * Add a case journal note.
   */
  public async addNote(
    subject: Subject,
    caseId: string,
    input: AddNoteInput,
    context: Partial<AccessContext> = {}
  ): Promise<CaseNoteRecord> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:note_add", resource, context);

    const note = await this.repo.addNote(
      caseId,
      subject.userId,
      input,
      record.dataClassification
    );

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_NOTE_ADD",
      entityType: "case",
      entityId: record.id,
      outcome: "SUCCESS",
      metadata: { noteId: note.id, isConfidential: note.isConfidential },
    });

    return note;
  }

  /**
   * Get case notes, filtering confidential notes based on clearance.
   */
  public async getNotes(
    subject: Subject,
    caseId: string,
    context: Partial<AccessContext> = {}
  ): Promise<CaseNoteRecord[]> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const userTier = CLASSIFICATION_TIERS[subject.clearanceCode] ?? 1;
    const caseTier = CLASSIFICATION_TIERS[record.dataClassification] ?? 3;
    const isMinimized = userTier < caseTier;

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: isMinimized ? "INTERNAL" : record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:read", resource, context);

    const includeConfidential = userTier >= CLASSIFICATION_TIERS["RESTRICTED"];

    return this.repo.getNotes(caseId, includeConfidential);
  }

  /**
   * Link cases or record duplicate candidates.
   */
  public async linkCases(
    subject: Subject,
    sourceCaseId: string,
    input: LinkCaseInput,
    context: Partial<AccessContext> = {}
  ): Promise<CaseLinkRecord> {
    const source = await this.repo.findById(sourceCaseId);
    if (!source) throw new CaseNotFoundError(sourceCaseId);

    const target = await this.repo.findById(input.targetCaseId);
    if (!target) throw new CaseNotFoundError(input.targetCaseId);

    const resource: Resource = {
      type: "case",
      id: source.id,
      classification: source.dataClassification,
      ownerOrgId: source.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:link", resource, context);

    const link = await this.repo.addLink(
      sourceCaseId,
      input,
      subject.userId,
      source.dataClassification
    );

    await logSecurityEvent(pool, {
      actorId: subject.userId,
      actorIpAddress: context.ipAddress ?? "127.0.0.1",
      action: "CASE_LINK",
      entityType: "case",
      entityId: source.id,
      outcome: "SUCCESS",
      metadata: { targetCaseId: input.targetCaseId, linkType: input.linkType },
    });

    return link;
  }

  /**
   * Retrieve chronological timeline of all events across the case.
   */
  public async getTimeline(
    subject: Subject,
    caseId: string,
    context: Partial<AccessContext> = {}
  ): Promise<CaseTimelineItem[]> {
    const record = await this.repo.findById(caseId);
    if (!record) throw new CaseNotFoundError(caseId);

    const userTier = CLASSIFICATION_TIERS[subject.clearanceCode] ?? 1;
    const caseTier = CLASSIFICATION_TIERS[record.dataClassification] ?? 3;
    const isMinimized = userTier < caseTier;

    const resource: Resource = {
      type: "case",
      id: record.id,
      classification: isMinimized ? "INTERNAL" : record.dataClassification,
      ownerOrgId: record.originatingOrgId,
    };

    await this.authorizeAndAudit(subject, "case:read", resource, context);

    return this.repo.getTimeline(caseId);
  }

  /**
   * Search and filter cases respecting authorization boundaries.
   */
  public async searchCases(
    subject: Subject,
    filter: CaseSearchFilter,
    context: Partial<AccessContext> = {}
  ): Promise<{ cases: CaseRecord[]; total: number }> {
    const resource: Resource = {
      type: "case",
      id: "ALL_CASES",
      classification: "INTERNAL",
      ownerOrgId: subject.organizationId,
    };

    await this.authorizeAndAudit(subject, "case:read", resource, context);

    // If subject is not cross-org authorized (or break-glass), restrict search to subject's own organization
    const effectiveFilter = { ...filter };
    if (!subject.breakGlassActive && !subject.roles.includes("AUDITOR") && !subject.roles.includes("SECURITY_ADMINISTRATOR")) {
      effectiveFilter.organizationId = subject.organizationId;
    }

    return this.repo.searchCases(effectiveFilter);
  }
}
