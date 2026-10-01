import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  uuid,
  integer,
} from "drizzle-orm/pg-core";
import { commonColumns, immutableColumns } from "./common";
import {
  evidenceTypeEnum,
  evidenceStatusEnum,
  transferReasonEnum,
  sealStatusEnum,
  evidenceConditionEnum,
  custodyExceptionTypeEnum,
  derivativeTypeEnum,
  dispositionTypeEnum,
  classificationLevelEnum,
} from "./enums";
import { organizations, users } from "./identity";
import { cases } from "./cases";

export const storageLocations = pgTable(
  "storage_locations",
  {
    ...commonColumns,
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    facilityCode: varchar("facility_code", { length: 32 }).notNull(),
    facilityName: varchar("facility_name", { length: 255 }).notNull(),
    roomNumber: varchar("room_number", { length: 64 }).default("ROOM-01").notNull(),
    vaultNumber: varchar("vault_number", { length: 64 }).notNull(),
    shelfIdentifier: varchar("shelf_identifier", { length: 64 }).notNull(),
    containerIdentifier: varchar("container_identifier", { length: 64 }),
    isTemperatureControlled: boolean("is_temperature_controlled")
      .default(false)
      .notNull(),
    temperatureRangeCelsius: varchar("temperature_range_celsius", { length: 32 }),
  },
  (table) => [
    uniqueIndex("storage_loc_unique_idx").on(
      table.organizationId,
      table.facilityCode,
      table.vaultNumber,
      table.shelfIdentifier
    ),
    index("storage_loc_org_idx").on(table.organizationId),
  ]
);

export const evidenceItems = pgTable(
  "evidence_items",
  {
    ...commonColumns,
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    evidenceReference: varchar("evidence_reference", { length: 128 }).notNull(),
    itemNumber: varchar("item_number", { length: 64 }).notNull(),
    description: text("description").notNull(),
    evidenceType: evidenceTypeEnum("evidence_type").notNull(),
    classification: classificationLevelEnum("classification")
      .default("RESTRICTED")
      .notNull(),
    collectionTimestamp: timestamp("collection_timestamp", {
      withTimezone: true,
    }).notNull(),
    collectedById: uuid("collected_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    collectionLocationDesc: text("collection_location_desc").notNull(),
    currentLocationId: uuid("current_location_id")
      .references(() => storageLocations.id, { onDelete: "restrict" })
      .notNull(),
    currentCustodianId: uuid("current_custodian_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    tamperSealNumber: varchar("tamper_seal_number", { length: 64 }).notNull(),
    sealStatus: sealStatusEnum("seal_status").default("INTACT").notNull(),
    condition: evidenceConditionEnum("condition").default("INTACT").notNull(),
    integrityHash: varchar("integrity_hash", { length: 64 }).notNull(),
    hashAlgorithm: varchar("hash_algorithm", { length: 32 }).default("SHA-256").notNull(),
    status: evidenceStatusEnum("status").default("COLLECTED").notNull(),
    packagingType: varchar("packaging_type", { length: 64 }).notNull(),
    parentItemId: uuid("parent_item_id"),
    isLegalHold: boolean("is_legal_hold").default(false).notNull(),
    version: integer("version").default(1).notNull(),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("evidence_reference_idx").on(table.evidenceReference),
    uniqueIndex("evidence_case_item_idx").on(table.caseId, table.itemNumber),
    index("evidence_case_idx").on(table.caseId),
    index("evidence_status_idx").on(table.status),
    index("evidence_type_idx").on(table.evidenceType),
    index("evidence_custodian_idx").on(table.currentCustodianId),
    index("evidence_hash_idx").on(table.integrityHash),
    index("evidence_parent_idx").on(table.parentItemId),
  ]
);

export const evidenceSeals = pgTable(
  "evidence_seals",
  {
    ...immutableColumns,
    evidenceId: uuid("evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    sealNumber: varchar("seal_number", { length: 64 }).notNull(),
    sealType: varchar("seal_type", { length: 64 }).default("BARCODE_TAMPER_EVIDENT").notNull(),
    appliedById: uuid("applied_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
    brokenById: uuid("broken_by_id").references(() => users.id, { onDelete: "restrict" }),
    brokenAt: timestamp("broken_at", { withTimezone: true }),
    breakReason: text("break_reason"),
    authorizationReference: varchar("authorization_reference", { length: 128 }),
    status: sealStatusEnum("status").default("INTACT").notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("seal_evidence_idx").on(table.evidenceId),
    index("seal_number_idx").on(table.sealNumber),
  ]
);

export const custodyTransfers = pgTable(
  "custody_transfers",
  {
    ...immutableColumns,
    evidenceId: uuid("evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    releasingOfficerId: uuid("releasing_officer_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    receivingOfficerId: uuid("receiving_officer_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    transferReason: transferReasonEnum("transfer_reason").notNull(),
    authorizationReference: varchar("authorization_reference", {
      length: 128,
    }).notNull(),
    transferTimestamp: timestamp("transfer_timestamp", {
      withTimezone: true,
    }).notNull(),
    sourceLocationId: uuid("source_location_id").references(
      () => storageLocations.id,
      { onDelete: "restrict" }
    ),
    destinationLocationId: uuid("destination_location_id").references(
      () => storageLocations.id,
      { onDelete: "restrict" }
    ),
    sealIntact: boolean("seal_intact").notNull(),
    newSealNumber: varchar("new_seal_number", { length: 64 }),
    transferStatus: varchar("transfer_status", { length: 32 }).default("COMPLETED").notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("custody_evidence_idx").on(table.evidenceId),
    index("custody_time_idx").on(table.transferTimestamp),
    index("custody_releasing_idx").on(table.releasingOfficerId),
    index("custody_receiving_idx").on(table.receivingOfficerId),
  ]
);

export const custodyEvents = pgTable(
  "custody_events",
  {
    ...immutableColumns,
    evidenceId: uuid("evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    actorId: uuid("actor_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    fromCustodianId: uuid("from_custodian_id").references(() => users.id, { onDelete: "restrict" }),
    toCustodianId: uuid("to_custodian_id").references(() => users.id, { onDelete: "restrict" }),
    fromLocationId: uuid("from_location_id").references(() => storageLocations.id, { onDelete: "restrict" }),
    toLocationId: uuid("to_location_id").references(() => storageLocations.id, { onDelete: "restrict" }),
    purpose: text("purpose").notNull(),
    authorizationReference: varchar("authorization_reference", { length: 128 }),
    sealStatus: sealStatusEnum("seal_status").default("INTACT").notNull(),
    condition: evidenceConditionEnum("condition").default("INTACT").notNull(),
    eventTimestamp: timestamp("event_timestamp", { withTimezone: true }).notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("custody_events_evidence_idx").on(table.evidenceId),
    index("custody_events_actor_idx").on(table.actorId),
    index("custody_events_time_idx").on(table.eventTimestamp),
  ]
);

export const custodyExceptions = pgTable(
  "custody_exceptions",
  {
    ...commonColumns,
    evidenceId: uuid("evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    exceptionType: custodyExceptionTypeEnum("exception_type").notNull(),
    reportedById: uuid("reported_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    reportedAt: timestamp("reported_at", { withTimezone: true }).notNull(),
    description: text("description").notNull(),
    isResolved: boolean("is_resolved").default(false).notNull(),
    resolvedById: uuid("resolved_by_id").references(() => users.id, { onDelete: "restrict" }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolutionNotes: text("resolution_notes"),
  },
  (table) => [
    index("custody_exc_evidence_idx").on(table.evidenceId),
    index("custody_exc_type_idx").on(table.exceptionType),
  ]
);

export const evidenceDerivatives = pgTable(
  "evidence_derivatives",
  {
    ...immutableColumns,
    parentEvidenceId: uuid("parent_evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    derivedEvidenceId: uuid("derived_evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    derivativeType: derivativeTypeEnum("derivative_type").notNull(),
    createdById: uuid("created_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    createdTimestamp: timestamp("created_timestamp", { withTimezone: true }).notNull(),
    purpose: text("purpose").notNull(),
    amountUsed: varchar("amount_used", { length: 64 }),
    remainingAmount: varchar("remaining_amount", { length: 64 }),
    notes: text("notes"),
  },
  (table) => [
    index("evidence_deriv_parent_idx").on(table.parentEvidenceId),
    index("evidence_deriv_child_idx").on(table.derivedEvidenceId),
  ]
);

export const evidenceExaminations = pgTable(
  "evidence_examinations",
  {
    ...commonColumns,
    evidenceId: uuid("evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    examinerId: uuid("examiner_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    examinationType: varchar("examination_type", { length: 128 }).notNull(),
    purpose: text("purpose").notNull(),
    locationDesc: text("location_desc").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    status: varchar("status", { length: 32 }).default("IN_PROGRESS").notNull(),
    findingsSummary: text("findings_summary"),
    reportReference: varchar("report_reference", { length: 128 }),
  },
  (table) => [
    index("evidence_exam_evidence_idx").on(table.evidenceId),
    index("evidence_exam_examiner_idx").on(table.examinerId),
  ]
);

export const evidenceDispositions = pgTable(
  "evidence_dispositions",
  {
    ...immutableColumns,
    evidenceId: uuid("evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    dispositionType: dispositionTypeEnum("disposition_type").notNull(),
    approvedById: uuid("approved_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    executedById: uuid("executed_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    witnessById: uuid("witness_by_id").references(() => users.id, { onDelete: "restrict" }),
    authorizationReference: varchar("authorization_reference", { length: 128 }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    disposalMethod: varchar("disposal_method", { length: 128 }).notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("evidence_disp_evidence_idx").on(table.evidenceId),
    index("evidence_disp_type_idx").on(table.dispositionType),
  ]
);

export const evidenceIntegrityVerifications = pgTable(
  "evidence_integrity_verifications",
  {
    ...immutableColumns,
    evidenceId: uuid("evidence_id")
      .references(() => evidenceItems.id, { onDelete: "restrict" })
      .notNull(),
    verifiedById: uuid("verified_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    algorithm: varchar("algorithm", { length: 32 }).default("SHA-256").notNull(),
    expectedHash: varchar("expected_hash", { length: 64 }).notNull(),
    observedHash: varchar("observed_hash", { length: 64 }).notNull(),
    result: varchar("result", { length: 16 }).notNull(), // MATCH or MISMATCH
    notes: text("notes"),
  },
  (table) => [
    index("evidence_verif_evidence_idx").on(table.evidenceId),
    index("evidence_verif_time_idx").on(table.verifiedAt),
  ]
);
