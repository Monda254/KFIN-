import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { commonColumns } from "./common";
import {
  submissionUrgencyEnum,
  submissionStatusEnum,
  examinationStageEnum,
} from "./enums";
import { organizations, users } from "./identity";
import { cases } from "./cases";
import { evidenceItems } from "./evidence";

export const labSubmissions = pgTable(
  "lab_submissions",
  {
    ...commonColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    submittingOrgId: uuid("submitting_org_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    receivingLabId: uuid("receiving_lab_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    submissionNumber: varchar("submission_number", { length: 64 })
      .unique()
      .notNull(),
    urgency: submissionUrgencyEnum("urgency").default("ROUTINE").notNull(),
    status: submissionStatusEnum("status").default("SUBMITTED").notNull(),
    submissionDate: timestamp("submission_date", { withTimezone: true }).notNull(),
    authorizedById: uuid("authorized_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    caseSummaryNotes: text("case_summary_notes").notNull(),
  },
  (table) => [
    index("lab_sub_number_idx").on(table.submissionNumber),
    index("lab_sub_case_idx").on(table.caseId),
    index("lab_sub_submitting_idx").on(table.submittingOrgId),
    index("lab_sub_receiving_idx").on(table.receivingLabId),
    index("lab_sub_status_idx").on(table.status),
  ]
);

export const examinationRequests = pgTable(
  "examination_requests",
  {
    ...commonColumns,
    submissionId: uuid("submission_id")
      .references(() => labSubmissions.id, { onDelete: "restrict" })
      .notNull(),
    evidenceId: uuid("evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    analysisType: varchar("analysis_type", { length: 128 }).notNull(),
    assignedAnalystId: uuid("assigned_analyst_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    stage: examinationStageEnum("stage")
      .default("PENDING_ASSIGNMENT")
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (table) => [
    index("exam_req_submission_idx").on(table.submissionId),
    index("exam_req_evidence_idx").on(table.evidenceId),
    index("exam_req_analyst_idx").on(table.assignedAnalystId),
    index("exam_req_stage_idx").on(table.stage),
  ]
);

export const labReports = pgTable(
  "lab_reports",
  {
    ...commonColumns,
    examinationRequestId: uuid("examination_request_id")
      .references(() => examinationRequests.id, { onDelete: "restrict" })
      .notNull(),
    reportNumber: varchar("report_number", { length: 64 }).unique().notNull(),
    reportingAnalystId: uuid("reporting_analyst_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    technicalReviewerId: uuid("technical_reviewer_id").references(
      () => users.id,
      { onDelete: "restrict" }
    ),
    approvingDirectorId: uuid("approving_director_id").references(
      () => users.id,
      { onDelete: "restrict" }
    ),
    conclusionSummary: text("conclusion_summary").notNull(),
    formalReportHash: varchar("formal_report_hash", { length: 64 }).notNull(),
    isApproved: boolean("is_approved").default(false).notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
  },
  (table) => [
    index("lab_report_number_idx").on(table.reportNumber),
    index("lab_report_exam_idx").on(table.examinationRequestId),
    index("lab_report_analyst_idx").on(table.reportingAnalystId),
    index("lab_report_hash_idx").on(table.formalReportHash),
  ]
);
