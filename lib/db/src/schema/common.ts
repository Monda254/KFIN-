import { uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { classificationLevelEnum } from "./enums";

export const commonColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  version: integer("version").default(1).notNull(),
  dataClassification: classificationLevelEnum("data_classification").default("INTERNAL").notNull(),
};

export const immutableColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  dataClassification: classificationLevelEnum("data_classification").default("HIGHLY_RESTRICTED").notNull(),
};
