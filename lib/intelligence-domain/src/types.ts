export type RelationshipClass =
  | "FACT"
  | "ANALYTICAL_RELATIONSHIP"
  | "INVESTIGATIVE_LEAD"
  | "HYPOTHESIS"
  | "CONFIRMED_FORENSIC_RELATIONSHIP";

export type IntelligenceLeadStatus =
  | "NEW"
  | "ASSIGNED"
  | "UNDER_REVIEW"
  | "CONFIRMED"
  | "REJECTED"
  | "INCONCLUSIVE"
  | "CLOSED";

export type CaseLinkStatus =
  | "PROPOSED"
  | "UNDER_REVIEW"
  | "CONFIRMED"
  | "REJECTED";

export interface ForensicRelationshipData {
  id: string;
  relationshipNumber: string;
  sourceEntityType: string; // e.g. CASE, PERSON, EVIDENCE, DNA_PROFILE, LOCATION
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  relationshipType: string;
  relationshipClass: RelationshipClass;
  confidenceScore?: string | null;
  provenanceSource: string;
  organizationId: string;
  status: string;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntelligenceObservationData {
  id: string;
  observationNumber: string;
  title: string;
  description: string;
  originatingAnalysisId?: string | null;
  relatedEntities: { entityType: string; entityId: string; label?: string }[];
  rationale: string;
  sensitivityLevel: string;
  createdAt: Date;
}

export interface IntelligenceLeadData {
  id: string;
  leadNumber: string;
  observationId?: string | null;
  title: string;
  rationale: string;
  priority: "ROUTINE" | "PRIORITY" | "EXPEDITED" | "CRITICAL";
  status: IntelligenceLeadStatus;
  assignedInvestigatorId?: string | null;
  assignedOrgId?: string | null;
  reviewedById?: string | null;
  reviewNotes?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GraphNode {
  id: string; // entityType:entityId
  entityType: string;
  entityId: string;
  label: string;
  organizationId?: string | null;
  sensitivity: string;
  isRedacted?: boolean;
}

export interface GraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
  relationshipClass: RelationshipClass;
  provenanceSource: string;
  confidenceScore?: string | null;
  isRestricted?: boolean;
}

export interface LinkAnalysisData {
  id: string;
  analysisNumber: string;
  requestedById: string;
  scope: { rootEntityId: string; rootEntityType: string };
  maxDepth: number;
  filters: { allowedClasses?: RelationshipClass[]; allowedTypes?: string[] };
  resultSummary: {
    nodes: GraphNode[];
    edges: GraphEdge[];
    totalNodes: number;
    totalEdges: number;
  };
  executedAt: Date;
}

export interface CaseLinkData {
  id: string;
  sourceCaseId: string;
  targetCaseId: string;
  linkType: string;
  rationale: string;
  status: CaseLinkStatus;
  approvedById?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonResolutionCandidateData {
  id: string;
  personAId: string;
  personBId: string;
  similarityScore: string;
  matchingFactors: { factorName: string; matchDetail: string }[];
  status: "CANDIDATE" | "MERGED" | "SEPARATE";
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
}

export interface IntelligenceUserContext {
  userId: string;
  userRole: string;
  organizationId: string;
  clearanceLevel: string;
  permissions: string[];
}

// Domain Errors
export class IntelligenceAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntelligenceAuthorizationError";
  }
}

export class IntelligenceInvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntelligenceInvalidStateTransitionError";
  }
}

export class IntelligenceSeparationOfDutiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntelligenceSeparationOfDutiesError";
  }
}

export class IntelligenceCrossOrgAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntelligenceCrossOrgAccessError";
  }
}
