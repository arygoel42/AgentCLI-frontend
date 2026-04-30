import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const providers = pgTable("providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  githubUsername: text("github_username"),
  githubUserId: text("github_user_id"),
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
  repoUrl: text("repo_url"),
  repoOwner: text("repo_owner"),
  repoName: text("repo_name"),
  lastCommitSha: text("last_commit_sha"),
  inviteSentAt: timestamp("invite_sent_at", { withTimezone: true }),
  inviteAcceptedAt: timestamp("invite_accepted_at", { withTimezone: true }),
  provisioningStatus: text("provisioning_status").default("pending").notNull(),
  provisioningError: text("provisioning_error"),
  provisioningStartedAt: timestamp("provisioning_started_at", { withTimezone: true }),
  // skillNotes is user-authored markdown appended to the auto-rendered llms.txt
  // under a "## Notes" heading at build time. The auto content is regenerated
  // from the spec on every rebuild — only this string is the user's contribution.
  // Auto-derived llms.txt body is cached in preview_json.llms_text.
  // (Column kept as `skill_notes` for backwards compat with prior schema.)
  skillNotes: text("skill_notes").default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export type Provider = typeof providers.$inferSelect
export type NewProvider = typeof providers.$inferInsert
export type CLI = typeof clis.$inferSelect
export type NewCLI = typeof clis.$inferInsert
