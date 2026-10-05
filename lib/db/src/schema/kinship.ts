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
  relationshipTypeEnum,
  kinshipStatusEnum,
  kinshipResultCategoryEnum,
  pedigreeNodeStatusEnum,
  familialSearchStatusEnum,
} from "./enums";
import { users } from "./identity";
import { cases } from "./cases";
import { dnaProfiles } from "./dna";

export const kinshipInvestigations = pgTable(
  "kinship_investigations",
  {
    ...commonColumns,
    investigationNumber: varchar("investigation_number", { length: 64 })
      .unique()
      .notNull(),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    initiatingOrgId: uuid("initiating_org_id").notNull(),
    initiatingUserId: uuid("initiating_user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    purpose: text("purpose").notNull(),
    legalBasis: text("legal_basis").notNull(),
    status: kinshipStatusEnum("status").default("DRAFT").notNull(),
    sensitivity: varchar("sensitivity", { length: 64 })
      .default("HIGHLY_RESTRICTED")
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    index("kin_inv_number_idx").on(table.investigationNumber),
    index("kin_inv_case_idx").on(table.caseId),
    index("kin_inv_status_idx").on(table.status),
  ]
);

export const relationshipHypotheses = pgTable(
  "relationship_hypotheses",
  {
    ...commonColumns,
    investigationId: uuid("investigation_id")
      .references(() => kinshipInvestigations.id, { onDelete: "cascade" })
      .notNull(),
    profileAId: uuid("profile_a_id")
      .references(() => dnaProfiles.id, { onDelete: "restrict" })
      .notNull(),
    profileBId: uuid("profile_b_id")
      .references(() => dnaProfiles.id, { onDelete: "restrict" })
      .notNull(),
    relationshipType: relationshipTypeEnum("relationship_type").notNull(),
    description: text("description"),
    status: varchar("status", { length: 32 }).default("PROPOSED").notNull(),
    approvedMethod: varchar("approved_method", { length: 128 }).notNull(),
  },
  (table) => [
    index("rel_hypo_inv_idx").on(table.investigationId),
    index("rel_hypo_profiles_idx").on(table.profileAId, table.profileBId),
  ]
);

export const pedigrees = pgTable(
  "pedigrees",
  {
    ...commonColumns,
    investigationId: uuid("investigation_id")
      .references(() => kinshipInvestigations.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    currentVersionNumber: integer("current_version_number")
      .default(1)
      .notNull(),
  },
  (table) => [index("pedigree_inv_idx").on(table.investigationId)]
);

export const pedigreeNodes = pgTable(
  "pedigree_nodes",
  {
    ...commonColumns,
    pedigreeId: uuid("pedigree_id")
      .references(() => pedigrees.id, { onDelete: "cascade" })
      .notNull(),
    personId: uuid("person_id"),
    label: varchar("label", { length: 128 }).notNull(),
    gender: varchar("gender", { length: 32 }).default("UNKNOWN").notNull(),
    nodeStatus: pedigreeNodeStatusEnum("node_status")
      .default("HYPOTHESIZED")
      .notNull(),
    profileId: uuid("profile_id").references(() => dnaProfiles.id, {
      onDelete: "set null",
    }),
    sampleId: uuid("sample_id"),
    notes: text("notes"),
  },
  (table) => [index("pedigree_node_ped_idx").on(table.pedigreeId)]
);

export const pedigreeRelationships = pgTable(
  "pedigree_relationships",
  {
    ...commonColumns,
    pedigreeId: uuid("pedigree_id")
      .references(() => pedigrees.id, { onDelete: "cascade" })
      .notNull(),
    sourceNodeId: uuid("source_node_id")
      .references(() => pedigreeNodes.id, { onDelete: "cascade" })
      .notNull(),
    targetNodeId: uuid("target_node_id")
      .references(() => pedigreeNodes.id, { onDelete: "cascade" })
      .notNull(),
    relationshipType: relationshipTypeEnum("relationship_type").notNull(),
    relationshipStatus: pedigreeNodeStatusEnum("relationship_status")
      .default("HYPOTHESIZED")
      .notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("pedigree_rel_ped_idx").on(table.pedigreeId),
    index("pedigree_rel_nodes_idx").on(
      table.sourceNodeId,
      table.targetNodeId
    ),
  ]
);

export const pedigreeVersions = pgTable(
  "pedigree_versions",
  {
    ...commonColumns,
    pedigreeId: uuid("pedigree_id")
      .references(() => pedigrees.id, { onDelete: "cascade" })
      .notNull(),
    versionNumber: integer("version_number").notNull(),
    snapshotData: jsonb("snapshot_data").notNull(),
    changeReason: text("change_reason").notNull(),
    changedById: uuid("changed_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
  },
  (table) => [
    uniqueIndex("pedigree_version_unique_idx").on(
      table.pedigreeId,
      table.versionNumber
    ),
    index("pedigree_version_ped_idx").on(table.pedigreeId),
  ]
);

export const kinshipAnalyses = pgTable(
  "kinship_analyses",
  {
    ...commonColumns,
    analysisNumber: varchar("analysis_number", { length: 64 })
      .unique()
      .notNull(),
    investigationId: uuid("investigation_id")
      .references(() => kinshipInvestigations.id, { onDelete: "cascade" })
      .notNull(),
    hypothesisId: uuid("hypothesis_id")
      .references(() => relationshipHypotheses.id, { onDelete: "restrict" })
      .notNull(),
    inputProfileIds: jsonb("input_profile_ids").notNull(),
    algorithmName: varchar("algorithm_name", { length: 128 }).notNull(),
    algorithmVersion: varchar("algorithm_version", { length: 64 }).notNull(),
    configuration: jsonb("configuration").notNull(),
    populationDatasetCode: varchar("population_dataset_code", { length: 64 }).notNull(),
    populationDatasetVersion: varchar("population_dataset_version", { length: 64 }).notNull(),
    analystId: uuid("analyst_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    executionTimestamp: timestamp("execution_timestamp", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: varchar("status", { length: 32 }).default("COMPLETED").notNull(),
    limitations: text("limitations"),
  },
  (table) => [
    index("kin_analysis_number_idx").on(table.analysisNumber),
    index("kin_analysis_inv_idx").on(table.investigationId),
    index("kin_analysis_hypo_idx").on(table.hypothesisId),
  ]
);

export const kinshipResults = pgTable(
  "kinship_results",
  {
    ...commonColumns,
    analysisId: uuid("analysis_id")
      .references(() => kinshipAnalyses.id, { onDelete: "cascade" })
      .notNull(),
    hypothesisId: uuid("hypothesis_id")
      .references(() => relationshipHypotheses.id, { onDelete: "restrict" })
      .notNull(),
    combinedLikelihoodRatio: varchar("combined_likelihood_ratio", { length: 64 }).notNull(),
    sharedAlleleSummary: jsonb("shared_allele_summary").notNull(),
    interpretationCategory: kinshipResultCategoryEnum("interpretation_category").notNull(),
    confidenceQualityInfo: jsonb("confidence_quality_info").notNull(),
    limitations: text("limitations").notNull(),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "restrict" }),
    reviewStatus: varchar("review_status", { length: 32 }).default("PENDING").notNull(),
    reviewNotes: text("review_notes"),
    confirmedOutcome: varchar("confirmed_outcome", { length: 64 }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("kin_res_analysis_idx").on(table.analysisId),
    index("kin_res_hypo_idx").on(table.hypothesisId),
    index("kin_res_category_idx").on(table.interpretationCategory),
  ]
);

export const familialSearchRequests = pgTable(
  "familial_search_requests",
  {
    ...commonColumns,
    searchNumber: varchar("search_number", { length: 64 })
      .unique()
      .notNull(),
    caseId: uuid("case_id")
      .references(() => cases.id, { onDelete: "restrict" })
      .notNull(),
    targetProfileId: uuid("target_profile_id")
      .references(() => dnaProfiles.id, { onDelete: "restrict" })
      .notNull(),
    targetIndices: jsonb("target_indices").notNull(),
    searchPurpose: text("search_purpose").notNull(),
    legalBasis: text("legal_basis").notNull(),
    requestingUserId: uuid("requesting_user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    authorizingUserId: uuid("authorizing_user_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    authorizedAt: timestamp("authorized_at", { withTimezone: true }),
    status: familialSearchStatusEnum("status").default("REQUESTED").notNull(),
  },
  (table) => [
    index("fam_search_number_idx").on(table.searchNumber),
    index("fam_search_case_idx").on(table.caseId),
    index("fam_search_target_idx").on(table.targetProfileId),
    index("fam_search_status_idx").on(table.status),
  ]
);

export const familialSearchCandidates = pgTable(
  "familial_search_candidates",
  {
    ...commonColumns,
    requestId: uuid("request_id")
      .references(() => familialSearchRequests.id, { onDelete: "cascade" })
      .notNull(),
    candidateProfileId: uuid("candidate_profile_id")
      .references(() => dnaProfiles.id, { onDelete: "restrict" })
      .notNull(),
    estimatedRelationshipType: relationshipTypeEnum("estimated_relationship_type").notNull(),
    likelihoodRatioScore: varchar("likelihood_ratio_score", { length: 64 }).notNull(),
    rankingIndex: integer("ranking_index").notNull(),
    leadStatus: varchar("lead_status", { length: 64 })
      .default("INVESTIGATIVE_LEAD")
      .notNull(),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "restrict" }),
    reviewNotes: text("review_notes"),
  },
  (table) => [
    uniqueIndex("fam_search_cand_idx").on(
      table.requestId,
      table.candidateProfileId
    ),
    index("fam_search_cand_req_idx").on(table.requestId),
  ]
);
