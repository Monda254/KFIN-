import type { ClassificationLevel } from "@workspace/security";

export type EvidenceStatus =
  | "COLLECTED"
  | "PACKAGED"
  | "SEALED"
  | "TRANSFERRED"
  | "RECEIVED"
  | "STORED"
  | "RETRIEVED"
  | "EXAMINED"
  | "RETURNED"
  | "DISPOSED"
  | "ARCHIVED"
  | "EXCEPTION"
  | "IN_VAULT"
  | "CHECKED_OUT_LAB"
  | "IN_COURT"
  | "SUBMITTED";

export type EvidenceType =
  | "BIOLOGICAL_SPECIMEN"
  | "TOUCH_DNA_SWAB"
  | "WEAPON"
  | "CLOTHING"
  | "DIGITAL_MEDIA"
  | "DOCUMENT"
  | "TRACE_EVIDENCE"
  | "PHYSICAL_EXHIBIT"
  | "TOXICOLOGICAL"
  | "CHEMICAL"
  | "FIREARM_RELATED"
  | "FINGERPRINT_RELATED"
  | "UNIDENTIFIED_REMAINS"
  | "ENVIRONMENTAL"
  | "OTHER";

export type SealStatus = "INTACT" | "BROKEN" | "TAMPER_SUSPECTED" | "RESEALED" | "UNKNOWN";
export type EvidenceCondition = "INTACT" | "DAMAGED" | "WET" | "CONTAMINATED" | "DEGRADED" | "SEALED" | "UNSEALED" | "UNKNOWN";
export type CustodyExceptionType = "TRANSFER_DISPUTED" | "SEAL_BROKEN" | "MISSING" | "DAMAGED" | "CONTAMINATION_SUSPECTED" | "IDENTITY_MISMATCH";
export type DerivativeType = "SUBDIVISION" | "EXTRACTED_SAMPLE" | "TEST_DERIVATIVE" | "DIGITAL_COPY";
export type DispositionType = "RETURNED" | "TRANSFERRED_OUT" | "RETAINED" | "ARCHIVED" | "DESTROYED";

export interface EvidenceState {
  id: string;
  caseId: string;
  evidenceReference: string;
  itemNumber: string;
  description: string;
  evidenceType: EvidenceType;
  classification: ClassificationLevel;
  collectionTimestamp: string;
  collectedById: string;
  collectionLocationDesc: string;
  currentLocationId: string;
  currentCustodianId: string;
  tamperSealNumber: string;
  sealStatus: SealStatus;
  condition: EvidenceCondition;
  integrityHash: string;
  hashAlgorithm: string;
  status: EvidenceStatus;
  packagingType: string;
  parentItemId?: string | null;
  isLegalHold: boolean;
  version: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustodyEventRecord {
  id: string;
  evidenceId: string;
  action: string;
  actorId: string;
  fromCustodianId?: string | null;
  toCustodianId?: string | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  purpose: string;
  authorizationReference?: string | null;
  sealStatus: SealStatus;
  condition: EvidenceCondition;
  eventTimestamp: string;
  notes?: string | null;
}

export interface SealRecord {
  id: string;
  evidenceId: string;
  sealNumber: string;
  sealType: string;
  appliedById: string;
  appliedAt: string;
  brokenById?: string | null;
  brokenAt?: string | null;
  breakReason?: string | null;
  authorizationReference?: string | null;
  status: SealStatus;
  notes?: string | null;
}

export interface CustodyTransferRecord {
  id: string;
  evidenceId: string;
  releasingOfficerId: string;
  receivingOfficerId: string;
  transferReason: string;
  authorizationReference: string;
  transferTimestamp: string;
  sourceLocationId?: string | null;
  destinationLocationId?: string | null;
  sealIntact: boolean;
  newSealNumber?: string | null;
  transferStatus: string;
  notes?: string | null;
}

export interface CustodyExceptionRecord {
  id: string;
  evidenceId: string;
  exceptionType: CustodyExceptionType;
  reportedById: string;
  reportedAt: string;
  description: string;
  isResolved: boolean;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
}

export interface EvidenceDerivativeRecord {
  id: string;
  parentEvidenceId: string;
  derivedEvidenceId: string;
  derivativeType: DerivativeType;
  createdById: string;
  createdTimestamp: string;
  purpose: string;
  amountUsed?: string | null;
  remainingAmount?: string | null;
  notes?: string | null;
}

export interface EvidenceExaminationRecord {
  id: string;
  evidenceId: string;
  examinerId: string;
  examinationType: string;
  purpose: string;
  locationDesc: string;
  startedAt: string;
  completedAt?: string | null;
  status: string;
  findingsSummary?: string | null;
  reportReference?: string | null;
}

export interface EvidenceDispositionRecord {
  id: string;
  evidenceId: string;
  dispositionType: DispositionType;
  approvedById: string;
  executedById: string;
  witnessById?: string | null;
  authorizationReference: string;
  executedAt: string;
  disposalMethod: string;
  notes?: string | null;
}

export interface IntegrityVerificationRecord {
  id: string;
  evidenceId: string;
  verifiedById: string;
  verifiedAt: string;
  algorithm: string;
  expectedHash: string;
  observedHash: string;
  result: "MATCH" | "MISMATCH";
  notes?: string | null;
}
