import { relations } from "drizzle-orm";
import {
  organizations,
  clearanceLevels,
  users,
  roles,
  userRoles,
  permissions,
  rolePermissions,
  userSessions,
  mfaFactors,
  serviceIdentities,
  temporaryAccessGrants,
  breakGlassEvents,
  passwordHistories,
} from "./identity";
import {
  cases,
  caseParticipants,
  caseNotes,
  caseStatusHistory,
  caseAssignments,
  caseTransfers,
  caseLinks,
} from "./cases";
import {
  storageLocations,
  evidenceItems,
  custodyTransfers,
  evidenceSeals,
  custodyEvents,
  custodyExceptions,
  evidenceDerivatives,
  evidenceExaminations,
  evidenceDispositions,
  evidenceIntegrityVerifications,
} from "./evidence";
import {
  biologicalSamples,
  dnaIndices,
  dnaProfiles,
  strAlleles,
  dnaMatchingRequests,
  dnaMatchingResults,
} from "./dna";
import {
  labSubmissions,
  examinationRequests,
  labReports,
} from "./laboratory";
import {
  auditEvents,
  dataDisclosures,
  legalHolds,
} from "./audit";

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  cases: many(cases),
  storageLocations: many(storageLocations),
  labSubmissionsAsSubmitting: many(labSubmissions, {
    relationName: "submittingOrg",
  }),
  labSubmissionsAsReceiving: many(labSubmissions, {
    relationName: "receivingLab",
  }),
}));

export const clearanceLevelsRelations = relations(clearanceLevels, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  clearanceLevel: one(clearanceLevels, {
    fields: [users.clearanceLevelId],
    references: [clearanceLevels.id],
  }),
  userRoles: many(userRoles),
  assignedRoles: many(userRoles, { relationName: "assignedBy" }),
  investigatedCases: many(cases),
  collectedEvidence: many(evidenceItems),
  custodialEvidence: many(evidenceItems),
  custodyReleases: many(custodyTransfers, { relationName: "releasingOfficer" }),
  custodyReceipts: many(custodyTransfers, { relationName: "receivingOfficer" }),
  authoredNotes: many(caseNotes),
  dnaProfilesAnalyzed: many(dnaProfiles, { relationName: "dnaAnalyst" }),
  dnaProfilesReviewed: many(dnaProfiles, { relationName: "dnaReviewer" }),
  dnaProfilesApproved: many(dnaProfiles, { relationName: "dnaApprover" }),
  auditEvents: many(auditEvents),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedBy: one(users, {
    fields: [userRoles.assignedById],
    references: [users.id],
    relationName: "assignedBy",
  }),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  originatingOrg: one(organizations, {
    fields: [cases.originatingOrgId],
    references: [organizations.id],
  }),
  leadInvestigator: one(users, {
    fields: [cases.leadInvestigatorId],
    references: [users.id],
    relationName: "leadInvestigator",
  }),
  closedBy: one(users, {
    fields: [cases.closedById],
    references: [users.id],
    relationName: "caseClosedBy",
  }),
  reopenedBy: one(users, {
    fields: [cases.reopenedById],
    references: [users.id],
    relationName: "caseReopenedBy",
  }),
  participants: many(caseParticipants),
  assignments: many(caseAssignments),
  transfers: many(caseTransfers),
  notes: many(caseNotes),
  evidenceItems: many(evidenceItems),
  statusHistory: many(caseStatusHistory),
  labSubmissions: many(labSubmissions),
  dataDisclosures: many(dataDisclosures),
  legalHolds: many(legalHolds),
  outgoingLinks: many(caseLinks, { relationName: "sourceCase" }),
  incomingLinks: many(caseLinks, { relationName: "targetCase" }),
}));

export const caseAssignmentsRelations = relations(caseAssignments, ({ one }) => ({
  case: one(cases, {
    fields: [caseAssignments.caseId],
    references: [cases.id],
  }),
  user: one(users, {
    fields: [caseAssignments.userId],
    references: [users.id],
    relationName: "assignedUser",
  }),
  organization: one(organizations, {
    fields: [caseAssignments.organizationId],
    references: [organizations.id],
  }),
  assignedBy: one(users, {
    fields: [caseAssignments.assignedById],
    references: [users.id],
    relationName: "assigner",
  }),
  revokedBy: one(users, {
    fields: [caseAssignments.revokedById],
    references: [users.id],
    relationName: "revoker",
  }),
}));

export const caseTransfersRelations = relations(caseTransfers, ({ one }) => ({
  case: one(cases, {
    fields: [caseTransfers.caseId],
    references: [cases.id],
  }),
  fromOrg: one(organizations, {
    fields: [caseTransfers.fromOrgId],
    references: [organizations.id],
    relationName: "fromOrg",
  }),
  toOrg: one(organizations, {
    fields: [caseTransfers.toOrgId],
    references: [organizations.id],
    relationName: "toOrg",
  }),
  fromInvestigator: one(users, {
    fields: [caseTransfers.fromInvestigatorId],
    references: [users.id],
    relationName: "fromInvestigator",
  }),
  toInvestigator: one(users, {
    fields: [caseTransfers.toInvestigatorId],
    references: [users.id],
    relationName: "toInvestigator",
  }),
  transferredBy: one(users, {
    fields: [caseTransfers.transferredById],
    references: [users.id],
    relationName: "transferAuthorizer",
  }),
}));

export const caseLinksRelations = relations(caseLinks, ({ one }) => ({
  sourceCase: one(cases, {
    fields: [caseLinks.sourceCaseId],
    references: [cases.id],
    relationName: "sourceCase",
  }),
  targetCase: one(cases, {
    fields: [caseLinks.targetCaseId],
    references: [cases.id],
    relationName: "targetCase",
  }),
  createdBy: one(users, {
    fields: [caseLinks.createdById],
    references: [users.id],
  }),
}));

export const caseParticipantsRelations = relations(caseParticipants, ({ one }) => ({
  case: one(cases, {
    fields: [caseParticipants.caseId],
    references: [cases.id],
  }),
}));

export const caseNotesRelations = relations(caseNotes, ({ one }) => ({
  case: one(cases, {
    fields: [caseNotes.caseId],
    references: [cases.id],
  }),
  author: one(users, {
    fields: [caseNotes.authorId],
    references: [users.id],
  }),
}));

export const caseStatusHistoryRelations = relations(caseStatusHistory, ({ one }) => ({
  case: one(cases, {
    fields: [caseStatusHistory.caseId],
    references: [cases.id],
  }),
  actor: one(users, {
    fields: [caseStatusHistory.actorId],
    references: [users.id],
  }),
}));

export const storageLocationsRelations = relations(storageLocations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [storageLocations.organizationId],
    references: [organizations.id],
  }),
  storedEvidence: many(evidenceItems),
}));

export const evidenceItemsRelations = relations(evidenceItems, ({ one, many }) => ({
  case: one(cases, {
    fields: [evidenceItems.caseId],
    references: [cases.id],
  }),
  collectedBy: one(users, {
    fields: [evidenceItems.collectedById],
    references: [users.id],
  }),
  currentLocation: one(storageLocations, {
    fields: [evidenceItems.currentLocationId],
    references: [storageLocations.id],
  }),
  currentCustodian: one(users, {
    fields: [evidenceItems.currentCustodianId],
    references: [users.id],
  }),
  parentItem: one(evidenceItems, {
    fields: [evidenceItems.parentItemId],
    references: [evidenceItems.id],
    relationName: "parentItem",
  }),
  childItems: many(evidenceItems, { relationName: "parentItem" }),
  custodyTransfers: many(custodyTransfers),
  custodyEvents: many(custodyEvents),
  seals: many(evidenceSeals),
  exceptions: many(custodyExceptions),
  derivatives: many(evidenceDerivatives, { relationName: "parentDerivative" }),
  derivedFrom: many(evidenceDerivatives, { relationName: "childDerivative" }),
  examinations: many(evidenceExaminations),
  dispositions: many(evidenceDispositions),
  verifications: many(evidenceIntegrityVerifications),
  biologicalSamples: many(biologicalSamples),
  examinationRequests: many(examinationRequests),
}));

export const evidenceSealsRelations = relations(evidenceSeals, ({ one }) => ({
  evidenceItem: one(evidenceItems, {
    fields: [evidenceSeals.evidenceId],
    references: [evidenceItems.id],
  }),
  appliedBy: one(users, {
    fields: [evidenceSeals.appliedById],
    references: [users.id],
  }),
  brokenBy: one(users, {
    fields: [evidenceSeals.brokenById],
    references: [users.id],
  }),
}));

export const custodyEventsRelations = relations(custodyEvents, ({ one }) => ({
  evidenceItem: one(evidenceItems, {
    fields: [custodyEvents.evidenceId],
    references: [evidenceItems.id],
  }),
  actor: one(users, {
    fields: [custodyEvents.actorId],
    references: [users.id],
  }),
}));

export const custodyExceptionsRelations = relations(custodyExceptions, ({ one }) => ({
  evidenceItem: one(evidenceItems, {
    fields: [custodyExceptions.evidenceId],
    references: [evidenceItems.id],
  }),
  reportedBy: one(users, {
    fields: [custodyExceptions.reportedById],
    references: [users.id],
  }),
  resolvedBy: one(users, {
    fields: [custodyExceptions.resolvedById],
    references: [users.id],
  }),
}));

export const evidenceDerivativesRelations = relations(evidenceDerivatives, ({ one }) => ({
  parentEvidence: one(evidenceItems, {
    fields: [evidenceDerivatives.parentEvidenceId],
    references: [evidenceItems.id],
    relationName: "parentDerivative",
  }),
  derivedEvidence: one(evidenceItems, {
    fields: [evidenceDerivatives.derivedEvidenceId],
    references: [evidenceItems.id],
    relationName: "childDerivative",
  }),
  createdBy: one(users, {
    fields: [evidenceDerivatives.createdById],
    references: [users.id],
  }),
}));

export const evidenceExaminationsRelations = relations(evidenceExaminations, ({ one }) => ({
  evidenceItem: one(evidenceItems, {
    fields: [evidenceExaminations.evidenceId],
    references: [evidenceItems.id],
  }),
  examiner: one(users, {
    fields: [evidenceExaminations.examinerId],
    references: [users.id],
  }),
}));

export const evidenceDispositionsRelations = relations(evidenceDispositions, ({ one }) => ({
  evidenceItem: one(evidenceItems, {
    fields: [evidenceDispositions.evidenceId],
    references: [evidenceItems.id],
  }),
  approvedBy: one(users, {
    fields: [evidenceDispositions.approvedById],
    references: [users.id],
  }),
  executedBy: one(users, {
    fields: [evidenceDispositions.executedById],
    references: [users.id],
  }),
  witnessBy: one(users, {
    fields: [evidenceDispositions.witnessById],
    references: [users.id],
  }),
}));

export const evidenceIntegrityVerificationsRelations = relations(evidenceIntegrityVerifications, ({ one }) => ({
  evidenceItem: one(evidenceItems, {
    fields: [evidenceIntegrityVerifications.evidenceId],
    references: [evidenceItems.id],
  }),
  verifiedBy: one(users, {
    fields: [evidenceIntegrityVerifications.verifiedById],
    references: [users.id],
  }),
}));

export const custodyTransfersRelations = relations(custodyTransfers, ({ one }) => ({
  evidenceItem: one(evidenceItems, {
    fields: [custodyTransfers.evidenceId],
    references: [evidenceItems.id],
  }),
  releasingOfficer: one(users, {
    fields: [custodyTransfers.releasingOfficerId],
    references: [users.id],
    relationName: "releasingOfficer",
  }),
  receivingOfficer: one(users, {
    fields: [custodyTransfers.receivingOfficerId],
    references: [users.id],
    relationName: "receivingOfficer",
  }),
  sourceLocation: one(storageLocations, {
    fields: [custodyTransfers.sourceLocationId],
    references: [storageLocations.id],
  }),
  destinationLocation: one(storageLocations, {
    fields: [custodyTransfers.destinationLocationId],
    references: [storageLocations.id],
  }),
}));

export const biologicalSamplesRelations = relations(biologicalSamples, ({ one, many }) => ({
  evidenceItem: one(evidenceItems, {
    fields: [biologicalSamples.evidenceId],
    references: [evidenceItems.id],
  }),
  case: one(cases, {
    fields: [biologicalSamples.caseId],
    references: [cases.id],
  }),
  collectedBy: one(users, {
    fields: [biologicalSamples.collectedById],
    references: [users.id],
  }),
  dnaProfiles: many(dnaProfiles),
}));

export const dnaIndicesRelations = relations(dnaIndices, ({ many }) => ({
  profiles: many(dnaProfiles),
}));

export const dnaProfilesRelations = relations(dnaProfiles, ({ one, many }) => ({
  sample: one(biologicalSamples, {
    fields: [dnaProfiles.sampleId],
    references: [biologicalSamples.id],
  }),
  index: one(dnaIndices, {
    fields: [dnaProfiles.indexId],
    references: [dnaIndices.id],
  }),
  analyst: one(users, {
    fields: [dnaProfiles.analystId],
    references: [users.id],
    relationName: "dnaAnalyst",
  }),
  reviewer: one(users, {
    fields: [dnaProfiles.reviewedById],
    references: [users.id],
    relationName: "dnaReviewer",
  }),
  approver: one(users, {
    fields: [dnaProfiles.approvedById],
    references: [users.id],
    relationName: "dnaApprover",
  }),
  strAlleles: many(strAlleles),
  matchingRequestsAsTarget: many(dnaMatchingRequests),
  matchingResultsAsCandidate: many(dnaMatchingResults),
}));

export const strAllelesRelations = relations(strAlleles, ({ one }) => ({
  dnaProfile: one(dnaProfiles, {
    fields: [strAlleles.dnaProfileId],
    references: [dnaProfiles.id],
  }),
}));

export const dnaMatchingRequestsRelations = relations(dnaMatchingRequests, ({ one, many }) => ({
  targetProfile: one(dnaProfiles, {
    fields: [dnaMatchingRequests.targetProfileId],
    references: [dnaProfiles.id],
  }),
  requestedBy: one(users, {
    fields: [dnaMatchingRequests.requestedById],
    references: [users.id],
  }),
  results: many(dnaMatchingResults),
}));

export const dnaMatchingResultsRelations = relations(dnaMatchingResults, ({ one }) => ({
  request: one(dnaMatchingRequests, {
    fields: [dnaMatchingResults.requestId],
    references: [dnaMatchingRequests.id],
  }),
  candidateProfile: one(dnaProfiles, {
    fields: [dnaMatchingResults.candidateProfileId],
    references: [dnaProfiles.id],
  }),
  reviewedBy: one(users, {
    fields: [dnaMatchingResults.reviewedById],
    references: [users.id],
  }),
}));

export const labSubmissionsRelations = relations(labSubmissions, ({ one, many }) => ({
  case: one(cases, {
    fields: [labSubmissions.caseId],
    references: [cases.id],
  }),
  submittingOrg: one(organizations, {
    fields: [labSubmissions.submittingOrgId],
    references: [organizations.id],
    relationName: "submittingOrg",
  }),
  receivingLab: one(organizations, {
    fields: [labSubmissions.receivingLabId],
    references: [organizations.id],
    relationName: "receivingLab",
  }),
  authorizedBy: one(users, {
    fields: [labSubmissions.authorizedById],
    references: [users.id],
  }),
  examinationRequests: many(examinationRequests),
}));

export const examinationRequestsRelations = relations(examinationRequests, ({ one }) => ({
  submission: one(labSubmissions, {
    fields: [examinationRequests.submissionId],
    references: [labSubmissions.id],
  }),
  evidenceItem: one(evidenceItems, {
    fields: [examinationRequests.evidenceId],
    references: [evidenceItems.id],
  }),
  assignedAnalyst: one(users, {
    fields: [examinationRequests.assignedAnalystId],
    references: [users.id],
  }),
  report: one(labReports),
}));

export const labReportsRelations = relations(labReports, ({ one }) => ({
  examinationRequest: one(examinationRequests, {
    fields: [labReports.examinationRequestId],
    references: [examinationRequests.id],
  }),
  reportingAnalyst: one(users, {
    fields: [labReports.reportingAnalystId],
    references: [users.id],
  }),
  technicalReviewer: one(users, {
    fields: [labReports.technicalReviewerId],
    references: [users.id],
  }),
  approvingDirector: one(users, {
    fields: [labReports.approvingDirectorId],
    references: [users.id],
  }),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  actor: one(users, {
    fields: [auditEvents.actorId],
    references: [users.id],
  }),
}));

export const dataDisclosuresRelations = relations(dataDisclosures, ({ one }) => ({
  case: one(cases, {
    fields: [dataDisclosures.caseId],
    references: [cases.id],
  }),
  authorizedBy: one(users, {
    fields: [dataDisclosures.authorizedById],
    references: [users.id],
  }),
}));

export const legalHoldsRelations = relations(legalHolds, ({ one }) => ({
  case: one(cases, {
    fields: [legalHolds.caseId],
    references: [cases.id],
  }),
  authorizedBy: one(users, {
    fields: [legalHolds.authorizedById],
    references: [users.id],
  }),
  liftedBy: one(users, {
    fields: [legalHolds.liftedById],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const mfaFactorsRelations = relations(mfaFactors, ({ one }) => ({
  user: one(users, {
    fields: [mfaFactors.userId],
    references: [users.id],
  }),
}));

export const serviceIdentitiesRelations = relations(serviceIdentities, ({ one }) => ({
  organization: one(organizations, {
    fields: [serviceIdentities.organizationId],
    references: [organizations.id],
  }),
  clearanceLevel: one(clearanceLevels, {
    fields: [serviceIdentities.clearanceLevelId],
    references: [clearanceLevels.id],
  }),
  createdBy: one(users, {
    fields: [serviceIdentities.createdById],
    references: [users.id],
  }),
}));

export const temporaryAccessGrantsRelations = relations(temporaryAccessGrants, ({ one }) => ({
  user: one(users, {
    fields: [temporaryAccessGrants.userId],
    references: [users.id],
  }),
  grantedBy: one(users, {
    fields: [temporaryAccessGrants.grantedById],
    references: [users.id],
  }),
}));

export const breakGlassEventsRelations = relations(breakGlassEvents, ({ one }) => ({
  user: one(users, {
    fields: [breakGlassEvents.userId],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [breakGlassEvents.reviewedById],
    references: [users.id],
  }),
}));

export const passwordHistoriesRelations = relations(passwordHistories, ({ one }) => ({
  user: one(users, {
    fields: [passwordHistories.userId],
    references: [users.id],
  }),
}));

