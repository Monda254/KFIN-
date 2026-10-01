-- Migration: Phase 1.4 Evidence & Chain-of-Custody Foundation

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE "public"."seal_status" AS ENUM ('INTACT', 'BROKEN', 'TAMPER_SUSPECTED', 'RESEALED', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    CREATE TYPE "public"."evidence_condition" AS ENUM ('INTACT', 'DAMAGED', 'WET', 'CONTAMINATED', 'DEGRADED', 'SEALED', 'UNSEALED', 'UNKNOWN');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    CREATE TYPE "public"."custody_exception_type" AS ENUM ('TRANSFER_DISPUTED', 'SEAL_BROKEN', 'MISSING', 'DAMAGED', 'CONTAMINATION_SUSPECTED', 'IDENTITY_MISMATCH');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    CREATE TYPE "public"."derivative_type" AS ENUM ('SUBDIVISION', 'EXTRACTED_SAMPLE', 'TEST_DERIVATIVE', 'DIGITAL_COPY');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    CREATE TYPE "public"."disposition_type" AS ENUM ('RETURNED', 'TRANSFERRED_OUT', 'RETAINED', 'ARCHIVED', 'DESTROYED');
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

-- 2. Expand existing enums with new values
ALTER TYPE "public"."evidence_type" ADD VALUE IF NOT EXISTS 'PHYSICAL_EXHIBIT';--> statement-breakpoint
ALTER TYPE "public"."evidence_type" ADD VALUE IF NOT EXISTS 'TOXICOLOGICAL';--> statement-breakpoint
ALTER TYPE "public"."evidence_type" ADD VALUE IF NOT EXISTS 'CHEMICAL';--> statement-breakpoint
ALTER TYPE "public"."evidence_type" ADD VALUE IF NOT EXISTS 'FIREARM_RELATED';--> statement-breakpoint
ALTER TYPE "public"."evidence_type" ADD VALUE IF NOT EXISTS 'FINGERPRINT_RELATED';--> statement-breakpoint
ALTER TYPE "public"."evidence_type" ADD VALUE IF NOT EXISTS 'UNIDENTIFIED_REMAINS';--> statement-breakpoint
ALTER TYPE "public"."evidence_type" ADD VALUE IF NOT EXISTS 'ENVIRONMENTAL';--> statement-breakpoint
ALTER TYPE "public"."evidence_type" ADD VALUE IF NOT EXISTS 'OTHER';--> statement-breakpoint

ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'PACKAGED';--> statement-breakpoint
ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'SEALED';--> statement-breakpoint
ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'TRANSFERRED';--> statement-breakpoint
ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'RECEIVED';--> statement-breakpoint
ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'STORED';--> statement-breakpoint
ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'RETRIEVED';--> statement-breakpoint
ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'EXAMINED';--> statement-breakpoint
ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'ARCHIVED';--> statement-breakpoint
ALTER TYPE "public"."evidence_status" ADD VALUE IF NOT EXISTS 'EXCEPTION';--> statement-breakpoint

ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_VIEW';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_UPDATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_COLLECT';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_PACKAGE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_SEAL';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_SEAL_BREAK';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_RESEAL';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_TRANSFER_INITIATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_TRANSFER_RECEIVE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_TRANSFER_REJECT';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_RETRIEVE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_RETURN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_EXAMINE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_DERIVATIVE_CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_VERIFY_INTEGRITY';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_DISPOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_EXPORT';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_EXCEPTION_RAISE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_EXCEPTION_RESOLVE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_LEGAL_HOLD_APPLY';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'EVIDENCE_LEGAL_HOLD_RELEASE';--> statement-breakpoint

-- 3. Alter Storage Locations table
ALTER TABLE "public"."storage_locations" ADD COLUMN IF NOT EXISTS "room_number" varchar(64) DEFAULT 'ROOM-01' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."storage_locations" ADD COLUMN IF NOT EXISTS "container_identifier" varchar(64);--> statement-breakpoint

-- 4. Alter Evidence Items table
ALTER TABLE "public"."evidence_items" ADD COLUMN IF NOT EXISTS "evidence_reference" varchar(128);--> statement-breakpoint
ALTER TABLE "public"."evidence_items" ADD COLUMN IF NOT EXISTS "classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."evidence_items" ADD COLUMN IF NOT EXISTS "seal_status" "public"."seal_status" DEFAULT 'INTACT' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."evidence_items" ADD COLUMN IF NOT EXISTS "condition" "public"."evidence_condition" DEFAULT 'INTACT' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."evidence_items" ADD COLUMN IF NOT EXISTS "hash_algorithm" varchar(32) DEFAULT 'SHA-256' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."evidence_items" ADD COLUMN IF NOT EXISTS "parent_item_id" uuid;--> statement-breakpoint
ALTER TABLE "public"."evidence_items" ADD COLUMN IF NOT EXISTS "is_legal_hold" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- 5. Create New Evidence Tables

CREATE TABLE IF NOT EXISTS "public"."evidence_seals" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "evidence_id" uuid NOT NULL,
    "seal_number" varchar(64) NOT NULL,
    "seal_type" varchar(64) DEFAULT 'BARCODE_TAMPER_EVIDENT' NOT NULL,
    "applied_by_id" uuid NOT NULL,
    "applied_at" timestamp with time zone NOT NULL,
    "broken_by_id" uuid,
    "broken_at" timestamp with time zone,
    "break_reason" text,
    "authorization_reference" varchar(128),
    "status" "public"."seal_status" DEFAULT 'INTACT' NOT NULL,
    "notes" text
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."custody_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "evidence_id" uuid NOT NULL,
    "action" varchar(64) NOT NULL,
    "actor_id" uuid NOT NULL,
    "from_custodian_id" uuid,
    "to_custodian_id" uuid,
    "from_location_id" uuid,
    "to_location_id" uuid,
    "purpose" text NOT NULL,
    "authorization_reference" varchar(128),
    "seal_status" "public"."seal_status" DEFAULT 'INTACT' NOT NULL,
    "condition" "public"."evidence_condition" DEFAULT 'INTACT' NOT NULL,
    "event_timestamp" timestamp with time zone NOT NULL,
    "notes" text
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."custody_exceptions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "evidence_id" uuid NOT NULL,
    "exception_type" "public"."custody_exception_type" NOT NULL,
    "reported_by_id" uuid NOT NULL,
    "reported_at" timestamp with time zone NOT NULL,
    "description" text NOT NULL,
    "is_resolved" boolean DEFAULT false NOT NULL,
    "resolved_by_id" uuid,
    "resolved_at" timestamp with time zone,
    "resolution_notes" text
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."evidence_derivatives" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "parent_evidence_id" uuid NOT NULL,
    "derived_evidence_id" uuid NOT NULL,
    "derivative_type" "public"."derivative_type" NOT NULL,
    "created_by_id" uuid NOT NULL,
    "created_timestamp" timestamp with time zone NOT NULL,
    "purpose" text NOT NULL,
    "amount_used" varchar(64),
    "remaining_amount" varchar(64),
    "notes" text
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."evidence_examinations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "evidence_id" uuid NOT NULL,
    "examiner_id" uuid NOT NULL,
    "examination_type" varchar(128) NOT NULL,
    "purpose" text NOT NULL,
    "location_desc" text NOT NULL,
    "started_at" timestamp with time zone NOT NULL,
    "completed_at" timestamp with time zone,
    "status" varchar(32) DEFAULT 'IN_PROGRESS' NOT NULL,
    "findings_summary" text,
    "report_reference" varchar(128)
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."evidence_dispositions" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "evidence_id" uuid NOT NULL,
    "disposition_type" "public"."disposition_type" NOT NULL,
    "approved_by_id" uuid NOT NULL,
    "executed_by_id" uuid NOT NULL,
    "witness_by_id" uuid,
    "authorization_reference" varchar(128) NOT NULL,
    "executed_at" timestamp with time zone NOT NULL,
    "disposal_method" varchar(128) NOT NULL,
    "notes" text
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."evidence_integrity_verifications" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "evidence_id" uuid NOT NULL,
    "verified_by_id" uuid NOT NULL,
    "verified_at" timestamp with time zone NOT NULL,
    "algorithm" varchar(32) DEFAULT 'SHA-256' NOT NULL,
    "expected_hash" varchar(64) NOT NULL,
    "observed_hash" varchar(64) NOT NULL,
    "result" varchar(16) NOT NULL,
    "notes" text
);--> statement-breakpoint

-- 6. Add Foreign Key Constraints & Indexes
DO $$ BEGIN
    ALTER TABLE "public"."evidence_seals" ADD CONSTRAINT "evidence_seals_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "public"."custody_events" ADD CONSTRAINT "custody_events_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "public"."custody_exceptions" ADD CONSTRAINT "custody_exceptions_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "public"."evidence_derivatives" ADD CONSTRAINT "evidence_derivatives_parent_id_fk" FOREIGN KEY ("parent_evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "public"."evidence_derivatives" ADD CONSTRAINT "evidence_derivatives_derived_id_fk" FOREIGN KEY ("derived_evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "public"."evidence_examinations" ADD CONSTRAINT "evidence_examinations_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "public"."evidence_dispositions" ADD CONSTRAINT "evidence_dispositions_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "public"."evidence_integrity_verifications" ADD CONSTRAINT "evidence_integrity_verifications_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_items"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "seal_evidence_idx" ON "public"."evidence_seals" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custody_events_evidence_idx" ON "public"."custody_events" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custody_events_actor_idx" ON "public"."custody_events" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custody_exc_evidence_idx" ON "public"."custody_exceptions" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_deriv_parent_idx" ON "public"."evidence_derivatives" USING btree ("parent_evidence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_exam_evidence_idx" ON "public"."evidence_examinations" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_disp_evidence_idx" ON "public"."evidence_dispositions" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "evidence_verif_evidence_idx" ON "public"."evidence_integrity_verifications" USING btree ("evidence_id");
