ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'MFA_VERIFY';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'MFA_FAILED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'ACCOUNT_LOCK';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'ACCOUNT_UNLOCK';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'ROLE_ASSIGN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'ROLE_REVOKE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CLEARANCE_ASSIGN';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'CLEARANCE_REVOKE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'SESSION_REVOKE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'BREAK_GLASS_ACTIVATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'ACCESS_DENIED';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'SERVICE_AUTH';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token_hash" varchar(64) NOT NULL,
	"ip_address" varchar(45) NOT NULL,
	"user_agent" text,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_session_user_idx" ON "user_sessions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_session_token_hash_idx" ON "user_sessions" ("refresh_token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_session_status_idx" ON "user_sessions" ("is_revoked", "expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mfa_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"user_id" uuid NOT NULL UNIQUE,
	"factor_type" varchar(32) DEFAULT 'TOTP' NOT NULL,
	"secret" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"backup_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_used_step" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mfa_factors" ADD CONSTRAINT "mfa_factors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mfa_factors_user_idx" ON "mfa_factors" ("user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"organization_id" uuid NOT NULL,
	"service_name" varchar(128) NOT NULL UNIQUE,
	"description" text NOT NULL,
	"api_key_prefix" varchar(16) NOT NULL,
	"api_key_hash" varchar(255) NOT NULL,
	"allowed_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"clearance_level_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by_id" uuid NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "service_identities" ADD CONSTRAINT "service_identities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "service_identities" ADD CONSTRAINT "service_identities_clearance_level_id_clearance_levels_id_fk" FOREIGN KEY ("clearance_level_id") REFERENCES "public"."clearance_levels"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "service_identities" ADD CONSTRAINT "service_identities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_identities_org_idx" ON "service_identities" ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_identities_key_prefix_idx" ON "service_identities" ("api_key_prefix");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "temporary_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"user_id" uuid NOT NULL,
	"granted_by_id" uuid NOT NULL,
	"permission_code" varchar(64) NOT NULL,
	"resource_type" varchar(64) NOT NULL,
	"resource_id" varchar(64),
	"purpose" varchar(64) NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"justification" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "temporary_access_grants" ADD CONSTRAINT "temporary_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "temporary_access_grants" ADD CONSTRAINT "temporary_access_grants_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "temp_grant_user_idx" ON "temporary_access_grants" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "temp_grant_validity_idx" ON "temporary_access_grants" ("is_revoked", "valid_from", "valid_until");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "break_glass_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"user_id" uuid NOT NULL,
	"incident_ticket_ref" varchar(128) NOT NULL,
	"justification" text NOT NULL,
	"activated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_notes" text
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "break_glass_events" ADD CONSTRAINT "break_glass_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "break_glass_events" ADD CONSTRAINT "break_glass_events_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "break_glass_user_idx" ON "break_glass_events" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "break_glass_status_idx" ON "break_glass_events" ("is_active", "expires_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_histories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data_classification" "classification_level" DEFAULT 'HIGHLY_RESTRICTED' NOT NULL,
	"user_id" uuid NOT NULL,
	"password_hash" varchar(255) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "password_histories" ADD CONSTRAINT "password_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "password_history_user_idx" ON "password_histories" ("user_id", "created_at" DESC);
