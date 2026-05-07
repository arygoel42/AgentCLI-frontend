import { boolean, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

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
  telemetryEnabled: boolean("telemetry_enabled").default(true).notNull(),
  feedbackEnabled: boolean("feedback_enabled").default(true).notNull(),
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

// cliEvents stores per-invocation telemetry emitted by generated CLI binaries.
// The binary fires a non-blocking event after each command execution containing
// only structural metadata (flag names, not values) and performance numbers.
// Never contains flag values, API responses, or user PII.
//
// Run in Supabase to create this table:
//   CREATE TABLE IF NOT EXISTS cli_events (
//     id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//     cli_id       uuid NOT NULL REFERENCES clis(id) ON DELETE CASCADE,
//     cli_version  text NOT NULL,
//     command      text NOT NULL,
//     group_name   text,
//     flags_used   text[] NOT NULL DEFAULT '{}',
//     flag_count   int  NOT NULL DEFAULT 0,
//     exit_code    int  NOT NULL,
//     latency_ms   int  NOT NULL,
//     error_type   text,
//     error_code   int,
//     output_bytes int  NOT NULL DEFAULT 0,
//     session_id   text NOT NULL,
//     occurred_at  timestamptz NOT NULL,
//     created_at   timestamptz NOT NULL DEFAULT now()
//   );
//   CREATE INDEX IF NOT EXISTS cli_events_cli_occurred_idx  ON cli_events (cli_id, occurred_at DESC);
//   CREATE INDEX IF NOT EXISTS cli_events_cli_command_idx   ON cli_events (cli_id, command, occurred_at DESC);
export const cliEvents = pgTable("cli_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  cliId: uuid("cli_id")
    .references(() => clis.id, { onDelete: "cascade" })
    .notNull(),
  cliVersion: text("cli_version").notNull(),
  command: text("command").notNull(),
  groupName: text("group_name"),
  flagsUsed: text("flags_used").array().notNull().default(sql`'{}'::text[]`),
  flagCount: integer("flag_count").notNull().default(0),
  exitCode: integer("exit_code").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  errorType: text("error_type"),
  errorCode: integer("error_code"),
  outputBytes: integer("output_bytes").notNull().default(0),
  sessionId: text("session_id").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  // Nullable — populated by CLIs built after caller-type detection was added.
  // Null rows are treated as "unknown" in the studio.
  callerType: text("caller_type"), // "human" | "agent" | "ci"
  agentType: text("agent_type"),   // "claude_code" | "cursor" | "cline" | ...
})

export type Provider = typeof providers.$inferSelect
export type NewProvider = typeof providers.$inferInsert
export type CLI = typeof clis.$inferSelect
export type NewCLI = typeof clis.$inferInsert
export type FeedbackEvent = typeof feedbackEvents.$inferSelect
export type NewFeedbackEvent = typeof feedbackEvents.$inferInsert
export type CliEvent = typeof cliEvents.$inferSelect
export type NewCliEvent = typeof cliEvents.$inferInsert
