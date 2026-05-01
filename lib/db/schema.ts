import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

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
  // Release columns — add to Supabase with:
  // ALTER TABLE clis ADD COLUMN IF NOT EXISTS release_status TEXT DEFAULT 'idle';
  // ALTER TABLE clis ADD COLUMN IF NOT EXISTS release_error TEXT;
  // ALTER TABLE clis ADD COLUMN IF NOT EXISTS latest_release_version TEXT;
  // ALTER TABLE clis ADD COLUMN IF NOT EXISTS latest_release_url TEXT;
  // ALTER TABLE clis ADD COLUMN IF NOT EXISTS latest_release_at TIMESTAMPTZ;
  // ALTER TABLE clis ADD COLUMN IF NOT EXISTS homebrew_formula_url TEXT;
  releaseStatus: text("release_status").default("idle"),
  releaseError: text("release_error"),
  latestReleaseVersion: text("latest_release_version"),
  latestReleaseUrl: text("latest_release_url"),
  latestReleaseAt: timestamp("latest_release_at", { withTimezone: true }),
  homebrewFormulaUrl: text("homebrew_formula_url"),
  buildsSinceRelease: integer("builds_since_release").default(0).notNull(),
  lastBuildAt: timestamp("last_build_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

// feedbackEvents stores agent-submitted feedback about generated CLIs.
// Written by the ingestion service (one row per `<cli> feedback ...` invocation),
// read by the studio's per-CLI feedback table view. CLIs in the wild emit
// forever, so the schema is additive-only and carries an explicit schemaVersion.
export const feedbackEvents = pgTable("feedback_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  cliId: uuid("cli_id")
    .references(() => clis.id, { onDelete: "cascade" })
    .notNull(),
  cliVersion: text("cli_version").notNull(),
  schemaVersion: text("schema_version").notNull(),
  // Free-text body submitted by the agent. Length-capped at ingest.
  message: text("message").notNull(),
  // Optional command the agent was running when it submitted (--about flag).
  commandContext: text("command_context"),
  // Detected agent runtime (claude_code, cursor, codex, ...). Empty when
  // the CLI couldn't identify the caller.
  agentType: text("agent_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export type Provider = typeof providers.$inferSelect
export type NewProvider = typeof providers.$inferInsert
export type CLI = typeof clis.$inferSelect
export type NewCLI = typeof clis.$inferInsert
export type FeedbackEvent = typeof feedbackEvents.$inferSelect
export type NewFeedbackEvent = typeof feedbackEvents.$inferInsert
