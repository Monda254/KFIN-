ALTER TYPE "public"."case_status" ADD VALUE IF NOT EXISTS 'REOPENED';--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."case_type" AS ENUM (
        'CRIMINAL_INVESTIGATION',
        'UNIDENTIFIED_REMAINS',
        'MISSING_PERSONS',
        'DISASTER_VICTIM_IDENTIFICATION',
        'FORENSIC_INTELLIGENCE',
        'IDENTITY_RESOLUTION',
        'LABORATORY_EXAMINATION'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    CREATE TYPE "public"."case_role" AS ENUM (
        'LEAD_INVESTIGATOR',
        'INVESTIGATOR',
        'FORENSIC_EXAMINER',
        'EVIDENCE_CUSTODIAN',
        'TECHNICAL_REVIEWER',
        'CASE_MANAGER',
        'AUDITOR'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CASE_CLOSE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CASE_REOPEN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CASE_ASSIGN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CASE_TRANSFER';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CASE_LINK';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CASE_PARTICIPANT_ADD';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CASE_PARTICIPANT_REMOVE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CASE_NOTE_ADD';--> statement-breakpoint
ALTER TABLE "public"."cases" ADD COLUMN IF NOT EXISTS "case_type" "public"."case_type" DEFAULT 'CRIMINAL_INVESTIGATION' NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."cases" ADD COLUMN IF NOT EXISTS "closure_reason" text;--> statement-breakpoint
ALTER TABLE "public"."cases" ADD COLUMN IF NOT EXISTS "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "public"."cases" ADD COLUMN IF NOT EXISTS "closed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "public"."cases" ADD COLUMN IF NOT EXISTS "reopened_reason" text;--> statement-breakpoint
ALTER TABLE "public"."cases" ADD COLUMN IF NOT EXISTS "reopened_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "public"."cases" ADD COLUMN IF NOT EXISTS "reopened_by_id" uuid;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_closed_by_id_users_id_fk" FOREIGN KEY ("closed_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."cases" ADD CONSTRAINT "cases_reopened_by_id_users_id_fk" FOREIGN KEY ("reopened_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_case_type_idx" ON "public"."cases" USING btree ("case_type");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."case_assignments" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "case_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "organization_id" uuid NOT NULL,
    "case_role" "public"."case_role" NOT NULL,
    "access_scope" varchar(32) DEFAULT 'FULL' NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
    "assigned_by_id" uuid NOT NULL,
    "revoked_at" timestamp with time zone,
    "revoked_by_id" uuid,
    "revocation_reason" text,
    "is_active" boolean DEFAULT true NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_assignments" ADD CONSTRAINT "case_assignments_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_assignments" ADD CONSTRAINT "case_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_assignments" ADD CONSTRAINT "case_assignments_org_id_orgs_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_assignments" ADD CONSTRAINT "case_assignments_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_assignments" ADD CONSTRAINT "case_assignments_revoked_by_id_users_id_fk" FOREIGN KEY ("revoked_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_assignments_case_idx" ON "public"."case_assignments" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_assignments_user_idx" ON "public"."case_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_assignments_org_idx" ON "public"."case_assignments" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_assignments_active_idx" ON "public"."case_assignments" USING btree ("is_active");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."case_transfers" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "case_id" uuid NOT NULL,
    "from_org_id" uuid NOT NULL,
    "to_org_id" uuid NOT NULL,
    "from_investigator_id" uuid NOT NULL,
    "to_investigator_id" uuid NOT NULL,
    "transfer_reason" text NOT NULL,
    "authorization_reference" varchar(255),
    "transferred_by_id" uuid NOT NULL,
    "transferred_at" timestamp with time zone DEFAULT now() NOT NULL,
    "effective_date" timestamp with time zone DEFAULT now() NOT NULL,
    "status" varchar(32) DEFAULT 'COMPLETED' NOT NULL,
    "notes" text
);--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_transfers" ADD CONSTRAINT "case_transfers_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_transfers" ADD CONSTRAINT "case_transfers_from_org_id_orgs_id_fk" FOREIGN KEY ("from_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_transfers" ADD CONSTRAINT "case_transfers_to_org_id_orgs_id_fk" FOREIGN KEY ("to_org_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_transfers" ADD CONSTRAINT "case_transfers_from_investigator_id_users_id_fk" FOREIGN KEY ("from_investigator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_transfers" ADD CONSTRAINT "case_transfers_to_investigator_id_users_id_fk" FOREIGN KEY ("to_investigator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_transfers" ADD CONSTRAINT "case_transfers_transferred_by_id_users_id_fk" FOREIGN KEY ("transferred_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_transfers_case_idx" ON "public"."case_transfers" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_transfers_from_org_idx" ON "public"."case_transfers" USING btree ("from_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_transfers_to_org_idx" ON "public"."case_transfers" USING btree ("to_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_transfers_time_idx" ON "public"."case_transfers" USING btree ("transferred_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."case_links" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "data_classification" "public"."classification_level" DEFAULT 'RESTRICTED' NOT NULL,
    "source_case_id" uuid NOT NULL,
    "target_case_id" uuid NOT NULL,
    "link_type" varchar(64) NOT NULL,
    "notes" text,
    "created_by_id" uuid NOT NULL,
    CONSTRAINT "case_links_unique_pair" UNIQUE("source_case_id", "target_case_id", "link_type")
);--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_links" ADD CONSTRAINT "case_links_source_case_id_cases_id_fk" FOREIGN KEY ("source_case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_links" ADD CONSTRAINT "case_links_target_case_id_cases_id_fk" FOREIGN KEY ("target_case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
    ALTER TABLE "public"."case_links" ADD CONSTRAINT "case_links_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_links_source_idx" ON "public"."case_links" USING btree ("source_case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "case_links_target_idx" ON "public"."case_links" USING btree ("target_case_id");
