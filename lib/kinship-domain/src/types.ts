export type RelationshipType =
  | "PARENT_CHILD"
  | "FULL_SIBLINGS"
  | "HALF_SIBLINGS"
  | "GRANDPARENT_GRANDCHILD"
  | "AUNT_UNCLE_NIECE_NEPHEW"
  | "COUSIN"
  | "OTHER_APPROVED";

export type KinshipStatus =
  | "DRAFT"
  | "AUTHORIZATION_PENDING"
  | "AUTHORIZED"
  | "ANALYSIS_PENDING"
  | "ANALYZING"
  | "REVIEW_PENDING"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "INCONCLUSIVE"
  | "CLOSED";

export type KinshipResultCategory = "SUPPORTED" | "EXCLUDED" | "INCONCLUSIVE";

export type PedigreeNodeStatus =
  | "KNOWN"
  | "UNKNOWN"
  | "HYPOTHESIZED"
  | "CONFIRMED"
  | "EXCLUDED"
  | "UNCERTAIN";

export type FamilialSearchStatus =
  | "REQUESTED"
  | "AUTHORIZATION_PENDING"
  | "AUTHORIZED"
  | "SEARCHING"
  | "COMPLETED"
  | "REJECTED";

export interface KinshipInvestigationData {
  id: string;
  investigationNumber: string;
  caseId: string;
  initiatingOrgId: string;
  initiatingUserId: string;
  purpose: string;
  legalBasis: string;
  status: KinshipStatus;
  sensitivity: string;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RelationshipHypothesisData {
  id: string;
  investigationId: string;
  profileAId: string;
  profileBId: string;
  relationshipType: RelationshipType;
  description?: string | null;
  status: string;
  approvedMethod: string;
  createdAt: Date;
}

export interface PedigreeNodeData {
  id: string;
  pedigreeId: string;
  personId?: string | null;
  label: string;
  gender: "MALE" | "FEMALE" | "UNKNOWN";
  nodeStatus: PedigreeNodeStatus;
  profileId?: string | null;
  sampleId?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface PedigreeRelationshipData {
  id: string;
  pedigreeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: RelationshipType;
  relationshipStatus: PedigreeNodeStatus;
  notes?: string | null;
  createdAt: Date;
}

export interface PedigreeData {
  id: string;
  investigationId: string;
  title: string;
  currentVersionNumber: number;
  nodes: PedigreeNodeData[];
  relationships: PedigreeRelationshipData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PedigreeVersionSnapshot {
  versionNumber: number;
  pedigreeId: string;
  snapshotData: {
    nodes: PedigreeNodeData[];
    relationships: PedigreeRelationshipData[];
  };
  changeReason: string;
  changedById: string;
  createdAt: Date;
}

export interface SharedAlleleLocus {
  locusName: string;
  profileAAlleles: string[];
  profileBAlleles: string[];
  sharedAlleleCount: number;
  ibsState: number; // 0, 1, or 2
  locusLR: number;
}

export interface KinshipAnalysisData {
  id: string;
  analysisNumber: string;
  investigationId: string;
  hypothesisId: string;
  inputProfileIds: string[];
  algorithmName: string;
  algorithmVersion: string;
  configuration: Record<string, unknown>;
  populationDatasetCode: string;
  populationDatasetVersion: string;
  analystId: string;
  executionTimestamp: Date;
  status: "COMPLETED" | "INCONCLUSIVE" | "FAILED";
  limitations?: string | null;
}

export interface KinshipResultData {
  id: string;
  analysisId: string;
  hypothesisId: string;
  combinedLikelihoodRatio: string;
  sharedAlleleSummary: {
    totalLociEvaluated: number;
    ibs2LociCount: number;
    ibs1LociCount: number;
    ibs0LociCount: number;
    lociDetails: SharedAlleleLocus[];
  };
  interpretationCategory: KinshipResultCategory;
  confidenceQualityInfo: {
    confidenceLevelPct: number;
    scientificallyConstrained: boolean;
    constraintReason?: string;
  };
  limitations: string;
  reviewerId?: string | null;
  reviewStatus: "PENDING" | "ACCEPTED" | "REJECTED" | "INCONCLUSIVE";
  reviewNotes?: string | null;
  confirmedOutcome?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
}

export interface FamilialSearchRequestData {
  id: string;
  searchNumber: string;
  caseId: string;
  targetProfileId: string;
  targetIndices: string[];
  searchPurpose: string;
  legalBasis: string;
  requestingUserId: string;
  authorizingUserId?: string | null;
  authorizedAt?: Date | null;
  status: FamilialSearchStatus;
  createdAt: Date;
}

export interface CandidateRankingData {
  id: string;
  requestId: string;
  candidateProfileId: string;
  estimatedRelationshipType: RelationshipType;
  likelihoodRatioScore: string;
  rankingIndex: number;
  leadStatus: "INVESTIGATIVE_LEAD" | "CONFIRMED_FORENSIC_CONCLUSION";
  reviewerId?: string | null;
  reviewNotes?: string | null;
}

// Scientific population dataset interface
export interface PopulationAlleleFrequencyMap {
  datasetCode: string;
  datasetVersion: string;
  description: string;
  frequencies: Record<string, Record<string, number>>; // locus -> allele -> freq
}

// Custom Domain Error Classes
export class KinshipAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KinshipAuthorizationError";
  }
}

export class KinshipLegalBasisMissingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KinshipLegalBasisMissingError";
  }
}

export class KinshipSeparationOfDutiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KinshipSeparationOfDutiesError";
  }
}

export class KinshipInvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KinshipInvalidStateTransitionError";
  }
}

export class KinshipScientificConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KinshipScientificConstraintError";
  }
}

export class KinshipEliminationProtectionViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KinshipEliminationProtectionViolationError";
  }
}
