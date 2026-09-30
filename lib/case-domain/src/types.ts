import type { ClassificationLevel } from "@workspace/security";

export type CaseStatus =
  | "DRAFT"
  | "OPEN"
  | "ACTIVE"
  | "SUSPENDED"
  | "CLOSED"
  | "ARCHIVED"
  | "REOPENED";

export type CaseType =
  | "CRIMINAL_INVESTIGATION"
  | "UNIDENTIFIED_REMAINS"
  | "MISSING_PERSONS"
  | "DISASTER_VICTIM_IDENTIFICATION"
  | "FORENSIC_INTELLIGENCE"
  | "IDENTITY_RESOLUTION"
  | "LABORATORY_EXAMINATION";

export type CasePriority = "ROUTINE" | "PRIORITY" | "EXPEDITED" | "CRITICAL";

export type CaseRole =
  | "LEAD_INVESTIGATOR"
  | "INVESTIGATOR"
  | "FORENSIC_EXAMINER"
  | "EVIDENCE_CUSTODIAN"
  | "TECHNICAL_REVIEWER"
  | "CASE_MANAGER"
  | "AUDITOR";

export type ParticipantType =
  | "SUSPECT"
  | "VICTIM"
  | "WITNESS"
  | "MISSING_PERSON"
  | "ELIMINATION_SUBJECT"
  | "UNKNOWN_REMAINS";

export type LinkType =
  | "RELATED"
  | "PARENT_CHILD"
  | "DUPLICATE_CANDIDATE"
  | "DERIVED"
  | "LINKED_INVESTIGATION"
  | "SAME_INCIDENT"
  | "MERGED_INTO";

export interface CaseRecord {
  id: string;
  caseNumber: string;
  caseType: CaseType;
  title: string;
  description: string;
  originatingOrgId: string;
  leadInvestigatorId: string;
  status: CaseStatus;
  priority: CasePriority;
  incidentDate: Date;
  incidentCounty: string;
  incidentLocationCoords?: string | null;
  closureReason?: string | null;
  closedAt?: Date | null;
  closedById?: string | null;
  reopenedReason?: string | null;
  reopenedAt?: Date | null;
  reopenedById?: string | null;
  dataClassification: ClassificationLevel;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseParticipantRecord {
  id: string;
  caseId: string;
  participantType: ParticipantType;
  pseudonym?: string | null;
  idDocumentType?: string | null;
  idDocumentHash?: string | null;
  demographics?: Record<string, unknown> | null;
  notes?: string | null;
  dataClassification: ClassificationLevel;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseAssignmentRecord {
  id: string;
  caseId: string;
  userId: string;
  organizationId: string;
  caseRole: CaseRole;
  accessScope: string;
  assignedAt: Date;
  assignedById: string;
  revokedAt?: Date | null;
  revokedById?: string | null;
  revocationReason?: string | null;
  isActive: boolean;
  dataClassification: ClassificationLevel;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseTransferRecord {
  id: string;
  caseId: string;
  fromOrgId: string;
  toOrgId: string;
  fromInvestigatorId: string;
  toInvestigatorId: string;
  transferReason: string;
  authorizationReference?: string | null;
  transferredById: string;
  transferredAt: Date;
  effectiveDate: Date;
  status: string;
  notes?: string | null;
  dataClassification: ClassificationLevel;
  createdAt: Date;
}

export interface CaseLinkRecord {
  id: string;
  sourceCaseId: string;
  targetCaseId: string;
  linkType: LinkType;
  notes?: string | null;
  createdById: string;
  dataClassification: ClassificationLevel;
  createdAt: Date;
}

export interface CaseNoteRecord {
  id: string;
  caseId: string;
  authorId: string;
  noteText: string;
  isConfidential: boolean;
  dataClassification: ClassificationLevel;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseStatusHistoryRecord {
  id: string;
  caseId: string;
  actorId: string;
  previousStatus: CaseStatus;
  newStatus: CaseStatus;
  reason: string;
  dataClassification: ClassificationLevel;
  createdAt: Date;
}

export interface CaseTimelineItem {
  id: string;
  eventType:
    | "CASE_CREATED"
    | "STATUS_CHANGE"
    | "ASSIGNMENT"
    | "ASSIGNMENT_REVOKED"
    | "TRANSFER"
    | "NOTE_ADDED"
    | "PARTICIPANT_ADDED"
    | "PARTICIPANT_REMOVED"
    | "LINKED"
    | "LAB_SUBMISSION"
    | "REPORT_APPROVED";
  timestamp: Date;
  actorId: string;
  summary: string;
  details?: Record<string, unknown>;
  classification: ClassificationLevel;
}

export interface CreateCaseInput {
  caseType?: CaseType;
  title: string;
  description: string;
  originatingOrgId: string;
  leadInvestigatorId: string;
  priority?: CasePriority;
  incidentDate: Date | string;
  incidentCounty: string;
  incidentLocationCoords?: string | null;
  dataClassification?: ClassificationLevel;
}

export interface UpdateCaseInput {
  title?: string;
  description?: string;
  priority?: CasePriority;
  incidentCounty?: string;
  incidentLocationCoords?: string | null;
  dataClassification?: ClassificationLevel;
  expectedVersion: number;
}

export interface TransitionCaseStatusInput {
  newStatus: CaseStatus;
  reason: string;
  expectedVersion: number;
}

export interface AssignCaseInput {
  userId: string;
  organizationId: string;
  caseRole: CaseRole;
  accessScope?: string;
}

export interface TransferCaseInput {
  toOrgId: string;
  toInvestigatorId: string;
  transferReason: string;
  authorizationReference?: string | null;
  notes?: string | null;
  expectedVersion: number;
}

export interface AddParticipantInput {
  participantType: ParticipantType;
  pseudonym?: string | null;
  idDocumentType?: string | null;
  idDocumentNumber?: string | null; // will be hashed
  demographics?: Record<string, unknown> | null;
  notes?: string | null;
  dataClassification?: ClassificationLevel;
}

export interface AddNoteInput {
  noteText: string;
  isConfidential?: boolean;
}

export interface LinkCaseInput {
  targetCaseId: string;
  linkType: LinkType;
  notes?: string | null;
}

export interface CaseSearchFilter {
  query?: string;
  status?: CaseStatus;
  caseType?: CaseType;
  priority?: CasePriority;
  organizationId?: string;
  leadInvestigatorId?: string;
  county?: string;
  dateFrom?: Date | string;
  dateTo?: Date | string;
  classification?: ClassificationLevel;
  limit?: number;
  offset?: number;
}

export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class CaseNotFoundError extends DomainError {
  constructor(caseId: string) {
    super(`Case not found or access denied: ${caseId}`, "CASE_NOT_FOUND");
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(from: CaseStatus, to: CaseStatus, reason?: string) {
    super(
      `Invalid case lifecycle transition from ${from} to ${to}${reason ? `: ${reason}` : ""}`,
      "INVALID_STATE_TRANSITION"
    );
  }
}

export class PreconditionFailedError extends DomainError {
  constructor(message: string) {
    super(message, "PRECONDITION_FAILED");
  }
}

export class ConcurrencyConflictError extends DomainError {
  constructor(expected: number, actual: number) {
    super(
      `Concurrency conflict: expected version ${expected} but case is at version ${actual}`,
      "CONCURRENCY_CONFLICT"
    );
  }
}

export class UnauthorizedCaseActionError extends DomainError {
  constructor(action: string, reason: string) {
    super(`Unauthorized case action '${action}': ${reason}`, "UNAUTHORIZED_CASE_ACTION");
  }
}
