import type { ClassificationLevel } from "@workspace/security";

export type SampleType =
  | "WHOLE_BLOOD"
  | "BUCCAL_SWAB"
  | "TOUCH_DNA"
  | "SEMEN"
  | "TISSUE"
  | "BONE_FRAGMENT"
  | "HAIR_FOLLICLE"
  | "UNIDENTIFIED_BIOLOGICAL"
  | "OTHER";

export type DonorType =
  | "SUSPECT"
  | "VICTIM"
  | "ELIMINATION"
  | "MISSING_PERSON"
  | "RELATIVE"
  | "UNIDENTIFIED_HUMAN_REMAINS"
  | "EVIDENCE_STAIN"
  | "CONVICTED_OFFENDER";

export type DnaIndexCode =
  | "FORENSIC"
  | "OFFENDER"
  | "MISSING_PERSONS"
  | "UNIDENTIFIED_REMAINS"
  | "ELIMINATION";

export type ProfileQuality = "HIGH" | "MEDIUM" | "LOW" | "PARTIAL" | "MIXTURE";

export type ProfileStatus =
  | "DRAFT"
  | "PROCESSING"
  | "QUALITY_REVIEW"
  | "ACTIVE"
  | "SUSPENDED"
  | "WITHDRAWN"
  | "EXPIRED";

export type MatchingRequestStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";

export type CandidateMatchStatus =
  | "CANDIDATE"
  | "UNDER_REVIEW"
  | "TECHNICALLY_CONFIRMED"
  | "INCONCLUSIVE"
  | "EXCLUDED"
  | "REQUIRES_RETEST";

export type StringencyLevel = "HIGH" | "MODERATE" | "LOW";

export interface StrAllele {
  locusName: string;
  allele1: string;
  allele2?: string | null;
  allele3?: string | null;
  allele4?: string | null;
  peakHeight1?: number | null;
  peakHeight2?: number | null;
}

export interface BiologicalSampleRecord {
  id: string;
  sampleNumber: string;
  evidenceId?: string | null;
  caseId?: string | null;
  sampleType: SampleType;
  donorType: DonorType;
  donorPseudonym?: string | null;
  collectionDate: string;
  collectedById: string;
  storageFreezerLocation: string;
  concentrationNgUl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DnaIndexRecord {
  id: string;
  code: DnaIndexCode;
  name: string;
  description: string;
  legalBasisRegulation: string;
  retentionYearsDefault: number;
  isRestricted: boolean;
}

export interface DnaProfileState {
  id: string;
  sampleId: string;
  indexId: string;
  indexCode: DnaIndexCode;
  profileIdentifier: string;
  profileQuality: ProfileQuality;
  lociCount: number;
  profileStatus: ProfileStatus;
  extractionMethod: string;
  quantificationKit: string;
  amplificationKit: string;
  electrophoresisInstrument: string;
  analystId: string;
  reviewedById?: string | null;
  approvedById?: string | null;
  expungementEligibleDate?: string | null;
  classification: ClassificationLevel;
  version: number;
  isLegalHold: boolean;
  notes?: string | null;
  alleles: StrAllele[];
  createdAt: string;
  updatedAt: string;
}

export interface DnaMatchingRequestRecord {
  id: string;
  targetProfileId: string;
  requestedById: string;
  targetIndices: DnaIndexCode[];
  minMatchingLoci: number;
  searchPurpose: string;
  algorithmVersion: string;
  status: MatchingRequestStatus;
  completedAt?: string | null;
  createdAt: string;
}

export interface DnaMatchingResultRecord {
  id: string;
  requestId: string;
  candidateProfileId: string;
  matchingLociCount: number;
  stringencyLevel: StringencyLevel;
  likelihoodRatioScore: string;
  status: CandidateMatchStatus;
  reviewedById?: string | null;
  reviewNotes?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
}

export class UnauthorizedDnaActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedDnaActionError";
  }
}

export class DnaProfileNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DnaProfileNotFoundError";
  }
}

export class InvalidDnaTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDnaTransitionError";
  }
}

export class DnaConcurrencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DnaConcurrencyConflictError";
  }
}

export class DnaLegalHoldViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DnaLegalHoldViolationError";
  }
}
