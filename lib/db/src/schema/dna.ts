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
  sampleTypeEnum,
  participantTypeEnum,
  profileQualityEnum,
  profileStatusEnum,
  matchingRequestStatusEnum,
  candidateMatchStatusEnum,
} from "./enums";
import { users } from "./identity";
import { cases } from "./cases";
import { evidenceItems } from "./evidence";

export const biologicalSamples = pgTable(
  "biological_samples",
  {
    ...commonColumns,
    sampleNumber: varchar("sample_number", { length: 64 }).unique().notNull(),
    evidenceId: uuid("evidence_id").references(() => evidenceItems.id, {
      onDelete: "restrict",
    }),
    caseId: uuid("case_id").references(() => cases.id, { onDelete: "restrict" }),
    sampleType: sampleTypeEnum("sample_type").notNull(),
    donorType: participantTypeEnum("donor_type").notNull(),
    donorPseudonym: varchar("donor_pseudonym", { length: 128 }),
    collectionDate: timestamp("collection_date", { withTimezone: true }).notNull(),
    collectedById: uuid("collected_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    storageFreezerLocation: varchar("storage_freezer_location", {
      length: 128,
    }).notNull(),
    concentrationNgUl: varchar("concentration_ng_ul", { length: 32 }),
    notes: text("notes"),
  },
  (table) => [
    index("bio_sample_number_idx").on(table.sampleNumber),
    index("bio_sample_evidence_idx").on(table.evidenceId),
    index("bio_sample_case_idx").on(table.caseId),
    index("bio_sample_type_idx").on(table.sampleType),
  ]
);

export const dnaIndices = pgTable(
  "dna_indices",
  {
    ...commonColumns,
    code: varchar("code", { length: 64 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    legalBasisRegulation: text("legal_basis_regulation").notNull(),
    retentionYearsDefault: integer("retention_years_default").notNull(),
    isRestricted: boolean("is_restricted").default(true).notNull(),
  },
  (table) => [index("dna_index_code_idx").on(table.code)]
);

export const dnaProfiles = pgTable(
  "dna_profiles",
  {
    ...commonColumns,
    sampleId: uuid("sample_id")
      .references(() => biologicalSamples.id, { onDelete: "restrict" })
      .notNull(),
    indexId: uuid("index_id")
      .references(() => dnaIndices.id, { onDelete: "restrict" })
      .notNull(),
    profileIdentifier: varchar("profile_identifier", { length: 64 })
      .unique()
      .notNull(),
    profileQuality: profileQualityEnum("profile_quality").notNull(),
    lociCount: integer("loci_count").notNull(),
    profileStatus: profileStatusEnum("profile_status")
      .default("ACTIVE")
      .notNull(),
    extractionMethod: varchar("extraction_method", { length: 128 }).notNull(),
    quantificationKit: varchar("quantification_kit", { length: 128 }).notNull(),
    amplificationKit: varchar("amplification_kit", { length: 128 }).notNull(),
    electrophoresisInstrument: varchar("electrophoresis_instrument", {
      length: 128,
    }).notNull(),
    analystId: uuid("analyst_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    approvedById: uuid("approved_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    expungementEligibleDate: timestamp("expungement_eligible_date", {
      withTimezone: true,
    }),
  },
  (table) => [
    index("dna_profile_id_idx").on(table.profileIdentifier),
    index("dna_profile_sample_idx").on(table.sampleId),
    index("dna_profile_index_idx").on(table.indexId),
    index("dna_profile_status_idx").on(table.profileStatus),
    index("dna_profile_analyst_idx").on(table.analystId),
  ]
);

export const strAlleles = pgTable(
  "str_alleles",
  {
    ...commonColumns,
    dnaProfileId: uuid("dna_profile_id")
      .references(() => dnaProfiles.id, { onDelete: "restrict" })
      .notNull(),
    locusName: varchar("locus_name", { length: 32 }).notNull(),
    allele1: varchar("allele_1", { length: 16 }).notNull(),
    allele2: varchar("allele_2", { length: 16 }),
    allele3: varchar("allele_3", { length: 16 }),
    allele4: varchar("allele_4", { length: 16 }),
    peakHeight1: integer("peak_height_1"),
    peakHeight2: integer("peak_height_2"),
  },
  (table) => [
    uniqueIndex("str_profile_locus_idx").on(table.dnaProfileId, table.locusName),
    index("str_profile_idx").on(table.dnaProfileId),
    index("str_locus_name_idx").on(table.locusName),
  ]
);

export const dnaMatchingRequests = pgTable(
  "dna_matching_requests",
  {
    ...commonColumns,
    targetProfileId: uuid("target_profile_id")
      .references(() => dnaProfiles.id, { onDelete: "restrict" })
      .notNull(),
    requestedById: uuid("requested_by_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    targetIndices: jsonb("target_indices").notNull(),
    minMatchingLoci: integer("min_matching_loci").default(13).notNull(),
    searchPurpose: text("search_purpose").notNull(),
    status: matchingRequestStatusEnum("status").default("QUEUED").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("dna_match_req_profile_idx").on(table.targetProfileId),
    index("dna_match_req_user_idx").on(table.requestedById),
    index("dna_match_req_status_idx").on(table.status),
  ]
);

export const dnaMatchingResults = pgTable(
  "dna_matching_results",
  {
    ...commonColumns,
    requestId: uuid("request_id")
      .references(() => dnaMatchingRequests.id, { onDelete: "restrict" })
      .notNull(),
    candidateProfileId: uuid("candidate_profile_id")
      .references(() => dnaProfiles.id, { onDelete: "restrict" })
      .notNull(),
    matchingLociCount: integer("matching_loci_count").notNull(),
    stringencyLevel: varchar("stringency_level", { length: 32 }).notNull(),
    likelihoodRatioScore: varchar("likelihood_ratio_score", { length: 64 }).notNull(),
    status: candidateMatchStatusEnum("status")
      .default("CANDIDATE")
      .notNull(),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
    reviewNotes: text("review_notes"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("dna_match_req_candidate_idx").on(
      table.requestId,
      table.candidateProfileId
    ),
    index("dna_match_res_req_idx").on(table.requestId),
    index("dna_match_res_candidate_idx").on(table.candidateProfileId),
    index("dna_match_res_status_idx").on(table.status),
  ]
);
