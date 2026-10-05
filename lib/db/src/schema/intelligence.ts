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
import { commonColumns } from "./common";
import {
  relationshipClassEnum,
  intelligenceLeadStatusEnum,
  caseLinkStatusEnum,
} from "./enums";
import { users } from "./identity";
import { cases } from "./cases";

export const forensicRelationships = pgTable(
  "forensic_relationships",
  {
    ...commonColumns,
    relationshipNumber: varchar("relationship_number", { length: 64 })
      .unique()
      .notNull(),
    sourceEntityType: varchar("source_entity_type", { length: 64 }).notNull(),
    sourceEntityId: uuid("source_entity_id").notNull(),
    targetEntityType: varchar("target_entity_type", { length: 64 }).notNull(),
    targetEntityId: uuid("target_entity_id").notNull(),
    relationshipType: varchar("relationship_type", { length: 128 }).notNull(),
    relationshipClass: relationshipClassEnum("relationship_class")
      .default("ANALYTICAL_RELATIONSHIP")
      .notNull(),
    confidenceScore: varchar("confidence_score", { length: 32 }),
    provenanceSource: varchar("provenance_source", { length: 128 }).notNull(),
    organizationId: uuid("organization_id").notNull(),
    status: varchar("status", { length: 32 }).default("ACTIVE").notNull(),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("forensic_rel_number_idx").on(table.relationshipNumber),
    index("forensic_rel_source_idx").on(
      table.sourceEntityType,
      table.sourceEntityId
    ),
    index("forensic_rel_target_idx").on(
      table.targetEntityType,
      table.targetEntityId
    ),
    index("forensic_rel_class_idx").on(table.relationshipClass),
  ]
);

export const intelligenceObservations = pgTable(
  "intelligence_observations",
  {
    ...commonColumns,
    observationNumber: varchar("observation_number", { length: 64 })
      .unique()
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    originatingAnalysisId: varchar("originating_analysis_id", { length: 128 }),
    relatedEntities: jsonb("related_entities").notNull(),
    rationale: text("rationale").notNull(),
    sensitivityLevel: varchar("sensitivity_level", { length: 64 })
      .default("HIGHLY_RESTRICTED")
      .notNull(),
  },
  (table) => [
    index("intel_obs_number_idx").on(table.observationNumber),
  ]
);

export const intelligenceLeads = pgTable(
  "intelligence_leads",
  {
    ...commonColumns,
    leadNumber: varchar("lead_number", { length: 64 })
      .unique()
      .notNull(),
    observationId: uuid("observation_id").references(
      () => intelligenceObservations.id,
      { onDelete: "restrict" }
    ),
    title: varchar("title", { length: 255 }).notNull(),
    rationale: text("rationale").notNull(),
    priority: varchar("priority", { length: 32 }).default("PRIORITY").notNull(),
    status: intelligenceLeadStatusEnum("status").default("NEW").notNull(),
    assignedInvestigatorId: uuid("assigned_investigator_id").references(
      () => users.id,
      { onDelete: "restrict" }
    ),
    assignedOrgId: uuid("assigned_org_id"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    reviewNotes: text("review_notes"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("intel_lead_number_idx").on(table.leadNumber),
    index("intel_lead_status_idx").on(table.status),
    index("intel_lead_assigned_idx").on(table.assignedInvestigatorId),
  ]
);

export const linkAnalyses = pgTable(
  "link_analyses",
  {
    ...commonColumns,
    analysisNumber: varchar("analysis_number", { length: 64 })
      .unique()
      .notNull(),
    requestedById: uuid("requested_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    scope: jsonb("scope").notNull(),
    maxDepth: integer("max_depth").default(2).notNull(),
    filters: jsonb("filters").notNull(),
    resultSummary: jsonb("result_summary").notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("link_analysis_number_idx").on(table.analysisNumber),
    index("link_analysis_user_idx").on(table.requestedById),
  ]
);

export const intelligenceCaseLinks = pgTable(
  "case_links",
  {
    ...commonColumns,
    sourceCaseId: uuid("source_case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    targetCaseId: uuid("target_case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    linkType: varchar("link_type", { length: 64 }).notNull(),
    rationale: text("rationale").notNull(),
    status: caseLinkStatusEnum("status").default("PROPOSED").notNull(),
    approvedById: uuid("approved_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("case_link_unique_idx").on(
      table.sourceCaseId,
      table.targetCaseId
    ),
    index("case_link_status_idx").on(table.status),
  ]
);

export const personResolutionCandidates = pgTable(
  "person_resolution_candidates",
  {
    ...commonColumns,
    personAId: uuid("person_a_id").notNull(),
    personBId: uuid("person_b_id").notNull(),
    similarityScore: varchar("similarity_score", { length: 32 }).notNull(),
    matchingFactors: jsonb("matching_factors").notNull(),
    status: varchar("status", { length: 32 }).default("CANDIDATE").notNull(),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("person_res_unique_idx").on(table.personAId, table.personBId),
    index("person_res_status_idx").on(table.status),
  ]
);
