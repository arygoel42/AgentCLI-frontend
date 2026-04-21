import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const providers = pgTable("providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  apiKeyHash: text("api_key_hash"),
  apiKeyHint: text("api_key_hint"),
  role: text("role"),
  company: text("company"),
  useCase: text("use_case"),
  referralSource: text("referral_source"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const clis = pgTable("clis", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id")
    .references(() => providers.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  modulePath: text("module_path"),
  envPrefix: text("env_prefix").notNull(),
  telemetryToken: text("telemetry_token").unique().notNull(),
  currentVersion: text("current_version"),
  specContent: text("spec_content"),
  specFilename: text("spec_filename"),
  configYml: text("config_yml"),
  previewJson: text("preview_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export type Provider = typeof providers.$inferSelect
export type NewProvider = typeof providers.$inferInsert
export type CLI = typeof clis.$inferSelect
export type NewCLI = typeof clis.$inferInsert
