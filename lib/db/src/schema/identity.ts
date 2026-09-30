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
} from "drizzle-orm/pg-core";
import { commonColumns } from "./common";
import { organizationTypeEnum, accountStatusEnum } from "./enums";

export const organizations = pgTable(
  "organizations",
  {
    ...commonColumns,
    code: varchar("code", { length: 32 }).unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: organizationTypeEnum("type").notNull(),
    jurisdictionRegion: varchar("jurisdiction_region", { length: 128 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
  },
  (table) => [
    index("org_code_idx").on(table.code),
    index("org_type_idx").on(table.type),
  ]
);

export const clearanceLevels = pgTable(
  "clearance_levels",
  {
    ...commonColumns,
    level: integer("level").unique().notNull(),
    code: varchar("code", { length: 32 }).unique().notNull(),
    description: text("description").notNull(),
  },
  (table) => [index("clearance_level_idx").on(table.level)]
);

export const users = pgTable(
  "users",
  {
    ...commonColumns,
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "restrict" })
      .notNull(),
    clearanceLevelId: uuid("clearance_level_id")
      .references(() => clearanceLevels.id, { onDelete: "restrict" })
      .notNull(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    badgeNumber: varchar("badge_number", { length: 64 }).unique().notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    nationalIdHash: varchar("national_id_hash", { length: 64 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    accountStatus: accountStatusEnum("account_status").default("PENDING").notNull(),
    mfaEnabled: boolean("mfa_enabled").default(false).notNull(),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (table) => [
    index("user_email_idx").on(table.email),
    index("user_org_idx").on(table.organizationId),
    index("user_status_idx").on(table.accountStatus),
    index("user_badge_idx").on(table.badgeNumber),
  ]
);

export const roles = pgTable(
  "roles",
  {
    ...commonColumns,
    name: varchar("name", { length: 64 }).unique().notNull(),
    description: text("description").notNull(),
  },
  (table) => [index("role_name_idx").on(table.name)]
);

export const userRoles = pgTable(
  "user_roles",
  {
    ...commonColumns,
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "restrict" })
      .notNull(),
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "restrict" })
      .notNull(),
    assignedById: uuid("assigned_by_id").references(() => users.id, {
      onDelete: "restrict",
    }),
  },
  (table) => [
    uniqueIndex("user_role_composite_idx").on(table.userId, table.roleId),
    index("user_role_user_idx").on(table.userId),
    index("user_role_role_idx").on(table.roleId),
  ]
);

export const permissions = pgTable(
  "permissions",
  {
    ...commonColumns,
    code: varchar("code", { length: 64 }).unique().notNull(),
    domainGroup: varchar("domain_group", { length: 64 }).notNull(),
    description: text("description").notNull(),
  },
  (table) => [
    index("permission_code_idx").on(table.code),
    index("permission_domain_idx").on(table.domainGroup),
  ]
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    ...commonColumns,
    roleId: uuid("role_id")
      .references(() => roles.id, { onDelete: "restrict" })
      .notNull(),
    permissionId: uuid("permission_id")
      .references(() => permissions.id, { onDelete: "restrict" })
      .notNull(),
  },
  (table) => [
    uniqueIndex("role_permission_composite_idx").on(
      table.roleId,
      table.permissionId
    ),
    index("role_perm_role_idx").on(table.roleId),
    index("role_perm_perm_idx").on(table.permissionId),
  ]
);
