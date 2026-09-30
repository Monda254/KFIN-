CREATE TYPE "public"."account_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_FAILED', 'CASE_CREATE', 'CASE_VIEW', 'CASE_UPDATE', 'EVIDENCE_TRANSFER', 'DNA_INDEX_SEARCH', 'DNA_MATCH_CONFIRM', 'REPORT_APPROVE', 'PERMISSION_CHANGE', 'LEGAL_HOLD_APPLIED');--> statement-breakpoint
CREATE TYPE "public"."audit_outcome" AS ENUM('SUCCESS', 'DENIED', 'FAILURE');--> statement-breakpoint
CREATE TYPE "public"."candidate_match_status" AS ENUM('CANDIDATE', 'POTENTIAL_MATCH', 'TECHNICAL_MATCH', 'REVIEW_REQUIRED', 'CONFIRMED_MATCH', 'EXCLUDED', 'INCONCLUSIVE');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('DRAFT', 'OPEN', 'ACTIVE', 'SUSPENDED', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."classification_level" AS ENUM('PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL', 'HIGHLY_RESTRICTED');--> statement-breakpoint
CREATE TYPE "public"."evidence_status" AS ENUM('COLLECTED', 'SUBMITTED', 'IN_VAULT', 'CHECKED_OUT_LAB', 'IN_COURT', 'DISPOSED', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('BIOLOGICAL_SPECIMEN', 'TOUCH_DNA_SWAB', 'WEAPON', 'CLOTHING', 'DIGITAL_MEDIA', 'DOCUMENT', 'TRACE_EVIDENCE');--> statement-breakpoint
CREATE TYPE "public"."examination_stage" AS ENUM('PENDING_ASSIGNMENT', 'EXTRACTION', 'QUANTIFICATION', 'AMPLIFICATION', 'ELECTROPHORESIS', 'TECHNICAL_REVIEW', 'ADMIN_REVIEW', 'APPROVED');--> statement-breakpoint
CREATE TYPE "public"."matching_request_status" AS ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('LAW_ENFORCEMENT', 'FORENSIC_LAB', 'JUDICIARY', 'HEALTH_AGENCY', 'CORRECTIONAL_SERVICE');--> statement-breakpoint
CREATE TYPE "public"."participant_type" AS ENUM('SUSPECT', 'VICTIM', 'WITNESS', 'MISSING_PERSON', 'ELIMINATION_SUBJECT', 'UNKNOWN_REMAINS');--> statement-breakpoint
CREATE TYPE "public"."profile_quality" AS ENUM('COMPLETE', 'PARTIAL_HIGH', 'PARTIAL_LOW', 'MIXTURE');--> statement-breakpoint
CREATE TYPE "public"."profile_status" AS ENUM('ACTIVE', 'FLAGGED_EXPUNGEMENT', 'ARCHIVED', 'RESTRICTED');--> statement-breakpoint
CREATE TYPE "public"."sample_type" AS ENUM('WHOLE_BLOOD', 'BUCCAL_SWAB', 'BONE_FRAGMENT', 'SEMEN_STAIN', 'HAIR_ROOT', 'TISSUE_BIOPSY', 'SALIVA_TRACE');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('SUBMITTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."submission_urgency" AS ENUM('ROUTINE', 'PRIORITY', 'EXPEDITED', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."transfer_reason" AS ENUM('LAB_ANALYSIS', 'COURT_PROCEEDING', 'VAULT_STORAGE', 'TEMPORARY_RELEASE', 'DISPOSAL', 'RETURN_TO_OWNER');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"actor_id" uuid,
	"actor_ip_address" varchar(45) NOT NULL,
	"action" "audit_action" NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"outcome" "audit_outcome" NOT NULL,
	"reason" text,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "data_disclosures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"case_id" uuid NOT NULL,
	"recipient_agency" varchar(128) NOT NULL,
	"legal_court_order_ref" varchar(128) NOT NULL,
	"disclosed_items_summary" text NOT NULL,
	"authorized_by_id" uuid NOT NULL,
	"disclosure_timestamp" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"case_id" uuid NOT NULL,
	"hold_reason" text NOT NULL,
	"court_order_number" varchar(128) NOT NULL,
	"authorized_by_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"lifted_at" timestamp with time zone,
	"lifted_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"target_classification" "classification_level" NOT NULL,
	"retention_years" integer NOT NULL,
	"statutory_basis" text NOT NULL,
	"expungement_procedure" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"case_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"note_text" text NOT NULL,
	"is_confidential" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"case_id" uuid NOT NULL,
	"participant_type" "participant_type" NOT NULL,
	"pseudonym" varchar(128),
	"id_document_type" varchar(32),
	"id_document_hash" varchar(64),
	"demographics" jsonb,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "case_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"case_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"previous_status" "case_status" NOT NULL,
	"new_status" "case_status" NOT NULL,
	"reason" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"case_number" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"originating_org_id" uuid NOT NULL,
	"lead_investigator_id" uuid NOT NULL,
	"status" "case_status" DEFAULT 'OPEN' NOT NULL,
	"priority" "submission_urgency" DEFAULT 'ROUTINE' NOT NULL,
	"incident_date" timestamp with time zone NOT NULL,
	"incident_county" varchar(64) NOT NULL,
	"incident_location_coords" varchar(128),
	CONSTRAINT "cases_case_number_unique" UNIQUE("case_number")
);
--> statement-breakpoint
CREATE TABLE "biological_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"sample_number" varchar(64) NOT NULL,
	"evidence_id" uuid,
	"case_id" uuid,
	"sample_type" "sample_type" NOT NULL,
	"donor_type" "participant_type" NOT NULL,
	"donor_pseudonym" varchar(128),
	"collection_date" timestamp with time zone NOT NULL,
	"collected_by_id" uuid NOT NULL,
	"storage_freezer_location" varchar(128) NOT NULL,
	"concentration_ng_ul" varchar(32),
	"notes" text,
	CONSTRAINT "biological_samples_sample_number_unique" UNIQUE("sample_number")
);
--> statement-breakpoint
CREATE TABLE "dna_indices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"code" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"legal_basis_regulation" text NOT NULL,
	"retention_years_default" integer NOT NULL,
	"is_restricted" boolean DEFAULT true NOT NULL,
	CONSTRAINT "dna_indices_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dna_matching_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"target_profile_id" uuid NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"target_indices" jsonb NOT NULL,
	"min_matching_loci" integer DEFAULT 13 NOT NULL,
	"search_purpose" text NOT NULL,
	"status" "matching_request_status" DEFAULT 'QUEUED' NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dna_matching_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"request_id" uuid NOT NULL,
	"candidate_profile_id" uuid NOT NULL,
	"matching_loci_count" integer NOT NULL,
	"stringency_level" varchar(32) NOT NULL,
	"likelihood_ratio_score" varchar(64) NOT NULL,
	"status" "candidate_match_status" DEFAULT 'CANDIDATE' NOT NULL,
	"reviewed_by_id" uuid,
	"review_notes" text,
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dna_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"sample_id" uuid NOT NULL,
	"index_id" uuid NOT NULL,
	"profile_identifier" varchar(64) NOT NULL,
	"profile_quality" "profile_quality" NOT NULL,
	"loci_count" integer NOT NULL,
	"profile_status" "profile_status" DEFAULT 'ACTIVE' NOT NULL,
	"extraction_method" varchar(128) NOT NULL,
	"quantification_kit" varchar(128) NOT NULL,
	"amplification_kit" varchar(128) NOT NULL,
	"electrophoresis_instrument" varchar(128) NOT NULL,
	"analyst_id" uuid NOT NULL,
	"reviewed_by_id" uuid,
	"approved_by_id" uuid,
	"expungement_eligible_date" timestamp with time zone,
	CONSTRAINT "dna_profiles_profile_identifier_unique" UNIQUE("profile_identifier")
);
--> statement-breakpoint
CREATE TABLE "str_alleles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"dna_profile_id" uuid NOT NULL,
	"locus_name" varchar(32) NOT NULL,
	"allele_1" varchar(16) NOT NULL,
	"allele_2" varchar(16),
	"allele_3" varchar(16),
	"allele_4" varchar(16),
	"peak_height_1" integer,
	"peak_height_2" integer
);
--> statement-breakpoint
CREATE TABLE "custody_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"evidence_id" uuid NOT NULL,
	"releasing_officer_id" uuid NOT NULL,
	"receiving_officer_id" uuid NOT NULL,
	"transfer_reason" "transfer_reason" NOT NULL,
	"authorization_reference" varchar(128) NOT NULL,
	"transfer_timestamp" timestamp with time zone NOT NULL,
	"source_location_id" uuid,
	"destination_location_id" uuid,
	"seal_intact" boolean NOT NULL,
	"new_seal_number" varchar(64),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "evidence_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"case_id" uuid NOT NULL,
	"item_number" varchar(64) NOT NULL,
	"description" text NOT NULL,
	"evidence_type" "evidence_type" NOT NULL,
	"collection_timestamp" timestamp with time zone NOT NULL,
	"collected_by_id" uuid NOT NULL,
	"collection_location_desc" text NOT NULL,
	"current_location_id" uuid NOT NULL,
	"current_custodian_id" uuid NOT NULL,
	"tamper_seal_number" varchar(64) NOT NULL,
	"integrity_hash" varchar(64) NOT NULL,
	"status" "evidence_status" DEFAULT 'COLLECTED' NOT NULL,
	"packaging_type" varchar(64) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "storage_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"organization_id" uuid NOT NULL,
	"facility_code" varchar(32) NOT NULL,
	"facility_name" varchar(255) NOT NULL,
	"vault_number" varchar(64) NOT NULL,
	"shelf_identifier" varchar(64) NOT NULL,
	"is_temperature_controlled" boolean DEFAULT false NOT NULL,
	"temperature_range_celsius" varchar(32)
);
--> statement-breakpoint
CREATE TABLE "clearance_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"level" integer NOT NULL,
	"code" varchar(32) NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "clearance_levels_level_unique" UNIQUE("level"),
	CONSTRAINT "clearance_levels_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "organization_type" NOT NULL,
	"jurisdiction_region" varchar(128) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "organizations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"code" varchar(64) NOT NULL,
	"domain_group" varchar(64) NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "permissions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"role_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"name" varchar(64) NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"organization_id" uuid NOT NULL,
	"clearance_level_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"badge_number" varchar(64) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"national_id_hash" varchar(64) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"account_status" "account_status" DEFAULT 'PENDING' NOT NULL,
	"mfa_enabled" boolean DEFAULT false NOT NULL,
	"failed_login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_badge_number_unique" UNIQUE("badge_number")
);
--> statement-breakpoint
CREATE TABLE "examination_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"submission_id" uuid NOT NULL,
	"evidence_id" uuid NOT NULL,
	"analysis_type" varchar(128) NOT NULL,
	"assigned_analyst_id" uuid,
	"stage" "examination_stage" DEFAULT 'PENDING_ASSIGNMENT' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "lab_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"examination_request_id" uuid NOT NULL,
	"report_number" varchar(64) NOT NULL,
	"reporting_analyst_id" uuid NOT NULL,
	"technical_reviewer_id" uuid,
	"approving_director_id" uuid,
	"conclusion_summary" text NOT NULL,
	"formal_report_hash" varchar(64) NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"issued_at" timestamp with time zone,
	CONSTRAINT "lab_reports_report_number_unique" UNIQUE("report_number")
);
--> statement-breakpoint
CREATE TABLE "lab_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'INTERNAL' NOT NULL,
	"case_id" uuid NOT NULL,
	"submitting_org_id" uuid NOT NULL,
	"receiving_lab_id" uuid NOT NULL,
	"submission_number" varchar(64) NOT NULL,
	"urgency" "submission_urgency" DEFAULT 'ROUTINE' NOT NULL,
	"status" "submission_status" DEFAULT 'SUBMITTED' NOT NULL,
	"submission_date" timestamp with time zone NOT NULL,
	"authorized_by_id" uuid NOT NULL,
	"case_summary_notes" text NOT NULL,
	CONSTRAINT "lab_submissions_submission_number_unique" UNIQUE("submission_number")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_disclosures" ADD CONSTRAINT "data_disclosures_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_disclosures" ADD CONSTRAINT "data_disclosures_authorized_by_id_users_id_fk" FOREIGN KEY ("authorized_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_authorized_by_id_users_id_fk" FOREIGN KEY ("authorized_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_lifted_by_id_users_id_fk" FOREIGN KEY ("lifted_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_participants" ADD CONSTRAINT "case_participants_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_originating_org_id_organizations_id_fk" FOREIGN KEY ("originating_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_lead_investigator_id_users_id_fk" FOREIGN KEY ("lead_investigator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biological_samples" ADD CONSTRAINT "biological_samples_evidence_id_evidence_items_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biological_samples" ADD CONSTRAINT "biological_samples_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "biological_samples" ADD CONSTRAINT "biological_samples_collected_by_id_users_id_fk" FOREIGN KEY ("collected_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_matching_requests" ADD CONSTRAINT "dna_matching_requests_target_profile_id_dna_profiles_id_fk" FOREIGN KEY ("target_profile_id") REFERENCES "public"."dna_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_matching_requests" ADD CONSTRAINT "dna_matching_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_matching_results" ADD CONSTRAINT "dna_matching_results_request_id_dna_matching_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."dna_matching_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_matching_results" ADD CONSTRAINT "dna_matching_results_candidate_profile_id_dna_profiles_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "public"."dna_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_matching_results" ADD CONSTRAINT "dna_matching_results_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_profiles" ADD CONSTRAINT "dna_profiles_sample_id_biological_samples_id_fk" FOREIGN KEY ("sample_id") REFERENCES "public"."biological_samples"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_profiles" ADD CONSTRAINT "dna_profiles_index_id_dna_indices_id_fk" FOREIGN KEY ("index_id") REFERENCES "public"."dna_indices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_profiles" ADD CONSTRAINT "dna_profiles_analyst_id_users_id_fk" FOREIGN KEY ("analyst_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_profiles" ADD CONSTRAINT "dna_profiles_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dna_profiles" ADD CONSTRAINT "dna_profiles_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "str_alleles" ADD CONSTRAINT "str_alleles_dna_profile_id_dna_profiles_id_fk" FOREIGN KEY ("dna_profile_id") REFERENCES "public"."dna_profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_evidence_id_evidence_items_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_releasing_officer_id_users_id_fk" FOREIGN KEY ("releasing_officer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_receiving_officer_id_users_id_fk" FOREIGN KEY ("receiving_officer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_source_location_id_storage_locations_id_fk" FOREIGN KEY ("source_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_transfers" ADD CONSTRAINT "custody_transfers_destination_location_id_storage_locations_id_fk" FOREIGN KEY ("destination_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_collected_by_id_users_id_fk" FOREIGN KEY ("collected_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_current_location_id_storage_locations_id_fk" FOREIGN KEY ("current_location_id") REFERENCES "public"."storage_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_items" ADD CONSTRAINT "evidence_items_current_custodian_id_users_id_fk" FOREIGN KEY ("current_custodian_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clearance_level_id_clearance_levels_id_fk" FOREIGN KEY ("clearance_level_id") REFERENCES "public"."clearance_levels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_requests" ADD CONSTRAINT "examination_requests_submission_id_lab_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."lab_submissions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_requests" ADD CONSTRAINT "examination_requests_evidence_id_evidence_items_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "examination_requests" ADD CONSTRAINT "examination_requests_assigned_analyst_id_users_id_fk" FOREIGN KEY ("assigned_analyst_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_examination_request_id_examination_requests_id_fk" FOREIGN KEY ("examination_request_id") REFERENCES "public"."examination_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_reporting_analyst_id_users_id_fk" FOREIGN KEY ("reporting_analyst_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_technical_reviewer_id_users_id_fk" FOREIGN KEY ("technical_reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_reports" ADD CONSTRAINT "lab_reports_approving_director_id_users_id_fk" FOREIGN KEY ("approving_director_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_submissions" ADD CONSTRAINT "lab_submissions_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_submissions" ADD CONSTRAINT "lab_submissions_submitting_org_id_organizations_id_fk" FOREIGN KEY ("submitting_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_submissions" ADD CONSTRAINT "lab_submissions_receiving_lab_id_organizations_id_fk" FOREIGN KEY ("receiving_lab_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_submissions" ADD CONSTRAINT "lab_submissions_authorized_by_id_users_id_fk" FOREIGN KEY ("authorized_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_action_idx" ON "audit_events" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_outcome_idx" ON "audit_events" USING btree ("outcome");--> statement-breakpoint
CREATE INDEX "disclosure_case_idx" ON "data_disclosures" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "disclosure_recipient_idx" ON "data_disclosures" USING btree ("recipient_agency");--> statement-breakpoint
CREATE INDEX "disclosure_auth_user_idx" ON "data_disclosures" USING btree ("authorized_by_id");--> statement-breakpoint
CREATE INDEX "legal_hold_case_idx" ON "legal_holds" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "legal_hold_status_idx" ON "legal_holds" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "legal_hold_auth_idx" ON "legal_holds" USING btree ("authorized_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "retention_entity_class_idx" ON "retention_policies" USING btree ("entity_type","target_classification");--> statement-breakpoint
CREATE INDEX "retention_entity_idx" ON "retention_policies" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "case_notes_case_idx" ON "case_notes" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_notes_author_idx" ON "case_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "case_notes_created_idx" ON "case_notes" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "case_participant_case_idx" ON "case_participants" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_participant_type_idx" ON "case_participants" USING btree ("participant_type");--> statement-breakpoint
CREATE INDEX "case_status_hist_case_idx" ON "case_status_history" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_status_hist_actor_idx" ON "case_status_history" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "case_status_hist_time_idx" ON "case_status_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "case_number_idx" ON "cases" USING btree ("case_number");--> statement-breakpoint
CREATE INDEX "case_status_idx" ON "cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "case_org_idx" ON "cases" USING btree ("originating_org_id");--> statement-breakpoint
CREATE INDEX "case_investigator_idx" ON "cases" USING btree ("lead_investigator_id");--> statement-breakpoint
CREATE INDEX "case_incident_date_idx" ON "cases" USING btree ("incident_date");--> statement-breakpoint
CREATE INDEX "bio_sample_number_idx" ON "biological_samples" USING btree ("sample_number");--> statement-breakpoint
CREATE INDEX "bio_sample_evidence_idx" ON "biological_samples" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "bio_sample_case_idx" ON "biological_samples" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "bio_sample_type_idx" ON "biological_samples" USING btree ("sample_type");--> statement-breakpoint
CREATE INDEX "dna_index_code_idx" ON "dna_indices" USING btree ("code");--> statement-breakpoint
CREATE INDEX "dna_match_req_profile_idx" ON "dna_matching_requests" USING btree ("target_profile_id");--> statement-breakpoint
CREATE INDEX "dna_match_req_user_idx" ON "dna_matching_requests" USING btree ("requested_by_id");--> statement-breakpoint
CREATE INDEX "dna_match_req_status_idx" ON "dna_matching_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "dna_match_req_candidate_idx" ON "dna_matching_results" USING btree ("request_id","candidate_profile_id");--> statement-breakpoint
CREATE INDEX "dna_match_res_req_idx" ON "dna_matching_results" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "dna_match_res_candidate_idx" ON "dna_matching_results" USING btree ("candidate_profile_id");--> statement-breakpoint
CREATE INDEX "dna_match_res_status_idx" ON "dna_matching_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dna_profile_id_idx" ON "dna_profiles" USING btree ("profile_identifier");--> statement-breakpoint
CREATE INDEX "dna_profile_sample_idx" ON "dna_profiles" USING btree ("sample_id");--> statement-breakpoint
CREATE INDEX "dna_profile_index_idx" ON "dna_profiles" USING btree ("index_id");--> statement-breakpoint
CREATE INDEX "dna_profile_status_idx" ON "dna_profiles" USING btree ("profile_status");--> statement-breakpoint
CREATE INDEX "dna_profile_analyst_idx" ON "dna_profiles" USING btree ("analyst_id");--> statement-breakpoint
CREATE UNIQUE INDEX "str_profile_locus_idx" ON "str_alleles" USING btree ("dna_profile_id","locus_name");--> statement-breakpoint
CREATE INDEX "str_profile_idx" ON "str_alleles" USING btree ("dna_profile_id");--> statement-breakpoint
CREATE INDEX "str_locus_name_idx" ON "str_alleles" USING btree ("locus_name");--> statement-breakpoint
CREATE INDEX "custody_evidence_idx" ON "custody_transfers" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "custody_time_idx" ON "custody_transfers" USING btree ("transfer_timestamp");--> statement-breakpoint
CREATE INDEX "custody_releasing_idx" ON "custody_transfers" USING btree ("releasing_officer_id");--> statement-breakpoint
CREATE INDEX "custody_receiving_idx" ON "custody_transfers" USING btree ("receiving_officer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "evidence_case_item_idx" ON "evidence_items" USING btree ("case_id","item_number");--> statement-breakpoint
CREATE INDEX "evidence_case_idx" ON "evidence_items" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "evidence_status_idx" ON "evidence_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "evidence_type_idx" ON "evidence_items" USING btree ("evidence_type");--> statement-breakpoint
CREATE INDEX "evidence_custodian_idx" ON "evidence_items" USING btree ("current_custodian_id");--> statement-breakpoint
CREATE INDEX "evidence_hash_idx" ON "evidence_items" USING btree ("integrity_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "storage_loc_unique_idx" ON "storage_locations" USING btree ("organization_id","facility_code","vault_number","shelf_identifier");--> statement-breakpoint
CREATE INDEX "storage_loc_org_idx" ON "storage_locations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "clearance_level_idx" ON "clearance_levels" USING btree ("level");--> statement-breakpoint
CREATE INDEX "org_code_idx" ON "organizations" USING btree ("code");--> statement-breakpoint
CREATE INDEX "org_type_idx" ON "organizations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "permission_code_idx" ON "permissions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "permission_domain_idx" ON "permissions" USING btree ("domain_group");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permission_composite_idx" ON "role_permissions" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "role_perm_role_idx" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_perm_perm_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "role_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_composite_idx" ON "user_roles" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "user_role_user_idx" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_role_idx" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_org_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_status_idx" ON "users" USING btree ("account_status");--> statement-breakpoint
CREATE INDEX "user_badge_idx" ON "users" USING btree ("badge_number");--> statement-breakpoint
CREATE INDEX "exam_req_submission_idx" ON "examination_requests" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "exam_req_evidence_idx" ON "examination_requests" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "exam_req_analyst_idx" ON "examination_requests" USING btree ("assigned_analyst_id");--> statement-breakpoint
CREATE INDEX "exam_req_stage_idx" ON "examination_requests" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "lab_report_number_idx" ON "lab_reports" USING btree ("report_number");--> statement-breakpoint
CREATE INDEX "lab_report_exam_idx" ON "lab_reports" USING btree ("examination_request_id");--> statement-breakpoint
CREATE INDEX "lab_report_analyst_idx" ON "lab_reports" USING btree ("reporting_analyst_id");--> statement-breakpoint
CREATE INDEX "lab_report_hash_idx" ON "lab_reports" USING btree ("formal_report_hash");--> statement-breakpoint
CREATE INDEX "lab_sub_number_idx" ON "lab_submissions" USING btree ("submission_number");--> statement-breakpoint
CREATE INDEX "lab_sub_case_idx" ON "lab_submissions" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "lab_sub_submitting_idx" ON "lab_submissions" USING btree ("submitting_org_id");--> statement-breakpoint
CREATE INDEX "lab_sub_receiving_idx" ON "lab_submissions" USING btree ("receiving_lab_id");--> statement-breakpoint
CREATE INDEX "lab_sub_status_idx" ON "lab_submissions" USING btree ("status");