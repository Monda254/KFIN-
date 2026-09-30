import { relations } from "drizzle-orm";
import {
  organizations,
  clearanceLevels,
  users,
  roles,
  userRoles,
  permissions,
  rolePermissions,
} from "./identity";
import { cases, caseParticipants, caseNotes, caseStatusHistory } from "./cases";
import { storageLocations, evidenceItems, custodyTransfers } from "./evidence";
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
  }),
  participants: many(caseParticipants),
  notes: many(caseNotes),
  evidenceItems: many(evidenceItems),
  statusHistory: many(caseStatusHistory),
  labSubmissions: many(labSubmissions),
  dataDisclosures: many(dataDisclosures),
  legalHolds: many(legalHolds),
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
  custodyTransfers: many(custodyTransfers),
  biologicalSamples: many(biologicalSamples),
  examinationRequests: many(examinationRequests),
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
