import {
  AuthorizationEngine,
  type Subject,
  type AccessContext,
  type Resource,
} from "@workspace/security";
import { EvidenceAggregate } from "../aggregate/evidence-aggregate";
import type {
  EvidenceState,
  CustodyEventRecord,
  SealRecord,
  CustodyTransferRecord,
  CustodyExceptionRecord,
  EvidenceDerivativeRecord,
  EvidenceExaminationRecord,
  EvidenceDispositionRecord,
  IntegrityVerificationRecord,
  DispositionType,
} from "../types";

export interface EvidenceRepository {
  save(aggregate: EvidenceAggregate): Promise<void>;
  findById(id: string): Promise<EvidenceAggregate | null>;
  findByCaseId(caseId: string): Promise<EvidenceAggregate[]>;
  findByReference(reference: string): Promise<EvidenceAggregate | null>;
  search(filters: Record<string, any>): Promise<EvidenceAggregate[]>;
}

export class InMemoryEvidenceRepository implements EvidenceRepository {
  private aggregates: Map<string, EvidenceAggregate> = new Map();

  public async save(aggregate: EvidenceAggregate): Promise<void> {
    this.aggregates.set(aggregate.getState().id, aggregate);
  }

  public async findById(id: string): Promise<EvidenceAggregate | null> {
    return this.aggregates.get(id) || null;
  }

  public async findByCaseId(caseId: string): Promise<EvidenceAggregate[]> {
    return Array.from(this.aggregates.values()).filter(
      (agg) => agg.getState().caseId === caseId
    );
  }

  public async findByReference(reference: string): Promise<EvidenceAggregate | null> {
    return (
      Array.from(this.aggregates.values()).find(
        (agg) => agg.getState().evidenceReference === reference
      ) || null
    );
  }

  public async search(filters: Record<string, any>): Promise<EvidenceAggregate[]> {
    return Array.from(this.aggregates.values()).filter((agg) => {
      const state = agg.getState();
      if (filters.caseId && state.caseId !== filters.caseId) return false;
      if (filters.status && state.status !== filters.status) return false;
      if (filters.evidenceType && state.evidenceType !== filters.evidenceType) return false;
      if (filters.currentCustodianId && state.currentCustodianId !== filters.currentCustodianId) return false;
      return true;
    });
  }

  public clear(): void {
    this.aggregates.clear();
  }
}

export class UnauthorizedEvidenceActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedEvidenceActionError";
  }
}

export class EvidenceNotFoundError extends Error {
  constructor(id: string) {
    super(`Evidence item with ID '${id}' was not found.`);
    this.name = "EvidenceNotFoundError";
  }
}

export class EvidenceService {
  constructor(private repo: EvidenceRepository) {}

  private authorize(
    subject: Subject,
    action: string,
    state?: EvidenceState,
    purpose?: string
  ): void {
    const resource: Resource = {
      type: "evidence",
      id: state?.id || "NEW_EVIDENCE",
      ownerOrgId: subject.organizationId,
      classification: (state?.classification as any) || "RESTRICTED",
      caseId: state?.caseId,
    };

    const context: AccessContext = {
      action,
      purpose: purpose as any,
      ipAddress: "127.0.0.1",
      correlationId: `corr_${Date.now()}`,
    };

    const decision = AuthorizationEngine.evaluate(subject, resource, context);
    if (decision.decision !== "ALLOW") {
      throw new UnauthorizedEvidenceActionError(
        `Action '${action}' DENIED for user '${subject.userId}': ${decision.explanation}`
      );
    }
  }

  public async createEvidence(
    subject: Subject,
    params: {
      id: string;
      caseId: string;
      itemNumber: string;
      description: string;
      evidenceType: any;
      classification?: any;
      collectionTimestamp: string;
      collectedById: string;
      collectionLocationDesc: string;
      currentLocationId: string;
      currentCustodianId: string;
      tamperSealNumber: string;
      integrityHash: string;
      packagingType: string;
      organizationPrefix?: string;
      isSynthetic?: boolean;
      notes?: string;
    }
  ): Promise<EvidenceAggregate> {
    this.authorize(subject, "evidence:create");

    const aggregate = EvidenceAggregate.create(params);
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async getEvidenceById(
    subject: Subject,
    id: string
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) {
      throw new EvidenceNotFoundError(id);
    }

    this.authorize(subject, "evidence:read", aggregate.getState());
    return aggregate;
  }

  public async sealEvidence(
    subject: Subject,
    id: string,
    sealNumber: string,
    sealType?: string,
    expectedVersion?: number
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:seal", aggregate.getState());
    aggregate.seal(subject.userId, sealNumber, sealType, expectedVersion);
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async breakSeal(
    subject: Subject,
    id: string,
    reason: string,
    authorizationReference?: string,
    expectedVersion?: number
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:seal_break", aggregate.getState(), "FORENSIC_EXAMINATION");
    aggregate.breakSeal(subject.userId, reason, authorizationReference, expectedVersion);
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async initiateTransfer(
    subject: Subject,
    id: string,
    receivingOfficerId: string,
    transferReason: string,
    authorizationReference: string,
    destinationLocationId?: string,
    expectedVersion?: number
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:transfer", aggregate.getState(), "LEGAL_PROCESS");
    aggregate.initiateTransfer(
      subject.userId,
      receivingOfficerId,
      transferReason,
      authorizationReference,
      destinationLocationId,
      expectedVersion
    );
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async receiveTransfer(
    subject: Subject,
    id: string,
    destinationLocationId: string,
    sealIntact: boolean = true,
    newSealNumber?: string,
    notes?: string,
    expectedVersion?: number
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:transfer", aggregate.getState(), "CASE_INVESTIGATION");
    aggregate.receiveTransfer(
      subject.userId,
      destinationLocationId,
      sealIntact,
      newSealNumber,
      notes,
      expectedVersion
    );
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async retrieveFromStorage(
    subject: Subject,
    id: string,
    purpose: string,
    authorizationReference?: string,
    expectedVersion?: number
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:read", aggregate.getState(), purpose || "CASE_INVESTIGATION");
    aggregate.retrieveFromStorage(subject.userId, purpose, authorizationReference, expectedVersion);
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async returnToStorage(
    subject: Subject,
    id: string,
    destinationLocationId: string,
    notes?: string,
    expectedVersion?: number
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:update", aggregate.getState(), "CASE_INVESTIGATION");
    aggregate.returnToStorage(subject.userId, destinationLocationId, notes, expectedVersion);
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async addDerivative(
    subject: Subject,
    id: string,
    derivedEvidenceId: string,
    derivativeType: any,
    purpose: string,
    amountUsed?: string,
    remainingAmount?: string,
    expectedVersion?: number
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:create", aggregate.getState(), purpose || "FORENSIC_EXAMINATION");
    aggregate.addDerivative(
      subject.userId,
      derivedEvidenceId,
      derivativeType,
      purpose,
      amountUsed,
      remainingAmount,
      expectedVersion
    );
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async disposeEvidence(
    subject: Subject,
    id: string,
    approvedById: string,
    dispositionType: DispositionType,
    authorizationReference: string,
    disposalMethod: string,
    witnessById?: string,
    expectedVersion?: number
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:dispose", aggregate.getState(), "LEGAL_PROCESS");
    aggregate.dispose(
      approvedById,
      subject.userId,
      dispositionType,
      authorizationReference,
      disposalMethod,
      witnessById,
      expectedVersion
    );
    await this.repo.save(aggregate);
    return aggregate;
  }

  public async verifyIntegrity(
    subject: Subject,
    id: string,
    observedHash: string
  ): Promise<{ aggregate: EvidenceAggregate; verification: IntegrityVerificationRecord }> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:read", aggregate.getState());
    const verification = aggregate.verifyIntegrity(subject.userId, observedHash);
    await this.repo.save(aggregate);
    return { aggregate, verification };
  }

  public async setLegalHold(
    subject: Subject,
    id: string,
    isLegalHold: boolean
  ): Promise<EvidenceAggregate> {
    const aggregate = await this.repo.findById(id);
    if (!aggregate) throw new EvidenceNotFoundError(id);

    this.authorize(subject, "evidence:update", aggregate.getState(), "LEGAL_PROCESS");
    aggregate.setLegalHold(isLegalHold);
    await this.repo.save(aggregate);
    return aggregate;
  }
}
