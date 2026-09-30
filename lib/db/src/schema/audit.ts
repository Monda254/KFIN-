import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { commonColumns, immutableColumns } from "./common";
import {
  auditActionEnum,
  auditOutcomeEnum,
  classificationLevelEnum,
} from "./enums";
import { users } from "./identity";
import { cases } from "./cases";

export const auditEvents = pgTable(
  "audit_events",
  {
    ...immutableColumns,
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    actorIpAddress: varchar("actor_ip_address", { length: 45 }).notNull(),
    action: auditActionEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 64 }).notNull(),
    outcome: auditOutcomeEnum("outcome").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("audit_actor_idx").on(table.actorId),
    index("audit_action_idx").on(table.action),
    index("audit_entity_idx").on(table.entityType, table.entityId),
    index("audit_timestamp_idx").on(table.createdAt),
    index("audit_outcome_idx").on(table.outcome),
  ]
);

export const dataDisclosures = pgTable(
  "data_disclosures",
  {
    ...commonColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    recipientAgency: varchar("recipient_agency", { length: 128 }).notNull(),
    legalCourtOrderRef: varchar("legal_court_order_ref", {
      length: 128,
    }).notNull(),
    disclosedItemsSummary: text("disclosed_items_summary").notNull(),
    authorizedById: uuid("authorized_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    disclosureTimestamp: timestamp("disclosure_timestamp", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    index("disclosure_case_idx").on(table.caseId),
    index("disclosure_recipient_idx").on(table.recipientAgency),
    index("disclosure_auth_user_idx").on(table.authorizedById),
  ]
);

export const retentionPolicies = pgTable(
  "retention_policies",
  {
    ...commonColumns,
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    targetClassification: classificationLevelEnum(
      "target_classification"
    ).notNull(),
    retentionYears: integer("retention_years").notNull(),
    statutoryBasis: text("statutory_basis").notNull(),
    expungementProcedure: text("expungement_procedure").notNull(),
  },
  (table) => [
    uniqueIndex("retention_entity_class_idx").on(
      table.entityType,
      table.targetClassification
    ),
    index("retention_entity_idx").on(table.entityType),
  ]
);

export const legalHolds = pgTable(
  "legal_holds",
  {
    ...commonColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    holdReason: text("hold_reason").notNull(),
    courtOrderNumber: varchar("court_order_number", { length: 128 }).notNull(),
    authorizedById: uuid("authorized_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    liftedAt: timestamp("lifted_at", { withTimezone: true }),
    liftedById: uuid("lifted_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
  },
  (table) => [
    index("legal_hold_case_idx").on(table.caseId),
    index("legal_hold_status_idx").on(table.isActive),
    index("legal_hold_auth_idx").on(table.authorizedById),
  ]
);
