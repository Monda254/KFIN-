import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from "drizzle-orm/pg-core";
import { commonColumns, immutableColumns } from "./common";
import {
  evidenceTypeEnum,
  evidenceStatusEnum,
  transferReasonEnum,
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
    vaultNumber: varchar("vault_number", { length: 64 }).notNull(),
    shelfIdentifier: varchar("shelf_identifier", { length: 64 }).notNull(),
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
    itemNumber: varchar("item_number", { length: 64 }).notNull(),
    description: text("description").notNull(),
    evidenceType: evidenceTypeEnum("evidence_type").notNull(),
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
    integrityHash: varchar("integrity_hash", { length: 64 }).notNull(),
    status: evidenceStatusEnum("status").default("COLLECTED").notNull(),
    packagingType: varchar("packaging_type", { length: 64 }).notNull(),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("evidence_case_item_idx").on(table.caseId, table.itemNumber),
    index("evidence_case_idx").on(table.caseId),
    index("evidence_status_idx").on(table.status),
    index("evidence_type_idx").on(table.evidenceType),
    index("evidence_custodian_idx").on(table.currentCustodianId),
    index("evidence_hash_idx").on(table.integrityHash),
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
    notes: text("notes"),
  },
  (table) => [
    index("custody_evidence_idx").on(table.evidenceId),
    index("custody_time_idx").on(table.transferTimestamp),
    index("custody_releasing_idx").on(table.releasingOfficerId),
    index("custody_receiving_idx").on(table.receivingOfficerId),
  ]
);
