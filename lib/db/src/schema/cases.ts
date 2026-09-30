import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { commonColumns, immutableColumns } from "./common";
import {
  caseStatusEnum,
  caseTypeEnum,
  caseRoleEnum,
  participantTypeEnum,
  submissionUrgencyEnum,
} from "./enums";
import { organizations, users } from "./identity";

export const cases = pgTable(
  "cases",
  {
    ...commonColumns,
    caseNumber: varchar("case_number", { length: 64 }).unique().notNull(),
    caseType: caseTypeEnum("case_type").default("CRIMINAL_INVESTIGATION").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    originatingOrgId: uuid("originating_org_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    leadInvestigatorId: uuid("lead_investigator_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    status: caseStatusEnum("status").default("OPEN").notNull(),
    priority: submissionUrgencyEnum("priority").default("ROUTINE").notNull(),
    incidentDate: timestamp("incident_date", { withTimezone: true }).notNull(),
    incidentCounty: varchar("incident_county", { length: 64 }).notNull(),
    incidentLocationCoords: varchar("incident_location_coords", { length: 128 }),
    closureReason: text("closure_reason"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedById: uuid("closed_by_id").references(() => users.id, { onDelete: "restrict" }),
    reopenedReason: text("reopened_reason"),
    reopenedAt: timestamp("reopened_at", { withTimezone: true }),
    reopenedById: uuid("reopened_by_id").references(() => users.id, { onDelete: "restrict" }),
  },
  (table) => [
    index("case_number_idx").on(table.caseNumber),
    index("cases_case_type_idx").on(table.caseType),
    index("case_status_idx").on(table.status),
    index("case_org_idx").on(table.originatingOrgId),
    index("case_investigator_idx").on(table.leadInvestigatorId),
    index("case_incident_date_idx").on(table.incidentDate),
  ]
);

export const caseParticipants = pgTable(
  "case_participants",
  {
    ...commonColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    participantType: participantTypeEnum("participant_type").notNull(),
    pseudonym: varchar("pseudonym", { length: 128 }),
    idDocumentType: varchar("id_document_type", { length: 32 }),
    idDocumentHash: varchar("id_document_hash", { length: 64 }),
    demographics: jsonb("demographics"),
    notes: text("notes"),
  },
  (table) => [
    index("case_participant_case_idx").on(table.caseId),
    index("case_participant_type_idx").on(table.participantType),
  ]
);

export const caseNotes = pgTable(
  "case_notes",
  {
    ...commonColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    authorId: uuid("author_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    noteText: text("note_text").notNull(),
    isConfidential: boolean("is_confidential").default(false).notNull(),
  },
  (table) => [
    index("case_notes_case_idx").on(table.caseId),
    index("case_notes_author_idx").on(table.authorId),
    index("case_notes_created_idx").on(table.createdAt),
  ]
);

export const caseStatusHistory = pgTable(
  "case_status_history",
  {
    ...immutableColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    actorId: uuid("actor_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    previousStatus: caseStatusEnum("previous_status").notNull(),
    newStatus: caseStatusEnum("new_status").notNull(),
    reason: text("reason").notNull(),
  },
  (table) => [
    index("case_status_hist_case_idx").on(table.caseId),
    index("case_status_hist_actor_idx").on(table.actorId),
    index("case_status_hist_time_idx").on(table.createdAt),
  ]
);

export const caseAssignments = pgTable(
  "case_assignments",
  {
    ...commonColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    caseRole: caseRoleEnum("case_role").notNull(),
    accessScope: varchar("access_scope", { length: 32 }).default("FULL").notNull(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    assignedById: uuid("assigned_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokedById: uuid("revoked_by_id").references(() => users.id, { onDelete: "restrict" }),
    revocationReason: text("revocation_reason"),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("case_assignments_case_idx").on(table.caseId),
    index("case_assignments_user_idx").on(table.userId),
    index("case_assignments_org_idx").on(table.organizationId),
    index("case_assignments_active_idx").on(table.isActive),
  ]
);

export const caseTransfers = pgTable(
  "case_transfers",
  {
    ...immutableColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    fromOrgId: uuid("from_org_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    toOrgId: uuid("to_org_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    fromInvestigatorId: uuid("from_investigator_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    toInvestigatorId: uuid("to_investigator_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    transferReason: text("transfer_reason").notNull(),
    authorizationReference: varchar("authorization_reference", { length: 255 }),
    transferredById: uuid("transferred_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    transferredAt: timestamp("transferred_at", { withTimezone: true }).defaultNow().notNull(),
    effectiveDate: timestamp("effective_date", { withTimezone: true }).defaultNow().notNull(),
    status: varchar("status", { length: 32 }).default("COMPLETED").notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("case_transfers_case_idx").on(table.caseId),
    index("case_transfers_from_org_idx").on(table.fromOrgId),
    index("case_transfers_to_org_idx").on(table.toOrgId),
    index("case_transfers_time_idx").on(table.transferredAt),
  ]
);

export const caseLinks = pgTable(
  "case_links",
  {
    ...immutableColumns,
    sourceCaseId: uuid("source_case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    targetCaseId: uuid("target_case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    linkType: varchar("link_type", { length: 64 }).notNull(),
    notes: text("notes"),
    createdById: uuid("created_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
  },
  (table) => [
    index("case_links_source_idx").on(table.sourceCaseId),
    index("case_links_target_idx").on(table.targetCaseId),
  ]
);
