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
  participantTypeEnum,
  submissionUrgencyEnum,
} from "./enums";
import { organizations, users } from "./identity";

export const cases = pgTable(
  "cases",
  {
    ...commonColumns,
    caseNumber: varchar("case_number", { length: 64 }).unique().notNull(),
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
  },
  (table) => [
    index("case_number_idx").on(table.caseNumber),
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
