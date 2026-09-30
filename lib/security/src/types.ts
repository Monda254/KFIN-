export type ClassificationLevel =
  | "PUBLIC"
  | "INTERNAL"
  | "RESTRICTED"
  | "CONFIDENTIAL"
  | "HIGHLY_RESTRICTED";

export type AccountStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "LOCKED"
  | "DISABLED"
  | "REVOKED";

export type AccessPurpose =
  | "CASE_INVESTIGATION"
  | "FORENSIC_EXAMINATION"
  | "IDENTITY_RESOLUTION"
  | "MISSING_PERSON_INVESTIGATION"
  | "AUTHORIZED_RESEARCH"
  | "QUALITY_ASSURANCE"
  | "LEGAL_PROCESS"
  | "SYSTEM_ADMINISTRATION";

export const CLASSIFICATION_TIERS: Record<ClassificationLevel, number> = {
  PUBLIC: 1,
  INTERNAL: 2,
  RESTRICTED: 3,
  CONFIDENTIAL: 4,
  HIGHLY_RESTRICTED: 5,
};

export const VALID_PURPOSES: readonly AccessPurpose[] = [
  "CASE_INVESTIGATION",
  "FORENSIC_EXAMINATION",
  "IDENTITY_RESOLUTION",
  "MISSING_PERSON_INVESTIGATION",
  "AUTHORIZED_RESEARCH",
  "QUALITY_ASSURANCE",
  "LEGAL_PROCESS",
  "SYSTEM_ADMINISTRATION",
] as const;

export interface Subject {
  userId: string;
  email: string;
  badgeNumber: string;
  fullName: string;
  organizationId: string;
  organizationCode: string;
  clearanceLevel: number;
  clearanceCode: ClassificationLevel;
  accountStatus: AccountStatus;
  roles: string[];
  permissions: string[];
  isServiceIdentity?: boolean;
  serviceName?: string;
  breakGlassActive?: boolean;
  breakGlassRef?: string;
}

export interface Resource {
  type:
    | "case"
    | "evidence"
    | "dna_profile"
    | "lab_submission"
    | "examination_request"
    | "lab_report"
    | "audit_event"
    | "user"
    | "role"
    | "clearance"
    | "service_identity"
    | "system";
  id: string;
  classification: ClassificationLevel;
  ownerOrgId?: string;
  caseId?: string;
  creatorId?: string;
  assignedUserIds?: string[];
  isJointJurisdiction?: boolean;
}

export interface AccessContext {
  action: string;
  purpose?: AccessPurpose | string;
  ipAddress: string;
  correlationId: string;
  justification?: string;
  timestamp?: Date;
}

export interface AuthorizationDecision {
  decision: "ALLOW" | "DENY";
  reasonCode: string;
  explanation: string;
  evaluatedAt: string;
  policyVersion: string;
  auditPayload: {
    action: string;
    outcome: "SUCCESS" | "DENIED";
    entityType: string;
    entityId: string;
    actorId?: string;
    reason: string;
    metadata: Record<string, unknown>;
  };
}

export interface AccessTokenClaims {
  sub: string;
  email: string;
  badge: string;
  name: string;
  orgId: string;
  orgCode: string;
  clearanceLevel: number;
  clearanceCode: ClassificationLevel;
  roles: string[];
  permissions: string[];
  mfaAuthenticated: boolean;
  isService?: boolean;
  iss: string;
  aud: string;
  jti: string;
  iat: number;
  exp: number;
}

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

export interface MfaVerificationResult {
  valid: boolean;
  step?: number;
  isBackupCode?: boolean;
  error?: string;
}

export interface FederatedIdentityClaims {
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  email: string;
  name: string;
  institutionalId: string;
  externalOrgCode: string;
  assertedRole?: string;
  assertedClearance?: string;
}
