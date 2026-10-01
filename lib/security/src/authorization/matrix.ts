import type { ClassificationLevel } from "../types";

export interface PermissionDefinition {
  code: string;
  domainGroup: "IDENTITY" | "CASES" | "EVIDENCE" | "DNA" | "LABORATORY" | "GOVERNANCE";
  description: string;
}

export const CANONICAL_PERMISSIONS: readonly PermissionDefinition[] = [
  // IDENTITY & SECURITY
  { code: "user:create", domainGroup: "IDENTITY", description: "Provision new user account under institutional sponsorship" },
  { code: "user:read", domainGroup: "IDENTITY", description: "Read user profiles and institutional personnel rosters" },
  { code: "user:update", domainGroup: "IDENTITY", description: "Update user contact and operational information" },
  { code: "user:status_manage", domainGroup: "IDENTITY", description: "Suspend, lock, unlock, disable, or revoke user accounts" },
  { code: "role:manage", domainGroup: "IDENTITY", description: "Create roles and assign roles to personnel" },
  { code: "permission:manage", domainGroup: "IDENTITY", description: "Configure and update role-permission bindings" },
  { code: "clearance:assign", domainGroup: "IDENTITY", description: "Assign, upgrade, or revoke security clearance levels" },
  { code: "service:manage", domainGroup: "IDENTITY", description: "Provision, rotate, and revoke M2M service identities" },
  { code: "session:revoke", domainGroup: "IDENTITY", description: "Force-terminate active sessions of users or tokens" },

  // CASES & INVESTIGATIONS
  { code: "case:create", domainGroup: "CASES", description: "Register new criminal, incident, or missing person cases" },
  { code: "case:read", domainGroup: "CASES", description: "View details of authorized forensic cases" },
  { code: "case:update", domainGroup: "CASES", description: "Update case details, classification, and investigation notes" },
  { code: "case:status_change", domainGroup: "CASES", description: "Transition case lifecycle states (e.g., Open, Suspended, Closed)" },
  { code: "case:note_add", domainGroup: "CASES", description: "Append confidential journal notes to an active case file" },
  { code: "case:participant_manage", domainGroup: "CASES", description: "Register suspects, victims, witnesses, and reference subjects" },
  { code: "case:assign", domainGroup: "CASES", description: "Assign or reassign personnel and examiners to a case team" },
  { code: "case:transfer", domainGroup: "CASES", description: "Transfer case responsibility across organizational units or agencies" },
  { code: "case:close", domainGroup: "CASES", description: "Formally close an investigation once all forensic criteria are satisfied" },
  { code: "case:reopen", domainGroup: "CASES", description: "Formally reopen a closed case upon new evidence or court order" },
  { code: "case:link", domainGroup: "CASES", description: "Link related cases or record duplicate case candidates" },

  // EVIDENCE & CHAIN OF CUSTODY
  { code: "evidence:create", domainGroup: "EVIDENCE", description: "Log collection and intake of physical evidence exhibits" },
  { code: "evidence:read", domainGroup: "EVIDENCE", description: "View evidence exhibit details, seals, and custody timeline" },
  { code: "evidence:update", domainGroup: "EVIDENCE", description: "Update exhibit description and packaging information" },
  { code: "evidence:transfer", domainGroup: "EVIDENCE", description: "Execute immutable chain-of-custody transfer of custody" },
  { code: "evidence:dispose", domainGroup: "EVIDENCE", description: "Authorize and execute lawful court-ordered disposal of evidence" },
  { code: "vault:manage", domainGroup: "EVIDENCE", description: "Manage storage vaults, temperature zones, and freezer shelves" },

  // FORENSIC DNA INTELLIGENCE
  { code: "dna:submit", domainGroup: "DNA", description: "Submit biological sample DNA profile for national indexing" },
  { code: "dna:read", domainGroup: "DNA", description: "View non-sensitive DNA profile metadata and locus counts" },
  { code: "dna:search", domainGroup: "DNA", description: "Execute search query across national DNA indices" },
  { code: "dna:match_confirm", domainGroup: "DNA", description: "Review and confirm candidate DNA matches" },
  { code: "dna:view_sensitive", domainGroup: "DNA", description: "View raw STR allele peak heights, RFU metrics, and electropherograms" },
  { code: "dna:export", domainGroup: "DNA", description: "Export CODIS or formal DNA profile data packages" },

  // LABORATORY & EXAMINATION
  { code: "lab:submit", domainGroup: "LABORATORY", description: "Submit forensic evidence for analytical laboratory examination" },
  { code: "lab:examine", domainGroup: "LABORATORY", description: "Execute laboratory analysis and update analytical stage" },
  { code: "lab:review", domainGroup: "LABORATORY", description: "Perform peer technical review on laboratory results" },
  { code: "lab:report_create", domainGroup: "LABORATORY", description: "Draft formal forensic laboratory examination report" },
  { code: "lab:report_approve", domainGroup: "LABORATORY", description: "Formally approve and sign off on laboratory examination report" },

  // GOVERNANCE & AUDIT
  { code: "audit:read", domainGroup: "GOVERNANCE", description: "Query and inspect immutable forensic audit logs" },
  { code: "disclosure:create", domainGroup: "GOVERNANCE", description: "Record court-ordered judicial data disclosure" },
  { code: "retention:manage", domainGroup: "GOVERNANCE", description: "Configure statutory retention schedules and review expungements" },
  { code: "legal_hold:manage", domainGroup: "GOVERNANCE", description: "Apply and lift judicial preservation holds on evidence" },
  { code: "break_glass:activate", domainGroup: "GOVERNANCE", description: "Trigger emergency break-glass temporary privilege elevation" },
] as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SYSTEM_ADMINISTRATOR: [
    "user:read",
    "service:manage",
    "session:revoke",
    "vault:manage",
  ],
  SECURITY_ADMINISTRATOR: [
    "user:create",
    "user:read",
    "user:update",
    "user:status_manage",
    "role:manage",
    "permission:manage",
    "clearance:assign",
    "service:manage",
    "session:revoke",
    "audit:read",
  ],
  INVESTIGATOR: [
    "case:create",
    "case:read",
    "case:update",
    "case:note_add",
    "case:participant_manage",
    "case:assign",
    "case:link",
    "evidence:create",
    "evidence:read",
    "evidence:transfer",
    "lab:submit",
    "dna:read",
  ],
  FORENSIC_EXAMINER: [
    "case:read",
    "case:note_add",
    "evidence:create",
    "evidence:read",
    "evidence:update",
    "evidence:transfer",
    "lab:submit",
  ],
  LAB_ANALYST: [
    "case:read",
    "evidence:read",
    "lab:examine",
    "lab:report_create",
    "dna:submit",
    "dna:read",
    "dna:search",
    "dna:view_sensitive",
  ],
  LAB_REVIEWER: [
    "case:read",
    "evidence:read",
    "lab:review",
    "lab:report_approve",
    "dna:read",
    "dna:match_confirm",
    "dna:view_sensitive",
  ],
  CASE_MANAGER: [
    "case:create",
    "case:read",
    "case:update",
    "case:status_change",
    "case:participant_manage",
    "case:assign",
    "case:transfer",
    "case:close",
    "case:reopen",
    "case:link",
    "case:note_add",
    "evidence:read",
    "disclosure:create",
    "legal_hold:manage",
  ],
  EVIDENCE_CUSTODIAN: [
    "evidence:create",
    "evidence:read",
    "evidence:update",
    "evidence:transfer",
    "evidence:dispose",
    "vault:manage",
  ],
  DNA_SPECIALIST: [
    "dna:submit",
    "dna:read",
    "dna:search",
    "dna:match_confirm",
    "dna:view_sensitive",
    "dna:export",
  ],
  GOVERNANCE_OFFICER: [
    "disclosure:create",
    "retention:manage",
    "legal_hold:manage",
    "audit:read",
  ],
  AUDITOR: [
    "audit:read",
    "case:read",
    "evidence:read",
    "dna:read",
  ],
  INSTITUTIONAL_OFFICER: [
    "case:read",
    "evidence:read",
  ],
};

export interface ActionPolicy {
  action: string;
  requiredPermission: string;
  minimumClearance: ClassificationLevel;
  requiresPurpose: boolean;
  allowCrossOrg: boolean;
}

export const ACTION_POLICIES: Record<string, ActionPolicy> = {
  // Case operations
  "case:create": { action: "case:create", requiredPermission: "case:create", minimumClearance: "RESTRICTED", requiresPurpose: false, allowCrossOrg: false },
  "case:read": { action: "case:read", requiredPermission: "case:read", minimumClearance: "INTERNAL", requiresPurpose: false, allowCrossOrg: false },
  "case:update": { action: "case:update", requiredPermission: "case:update", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "case:status_change": { action: "case:status_change", requiredPermission: "case:status_change", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "case:note_add": { action: "case:note_add", requiredPermission: "case:note_add", minimumClearance: "RESTRICTED", requiresPurpose: false, allowCrossOrg: false },
  "case:participant_manage": { action: "case:participant_manage", requiredPermission: "case:participant_manage", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "case:assign": { action: "case:assign", requiredPermission: "case:assign", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "case:transfer": { action: "case:transfer", requiredPermission: "case:transfer", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: true },
  "case:close": { action: "case:close", requiredPermission: "case:close", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "case:reopen": { action: "case:reopen", requiredPermission: "case:reopen", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "case:link": { action: "case:link", requiredPermission: "case:link", minimumClearance: "RESTRICTED", requiresPurpose: false, allowCrossOrg: true },

  // Evidence operations
  "evidence:create": { action: "evidence:create", requiredPermission: "evidence:create", minimumClearance: "RESTRICTED", requiresPurpose: false, allowCrossOrg: false },
  "evidence:read": { action: "evidence:read", requiredPermission: "evidence:read", minimumClearance: "INTERNAL", requiresPurpose: false, allowCrossOrg: false },
  "evidence:update": { action: "evidence:update", requiredPermission: "evidence:update", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "evidence:seal": { action: "evidence:seal", requiredPermission: "evidence:update", minimumClearance: "RESTRICTED", requiresPurpose: false, allowCrossOrg: false },
  "evidence:seal_break": { action: "evidence:seal_break", requiredPermission: "evidence:update", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "evidence:transfer": { action: "evidence:transfer", requiredPermission: "evidence:transfer", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: true },
  "evidence:receive": { action: "evidence:receive", requiredPermission: "evidence:transfer", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: true },
  "evidence:retrieve": { action: "evidence:retrieve", requiredPermission: "evidence:read", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "evidence:return": { action: "evidence:return", requiredPermission: "evidence:update", minimumClearance: "RESTRICTED", requiresPurpose: false, allowCrossOrg: false },
  "evidence:examine": { action: "evidence:examine", requiredPermission: "evidence:update", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "evidence:derivative_create": { action: "evidence:derivative_create", requiredPermission: "evidence:create", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "evidence:verify_integrity": { action: "evidence:verify_integrity", requiredPermission: "evidence:read", minimumClearance: "INTERNAL", requiresPurpose: false, allowCrossOrg: false },
  "evidence:dispose": { action: "evidence:dispose", requiredPermission: "evidence:dispose", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "evidence:legal_hold": { action: "evidence:legal_hold", requiredPermission: "legal_hold:manage", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "vault:manage": { action: "vault:manage", requiredPermission: "vault:manage", minimumClearance: "CONFIDENTIAL", requiresPurpose: false, allowCrossOrg: false },

  // DNA operations
  "dna:submit": { action: "dna:submit", requiredPermission: "dna:submit", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: true },
  "dna:read": { action: "dna:read", requiredPermission: "dna:read", minimumClearance: "CONFIDENTIAL", requiresPurpose: false, allowCrossOrg: false },
  "dna:search": { action: "dna:search", requiredPermission: "dna:search", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: true },
  "dna:match_confirm": { action: "dna:match_confirm", requiredPermission: "dna:match_confirm", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: true },
  "dna:view_sensitive": { action: "dna:view_sensitive", requiredPermission: "dna:view_sensitive", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "dna:export": { action: "dna:export", requiredPermission: "dna:export", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: false },

  // Laboratory operations
  "lab:submit": { action: "lab:submit", requiredPermission: "lab:submit", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: true },
  "lab:examine": { action: "lab:examine", requiredPermission: "lab:examine", minimumClearance: "RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "lab:review": { action: "lab:review", requiredPermission: "lab:review", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "lab:report_create": { action: "lab:report_create", requiredPermission: "lab:report_create", minimumClearance: "RESTRICTED", requiresPurpose: false, allowCrossOrg: false },
  "lab:report_approve": { action: "lab:report_approve", requiredPermission: "lab:report_approve", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },

  // Governance & Security operations
  "audit:read": { action: "audit:read", requiredPermission: "audit:read", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: true },
  "user:create": { action: "user:create", requiredPermission: "user:create", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "user:read": { action: "user:read", requiredPermission: "user:read", minimumClearance: "INTERNAL", requiresPurpose: false, allowCrossOrg: false },
  "user:update": { action: "user:update", requiredPermission: "user:update", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "user:status_manage": { action: "user:status_manage", requiredPermission: "user:status_manage", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "clearance:assign": { action: "clearance:assign", requiredPermission: "clearance:assign", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "role:manage": { action: "role:manage", requiredPermission: "role:manage", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "permission:manage": { action: "permission:manage", requiredPermission: "permission:manage", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "service:manage": { action: "service:manage", requiredPermission: "service:manage", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: false },
  "session:revoke": { action: "session:revoke", requiredPermission: "session:revoke", minimumClearance: "CONFIDENTIAL", requiresPurpose: false, allowCrossOrg: false },
  "disclosure:create": { action: "disclosure:create", requiredPermission: "disclosure:create", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: true },
  "retention:manage": { action: "retention:manage", requiredPermission: "retention:manage", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "legal_hold:manage": { action: "legal_hold:manage", requiredPermission: "legal_hold:manage", minimumClearance: "CONFIDENTIAL", requiresPurpose: true, allowCrossOrg: false },
  "break_glass:activate": { action: "break_glass:activate", requiredPermission: "break_glass:activate", minimumClearance: "HIGHLY_RESTRICTED", requiresPurpose: true, allowCrossOrg: true },
};
