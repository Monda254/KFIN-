import type {
  EvidenceState,
  EvidenceStatus,
  SealStatus,
  EvidenceCondition,
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
import { EvidenceStateMachine } from "./state-machine";
import { EvidenceNumberGenerator } from "./numbering";
import {
  DomainEventPublisher,
  createEvidenceCreatedEvent,
  createEvidenceSealedEvent,
  createSealBrokenEvent,
  createCustodyTransferredEvent,
  createCustodyReceivedEvent,
  createEvidenceRetrievedEvent,
  createEvidenceReturnedEvent,
  createDerivativeCreatedEvent,
  createEvidenceDisposedEvent,
} from "../events/domain-events";

export class ConcurrencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConcurrencyConflictError";
  }
}

export class LegalHoldViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LegalHoldViolationError";
  }
}

export class EvidenceAggregate {
  private state: EvidenceState;
  private custodyEvents: CustodyEventRecord[] = [];
  private seals: SealRecord[] = [];
  private transfers: CustodyTransferRecord[] = [];
  private exceptions: CustodyExceptionRecord[] = [];
  private derivatives: EvidenceDerivativeRecord[] = [];
  private examinations: EvidenceExaminationRecord[] = [];
  private dispositions: EvidenceDispositionRecord[] = [];
  private verifications: IntegrityVerificationRecord[] = [];

  constructor(
    state: EvidenceState,
    custodyEvents: CustodyEventRecord[] = [],
    seals: SealRecord[] = [],
    transfers: CustodyTransferRecord[] = [],
    exceptions: CustodyExceptionRecord[] = [],
    derivatives: EvidenceDerivativeRecord[] = [],
    examinations: EvidenceExaminationRecord[] = [],
    dispositions: EvidenceDispositionRecord[] = [],
    verifications: IntegrityVerificationRecord[] = []
  ) {
    this.state = { ...state };
    this.custodyEvents = [...custodyEvents];
    this.seals = [...seals];
    this.transfers = [...transfers];
    this.exceptions = [...exceptions];
    this.derivatives = [...derivatives];
    this.examinations = [...examinations];
    this.dispositions = [...dispositions];
    this.verifications = [...verifications];
  }

  public getState(): Readonly<EvidenceState> {
    return { ...this.state };
  }

  public getCustodyEvents(): ReadonlyArray<CustodyEventRecord> {
    return [...this.custodyEvents];
  }

  public getSeals(): ReadonlyArray<SealRecord> {
    return [...this.seals];
  }

  public getTransfers(): ReadonlyArray<CustodyTransferRecord> {
    return [...this.transfers];
  }

  public getExceptions(): ReadonlyArray<CustodyExceptionRecord> {
    return [...this.exceptions];
  }

  public getDerivatives(): ReadonlyArray<EvidenceDerivativeRecord> {
    return [...this.derivatives];
  }

  public getExaminations(): ReadonlyArray<EvidenceExaminationRecord> {
    return [...this.examinations];
  }

  public getDispositions(): ReadonlyArray<EvidenceDispositionRecord> {
    return [...this.dispositions];
  }

  public getVerifications(): ReadonlyArray<IntegrityVerificationRecord> {
    return [...this.verifications];
  }

  public checkConcurrency(expectedVersion?: number): void {
    if (expectedVersion !== undefined && expectedVersion !== this.state.version) {
      throw new ConcurrencyConflictError(
        `Optimistic Concurrency Conflict: Expected version ${expectedVersion}, but aggregate is currently at version ${this.state.version}.`
      );
    }
  }

  public static create(params: {
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
  }): EvidenceAggregate {
    const reference = EvidenceNumberGenerator.generate({
      organizationPrefix: params.organizationPrefix || "KFIN",
      isSynthetic: params.isSynthetic,
    });

    const now = new Date().toISOString();
    const initialState: EvidenceState = {
      id: params.id,
      caseId: params.caseId,
      evidenceReference: reference,
      itemNumber: params.itemNumber,
      description: params.description,
      evidenceType: params.evidenceType,
      classification: params.classification || "RESTRICTED",
      collectionTimestamp: params.collectionTimestamp,
      collectedById: params.collectedById,
      collectionLocationDesc: params.collectionLocationDesc,
      currentLocationId: params.currentLocationId,
      currentCustodianId: params.currentCustodianId,
      tamperSealNumber: params.tamperSealNumber,
      sealStatus: "INTACT",
      condition: "INTACT",
      integrityHash: params.integrityHash,
      hashAlgorithm: "SHA-256",
      status: "COLLECTED",
      packagingType: params.packagingType,
      parentItemId: null,
      isLegalHold: false,
      version: 1,
      notes: params.notes || null,
      createdAt: now,
      updatedAt: now,
    };

    const initialSeal: SealRecord = {
      id: `seal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: params.id,
      sealNumber: params.tamperSealNumber,
      sealType: "BARCODE_TAMPER_EVIDENT",
      appliedById: params.collectedById,
      appliedAt: now,
      status: "INTACT",
    };

    const initialCustody: CustodyEventRecord = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: params.id,
      action: "COLLECTED",
      actorId: params.collectedById,
      toCustodianId: params.currentCustodianId,
      toLocationId: params.currentLocationId,
      purpose: "Initial field collection and accessioning",
      sealStatus: "INTACT",
      condition: "INTACT",
      eventTimestamp: now,
    };

    const aggregate = new EvidenceAggregate(
      initialState,
      [initialCustody],
      [initialSeal]
    );

    DomainEventPublisher.getInstance().publish(
      createEvidenceCreatedEvent(
        params.id,
        params.caseId,
        params.collectedById,
        reference,
        params.evidenceType
      )
    );

    return aggregate;
  }

  public seal(actorId: string, sealNumber: string, sealType: string = "TAMPER_PROOF_BAND", expectedVersion?: number): void {
    this.checkConcurrency(expectedVersion);
    const now = new Date().toISOString();

    const newSeal: SealRecord = {
      id: `seal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      sealNumber,
      sealType,
      appliedById: actorId,
      appliedAt: now,
      status: "INTACT",
    };

    this.seals.push(newSeal);
    this.state.tamperSealNumber = sealNumber;
    this.state.sealStatus = "INTACT";
    this.state.status = "SEALED";
    this.state.version += 1;
    this.state.updatedAt = now;

    this.custodyEvents.push({
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      action: "SEALED",
      actorId,
      purpose: "Exhibit packaging sealing",
      sealStatus: "INTACT",
      condition: this.state.condition,
      eventTimestamp: now,
    });

    DomainEventPublisher.getInstance().publish(
      createEvidenceSealedEvent(this.state.id, this.state.caseId, actorId, sealNumber)
    );
  }

  public breakSeal(actorId: string, reason: string, authorizationReference?: string, expectedVersion?: number): void {
    this.checkConcurrency(expectedVersion);
    const now = new Date().toISOString();

    const activeSealIndex = this.seals.findIndex((s) => s.status === "INTACT");
    if (activeSealIndex !== -1) {
      this.seals[activeSealIndex] = {
        ...this.seals[activeSealIndex],
        status: "BROKEN",
        brokenById: actorId,
        brokenAt: now,
        breakReason: reason,
        authorizationReference: authorizationReference || null,
      };
    }

    this.state.sealStatus = "BROKEN";
    this.state.version += 1;
    this.state.updatedAt = now;

    this.custodyEvents.push({
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      action: "SEAL_BROKEN",
      actorId,
      purpose: `Seal broken: ${reason}`,
      authorizationReference: authorizationReference || null,
      sealStatus: "BROKEN",
      condition: this.state.condition,
      eventTimestamp: now,
    });

    DomainEventPublisher.getInstance().publish(
      createSealBrokenEvent(this.state.id, this.state.caseId, actorId, this.state.tamperSealNumber, reason)
    );
  }

  public initiateTransfer(
    releasingOfficerId: string,
    receivingOfficerId: string,
    transferReason: string,
    authorizationReference: string,
    destinationLocationId?: string,
    expectedVersion?: number
  ): CustodyTransferRecord {
    this.checkConcurrency(expectedVersion);
    EvidenceStateMachine.validateTransition(this.state.status, "TRANSFERRED");

    const now = new Date().toISOString();
    const transfer: CustodyTransferRecord = {
      id: `xfer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      releasingOfficerId,
      receivingOfficerId,
      transferReason,
      authorizationReference,
      transferTimestamp: now,
      sourceLocationId: this.state.currentLocationId,
      destinationLocationId: destinationLocationId || null,
      sealIntact: this.state.sealStatus === "INTACT",
      transferStatus: "INITIATED",
    };

    this.transfers.push(transfer);
    this.state.status = "TRANSFERRED";
    this.state.version += 1;
    this.state.updatedAt = now;

    this.custodyEvents.push({
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      action: "TRANSFER_INITIATED",
      actorId: releasingOfficerId,
      fromCustodianId: releasingOfficerId,
      toCustodianId: receivingOfficerId,
      fromLocationId: this.state.currentLocationId,
      toLocationId: destinationLocationId || null,
      purpose: transferReason,
      authorizationReference,
      sealStatus: this.state.sealStatus,
      condition: this.state.condition,
      eventTimestamp: now,
    });

    DomainEventPublisher.getInstance().publish(
      createCustodyTransferredEvent(
        this.state.id,
        this.state.caseId,
        releasingOfficerId,
        releasingOfficerId,
        receivingOfficerId,
        transferReason
      )
    );

    return transfer;
  }

  public receiveTransfer(
    receivingOfficerId: string,
    destinationLocationId: string,
    sealIntact: boolean = true,
    newSealNumber?: string,
    notes?: string,
    expectedVersion?: number
  ): void {
    this.checkConcurrency(expectedVersion);
    EvidenceStateMachine.validateTransition(this.state.status, "RECEIVED");

    const now = new Date().toISOString();
    const lastTransferIndex = this.transfers.length - 1;
    if (lastTransferIndex >= 0) {
      this.transfers[lastTransferIndex] = {
        ...this.transfers[lastTransferIndex],
        transferStatus: "COMPLETED",
        destinationLocationId,
        newSealNumber: newSealNumber || null,
        notes: notes || null,
      };
    }

    this.state.currentCustodianId = receivingOfficerId;
    this.state.currentLocationId = destinationLocationId;
    this.state.status = "RECEIVED";

    if (!sealIntact) {
      this.state.sealStatus = "TAMPER_SUSPECTED";
      this.exceptions.push({
        id: `exc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        evidenceId: this.state.id,
        exceptionType: "SEAL_BROKEN",
        reportedById: receivingOfficerId,
        reportedAt: now,
        description: `Tamper or seal compromise detected during receipt: ${notes || "Unspecified discrepancy"}`,
        isResolved: false,
      });
      this.state.status = "EXCEPTION";
    }

    if (newSealNumber) {
      this.state.tamperSealNumber = newSealNumber;
      this.state.sealStatus = "INTACT";
      this.seals.push({
        id: `seal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        evidenceId: this.state.id,
        sealNumber: newSealNumber,
        sealType: "BARCODE_TAMPER_EVIDENT",
        appliedById: receivingOfficerId,
        appliedAt: now,
        status: "INTACT",
      });
    }

    this.state.version += 1;
    this.state.updatedAt = now;

    this.custodyEvents.push({
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      action: "RECEIVED",
      actorId: receivingOfficerId,
      toCustodianId: receivingOfficerId,
      toLocationId: destinationLocationId,
      purpose: "Transfer received and accepted into custody",
      sealStatus: this.state.sealStatus,
      condition: this.state.condition,
      eventTimestamp: now,
      notes: notes || null,
    });

    DomainEventPublisher.getInstance().publish(
      createCustodyReceivedEvent(this.state.id, this.state.caseId, receivingOfficerId, destinationLocationId)
    );
  }

  public retrieveFromStorage(actorId: string, purpose: string, authorizationReference?: string, expectedVersion?: number): void {
    this.checkConcurrency(expectedVersion);
    EvidenceStateMachine.validateTransition(this.state.status, "RETRIEVED");

    const now = new Date().toISOString();
    this.state.status = "RETRIEVED";
    this.state.currentCustodianId = actorId;
    this.state.version += 1;
    this.state.updatedAt = now;

    this.custodyEvents.push({
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      action: "RETRIEVED",
      actorId,
      fromLocationId: this.state.currentLocationId,
      purpose,
      authorizationReference: authorizationReference || null,
      sealStatus: this.state.sealStatus,
      condition: this.state.condition,
      eventTimestamp: now,
    });

    DomainEventPublisher.getInstance().publish(
      createEvidenceRetrievedEvent(this.state.id, this.state.caseId, actorId, purpose)
    );
  }

  public returnToStorage(actorId: string, destinationLocationId: string, notes?: string, expectedVersion?: number): void {
    this.checkConcurrency(expectedVersion);
    EvidenceStateMachine.validateTransition(this.state.status, "STORED");

    const now = new Date().toISOString();
    this.state.status = "STORED";
    this.state.currentLocationId = destinationLocationId;
    this.state.currentCustodianId = actorId;
    this.state.version += 1;
    this.state.updatedAt = now;

    this.custodyEvents.push({
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      action: "RETURNED_TO_STORAGE",
      actorId,
      toLocationId: destinationLocationId,
      purpose: "Returned exhibit to secure storage vault",
      sealStatus: this.state.sealStatus,
      condition: this.state.condition,
      eventTimestamp: now,
      notes: notes || null,
    });

    DomainEventPublisher.getInstance().publish(
      createEvidenceReturnedEvent(this.state.id, this.state.caseId, actorId, destinationLocationId)
    );
  }

  public addDerivative(
    actorId: string,
    derivedEvidenceId: string,
    derivativeType: any,
    purpose: string,
    amountUsed?: string,
    remainingAmount?: string,
    expectedVersion?: number
  ): EvidenceDerivativeRecord {
    this.checkConcurrency(expectedVersion);
    const now = new Date().toISOString();

    const derivative: EvidenceDerivativeRecord = {
      id: `deriv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      parentEvidenceId: this.state.id,
      derivedEvidenceId,
      derivativeType,
      createdById: actorId,
      createdTimestamp: now,
      purpose,
      amountUsed: amountUsed || null,
      remainingAmount: remainingAmount || null,
    };

    this.derivatives.push(derivative);
    this.state.version += 1;
    this.state.updatedAt = now;

    DomainEventPublisher.getInstance().publish(
      createDerivativeCreatedEvent(this.state.id, this.state.caseId, actorId, derivedEvidenceId, derivativeType)
    );

    return derivative;
  }

  public dispose(
    approvedById: string,
    executedById: string,
    dispositionType: DispositionType,
    authorizationReference: string,
    disposalMethod: string,
    witnessById?: string,
    expectedVersion?: number
  ): void {
    this.checkConcurrency(expectedVersion);

    if (this.state.isLegalHold) {
      throw new LegalHoldViolationError(
        `Cannot dispose exhibit ${this.state.evidenceReference}: Active Judicial Legal Hold is present.`
      );
    }

    EvidenceStateMachine.validateTransition(this.state.status, "DISPOSED");
    const now = new Date().toISOString();

    const dispRecord: EvidenceDispositionRecord = {
      id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      dispositionType,
      approvedById,
      executedById,
      witnessById: witnessById || null,
      authorizationReference,
      executedAt: now,
      disposalMethod,
    };

    this.dispositions.push(dispRecord);
    this.state.status = "DISPOSED";
    this.state.version += 1;
    this.state.updatedAt = now;

    this.custodyEvents.push({
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      action: "DISPOSED",
      actorId: executedById,
      purpose: `Evidence disposed via ${dispositionType} (${disposalMethod})`,
      authorizationReference,
      sealStatus: this.state.sealStatus,
      condition: this.state.condition,
      eventTimestamp: now,
    });

    DomainEventPublisher.getInstance().publish(
      createEvidenceDisposedEvent(this.state.id, this.state.caseId, executedById, dispositionType, disposalMethod)
    );
  }

  public verifyIntegrity(actorId: string, observedHash: string): IntegrityVerificationRecord {
    const now = new Date().toISOString();
    const result = observedHash === this.state.integrityHash ? "MATCH" : "MISMATCH";

    const verif: IntegrityVerificationRecord = {
      id: `verif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      evidenceId: this.state.id,
      verifiedById: actorId,
      verifiedAt: now,
      algorithm: this.state.hashAlgorithm,
      expectedHash: this.state.integrityHash,
      observedHash,
      result,
    };

    this.verifications.push(verif);

    if (result === "MISMATCH") {
      this.exceptions.push({
        id: `exc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        evidenceId: this.state.id,
        exceptionType: "IDENTITY_MISMATCH",
        reportedById: actorId,
        reportedAt: now,
        description: `Cryptographic Integrity Mismatch: Expected ${this.state.integrityHash}, observed ${observedHash}`,
        isResolved: false,
      });
      this.state.status = "EXCEPTION";
    }

    return verif;
  }

  public setLegalHold(isLegalHold: boolean): void {
    this.state.isLegalHold = isLegalHold;
    this.state.updatedAt = new Date().toISOString();
  }
}
