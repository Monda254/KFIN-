import { pgEnum } from "drizzle-orm/pg-core";

export const classificationLevelEnum = pgEnum("classification_level", [
  "PUBLIC",
  "INTERNAL",
  "RESTRICTED",
  "CONFIDENTIAL",
  "HIGHLY_RESTRICTED",
]);

export const organizationTypeEnum = pgEnum("organization_type", [
  "LAW_ENFORCEMENT",
  "FORENSIC_LAB",
  "JUDICIARY",
  "HEALTH_AGENCY",
  "CORRECTIONAL_SERVICE",
]);

export const accountStatusEnum = pgEnum("account_status", [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "LOCKED",
  "DISABLED",
  "REVOKED",
]);

export const caseStatusEnum = pgEnum("case_status", [
  "DRAFT",
  "OPEN",
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
  "ARCHIVED",
  "REOPENED",
]);

export const caseTypeEnum = pgEnum("case_type", [
  "CRIMINAL_INVESTIGATION",
  "UNIDENTIFIED_REMAINS",
  "MISSING_PERSONS",
  "DISASTER_VICTIM_IDENTIFICATION",
  "FORENSIC_INTELLIGENCE",
  "IDENTITY_RESOLUTION",
  "LABORATORY_EXAMINATION",
]);

export const caseRoleEnum = pgEnum("case_role", [
  "LEAD_INVESTIGATOR",
  "INVESTIGATOR",
  "FORENSIC_EXAMINER",
  "EVIDENCE_CUSTODIAN",
  "TECHNICAL_REVIEWER",
  "CASE_MANAGER",
  "AUDITOR",
]);

export const participantTypeEnum = pgEnum("participant_type", [
  "SUSPECT",
  "VICTIM",
  "WITNESS",
  "MISSING_PERSON",
  "ELIMINATION_SUBJECT",
  "UNKNOWN_REMAINS",
]);

export const evidenceTypeEnum = pgEnum("evidence_type", [
  "BIOLOGICAL_SPECIMEN",
  "TOUCH_DNA_SWAB",
  "WEAPON",
  "CLOTHING",
  "DIGITAL_MEDIA",
  "DOCUMENT",
  "TRACE_EVIDENCE",
]);

export const evidenceStatusEnum = pgEnum("evidence_status", [
  "COLLECTED",
  "SUBMITTED",
  "IN_VAULT",
  "CHECKED_OUT_LAB",
  "IN_COURT",
  "DISPOSED",
  "RETURNED",
]);

export const transferReasonEnum = pgEnum("transfer_reason", [
  "LAB_ANALYSIS",
  "COURT_PROCEEDING",
  "VAULT_STORAGE",
  "TEMPORARY_RELEASE",
  "DISPOSAL",
  "RETURN_TO_OWNER",
]);

export const sampleTypeEnum = pgEnum("sample_type", [
  "WHOLE_BLOOD",
  "BUCCAL_SWAB",
  "BONE_FRAGMENT",
  "SEMEN_STAIN",
  "HAIR_ROOT",
  "TISSUE_BIOPSY",
  "SALIVA_TRACE",
]);

export const profileQualityEnum = pgEnum("profile_quality", [
  "COMPLETE",
  "PARTIAL_HIGH",
  "PARTIAL_LOW",
  "MIXTURE",
]);

export const profileStatusEnum = pgEnum("profile_status", [
  "ACTIVE",
  "FLAGGED_EXPUNGEMENT",
  "ARCHIVED",
  "RESTRICTED",
]);

export const submissionUrgencyEnum = pgEnum("submission_urgency", [
  "ROUTINE",
  "PRIORITY",
  "EXPEDITED",
  "CRITICAL",
]);

export const submissionStatusEnum = pgEnum("submission_status", [
  "SUBMITTED",
  "ACCEPTED",
  "REJECTED",
  "IN_PROGRESS",
  "COMPLETED",
]);

export const examinationStageEnum = pgEnum("examination_stage", [
  "PENDING_ASSIGNMENT",
  "EXTRACTION",
  "QUANTIFICATION",
  "AMPLIFICATION",
  "ELECTROPHORESIS",
  "TECHNICAL_REVIEW",
  "ADMIN_REVIEW",
  "APPROVED",
]);

export const auditActionEnum = pgEnum("audit_action", [
  "AUTH_LOGIN",
  "AUTH_LOGOUT",
  "AUTH_FAILED",
  "CASE_CREATE",
  "CASE_VIEW",
  "CASE_UPDATE",
  "EVIDENCE_TRANSFER",
  "DNA_INDEX_SEARCH",
  "DNA_MATCH_CONFIRM",
  "REPORT_APPROVE",
  "PERMISSION_CHANGE",
  "LEGAL_HOLD_APPLIED",
  "MFA_VERIFY",
  "MFA_FAILED",
  "ACCOUNT_LOCK",
  "ACCOUNT_UNLOCK",
  "ROLE_ASSIGN",
  "ROLE_REVOKE",
  "CLEARANCE_ASSIGN",
  "CLEARANCE_REVOKE",
  "SESSION_REVOKE",
  "BREAK_GLASS_ACTIVATE",
  "ACCESS_DENIED",
  "SERVICE_AUTH",
  "CASE_CLOSE",
  "CASE_REOPEN",
  "CASE_ASSIGN",
  "CASE_TRANSFER",
  "CASE_LINK",
  "CASE_PARTICIPANT_ADD",
  "CASE_PARTICIPANT_REMOVE",
  "CASE_NOTE_ADD",
]);

export const auditOutcomeEnum = pgEnum("audit_outcome", [
  "SUCCESS",
  "DENIED",
  "FAILURE",
]);

export const matchingRequestStatusEnum = pgEnum("matching_request_status", [
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const candidateMatchStatusEnum = pgEnum("candidate_match_status", [
  "CANDIDATE",
  "POTENTIAL_MATCH",
  "TECHNICAL_MATCH",
  "REVIEW_REQUIRED",
  "CONFIRMED_MATCH",
  "EXCLUDED",
  "INCONCLUSIVE",
]);
