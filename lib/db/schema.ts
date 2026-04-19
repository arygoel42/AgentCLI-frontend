import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const providers = pgTable("providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const clis = pgTable("clis", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id")
    .references(() => providers.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  modulePath: text("module_path").notNull(),
  envPrefix: text("env_prefix").notNull(),
  telemetryToken: text("telemetry_token").unique().notNull(),
  currentVersion: text("current_version"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export type Provider = typeof providers.$inferSelect
export type NewProvider = typeof providers.$inferInsert
export type CLI = typeof clis.$inferSelect
export type NewCLI = typeof clis.$inferInsert
