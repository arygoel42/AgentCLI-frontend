import { DocsSidebar } from "@/components/docs/docs-sidebar"
import { CodeBlock, CodeTabs } from "@/components/docs/code-block"
import { InteractiveTerminal } from "@/components/docs/terminal"
import { ApiExplorer } from "@/components/docs/api-explorer"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

// ─── Terminal demo lines ──────────────────────────────────────────────────────

const quickstartLines = [
  { type: "comment" as const, text: "# 1. Create a CLI definition" },
  { type: "input" as const, text: `curl -X POST https://api.clicreator.dev/v1/clis \\` },
  { type: "output" as const, text: `  -H "Authorization: Bearer clicreator_pk_..." \\`, delay: 80 },
  { type: "output" as const, text: `  -d '{"name":"acme","module_path":"github.com/acme/acme-cli","env_prefix":"ACME"}'`, delay: 80 },
  { type: "output" as const, text: `\n{ "id": "cli_01j...", "telemetry_token": "clicreator_tok_..." }`, delay: 400 },
  { type: "comment" as const, text: "\n# 2. Upload your OpenAPI spec", delay: 600 },
  { type: "input" as const, text: `curl -X POST https://api.clicreator.dev/v1/clis/cli_01j.../versions \\`, delay: 300 },
  { type: "output" as const, text: `  -F "spec=@openapi.yaml" -F "version=1.0.0"`, delay: 80 },
  { type: "output" as const, text: `\n{ "status": "building", "version": "1.0.0" }`, delay: 500 },
  { type: "comment" as const, text: "\n# 3. Download and ship your binary", delay: 600 },
  { type: "input" as const, text: `curl -L https://api.clicreator.dev/v1/clis/acme/versions/1.0.0/download/darwin_arm64 -o acme`, delay: 300 },
  { type: "output" as const, text: `\n✓ Binary ready. chmod +x acme && ./acme --help`, delay: 600 },
]

const telemetryLines = [
  { type: "comment" as const, text: "# Every CLI command auto-emits telemetry" },
  { type: "input" as const, text: "acme events list --output json" },
  { type: "output" as const, text: "\n→ Executing command...", delay: 300 },
  { type: "output" as const, text: `[{"id":"evt_1","status":"active"}, ...]`, delay: 200 },
  { type: "output" as const, text: "\n→ Telemetry fired (async, non-blocking):", delay: 500 },
  { type: "output" as const, text: `{`, delay: 200 },
  { type: "output" as const, text: `  "command": "events list",`, delay: 100 },
  { type: "output" as const, text: `  "caller_type": "human",`, delay: 100 },
  { type: "output" as const, text: `  "duration_ms": 312,`, delay: 100 },
  { type: "output" as const, text: `  "exit_code": 0,`, delay: 100 },
  { type: "output" as const, text: `  "flags_used": ["output"]   // values never captured`, delay: 100 },
  { type: "output" as const, text: `}`, delay: 100 },
]

// ─── Sample API responses ──────────────────────────────────────────────────────

const CLI_RESPONSE = `{
  "id": "cli_01j9x2m4k3n5p6q7r8s9t0u1v",
  "name": "acme",
  "module_path": "github.com/acme/acme-cli",
  "env_prefix": "ACME",
  "telemetry_token": "clicreator_tok_4xKm9Rp2q...",
  "current_version": "1.2.0",
  "created_at": "2026-04-01T00:00:00Z"
}`

const CLIS_LIST_RESPONSE = `{
  "data": [
    {
      "id": "cli_01j9x2m4k3n5p6q7r8s9t0u1v",
      "name": "acme",
      "current_version": "1.2.0"
    }
  ]
}`

const VERSION_RESPONSE = `{
  "id": "ver_01j9x2m...",
  "cli_id": "cli_01j9x2m...",
  "version": "1.0.0",
  "status": "ready",
  "artifacts": {
    "linux_amd64": "https://cdn.clicreator.dev/acme/1.0.0/acme_linux_amd64",
    "darwin_arm64": "https://cdn.clicreator.dev/acme/1.0.0/acme_darwin_arm64",
    "windows_amd64": "https://cdn.clicreator.dev/acme/1.0.0/acme_windows_amd64.exe"
  },
  "published_at": "2026-04-01T00:00:00Z"
}`

const METRICS_RESPONSE = `{
  "period": "7d",
  "total_invocations": 14829,
  "success_rate": 0.97,
  "unique_sessions": 1203,
  "caller_breakdown": {
    "human": 0.31,
    "agent": 0.62,
    "ci": 0.07
  },
  "agent_types": {
    "claude_code": 0.44,
    "cursor": 0.28,
    "cline": 0.18,
    "other": 0.10
  }
}`

const COMMANDS_RESPONSE = `{
  "data": [
    { "command": "events list", "invocations": 4201, "error_rate": 0.01, "p95_ms": 420 },
    { "command": "tickets get",  "invocations": 3140, "error_rate": 0.03, "p95_ms": 580 },
    { "command": "orders create","invocations": 2890, "error_rate": 0.05, "p95_ms": 920 }
  ]
}`

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold">CLICreator</Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Docs</span>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs hover:bg-foreground/90 transition-colors"
            >
              Get started <ArrowRight className="w-3 h-3" />
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12 flex gap-16">
        <DocsSidebar />

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-20">

          {/* ── Quickstart ───────────────────────────────────────────────── */}
          <section id="quickstart" className="scroll-mt-20 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
                Getting Started
              </div>
              <h1 className="text-3xl font-bold">Quickstart</h1>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Turn your OpenAPI spec into a production-ready CLI in under 5 minutes.
                No Go experience required — CLICreator handles generation, building, and distribution.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { step: "01", title: "Create a CLI", desc: "Register your CLI definition and get a telemetry token." },
                { step: "02", title: "Upload your spec", desc: "Submit your OpenAPI 3.x YAML. We generate and build the binary." },
                { step: "03", title: "Ship it", desc: "Download binaries for all platforms. Publish install scripts." },
              ].map(s => (
                <div key={s.step} className="rounded-lg border border-border p-4 space-y-2">
                  <span className="text-xs font-mono text-muted-foreground">{s.step}</span>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>

            <InteractiveTerminal lines={quickstartLines} />
          </section>

          {/* ── Core Concepts ─────────────────────────────────────────────── */}
          <section id="concepts" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Core Concepts</h2>
              <p className="mt-2 text-muted-foreground">Three objects you&apos;ll work with constantly.</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  name: "CLI",
                  badge: "permanent",
                  desc: "The top-level object that represents your CLI product. Has a stable identity (ID, telemetry token, env prefix) that persists across all versions. Think of it like a GitHub repo — the container, not the content.",
                  fields: ["id", "name", "module_path", "env_prefix", "telemetry_token", "current_version"],
                },
                {
                  name: "CLIVersion",
                  badge: "immutable",
                  desc: "A specific release of your CLI tied to a spec hash. Once built, a version is immutable. Versions move through states: pending → building → ready → deprecated. Same spec + same config always produces the same binary (deterministic).",
                  fields: ["version", "spec_hash", "status", "artifacts", "published_at"],
                },
                {
                  name: "TelemetryEvent",
                  badge: "analytics only",
                  desc: "Every command invocation from every deployed binary emits one event. Events are attributed to your CLI via the telemetry token baked into the binary at generation time. You never interact with events directly — they flow through the Metrics API.",
                  fields: ["command", "caller_type", "agent_type", "duration_ms", "exit_code", "flags_used"],
                },
              ].map(obj => (
                <div key={obj.name} className="rounded-lg border border-border p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <code className="text-sm font-bold font-mono">{obj.name}</code>
                    <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5">{obj.badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{obj.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {obj.fields.map(f => (
                      <code key={f} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{f}</code>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Authentication ────────────────────────────────────────────── */}
          <section id="authentication" className="scroll-mt-20 space-y-6">
            <div>
              <div className="text-xs text-muted-foreground mb-3">API Reference</div>
              <h2 className="text-2xl font-bold">Authentication</h2>
              <p className="mt-2 text-muted-foreground">
                All management API endpoints require your provider API key.
              </p>
            </div>

            <CodeBlock
              language="bash"
              code={`Authorization: Bearer clicreator_pk_<your-key>`}
            />

            <p className="text-sm text-muted-foreground">
              Generate your key in the{" "}
              <Link href="/dashboard/api-key" className="text-foreground underline underline-offset-4">
                API Key
              </Link>{" "}
              section of your dashboard. Keys are shown once — store them securely (environment variables, a secrets manager). If lost, rotate immediately.
            </p>

            <div className="rounded-lg border border-border p-5 space-y-3">
              <p className="text-sm font-medium">Error responses</p>
              <div className="space-y-2 text-sm">
                {[
                  { code: "401", msg: "Missing or invalid API key" },
                  { code: "403", msg: "Key valid but resource belongs to another provider" },
                  { code: "429", msg: "Rate limit exceeded — back off and retry" },
                ].map(e => (
                  <div key={e.code} className="flex items-center gap-3">
                    <code className="text-xs font-mono text-red-400 w-8">{e.code}</code>
                    <span className="text-muted-foreground text-xs">{e.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CLIs API ──────────────────────────────────────────────────── */}
          <section id="clis" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">CLIs</h2>
              <p className="mt-2 text-muted-foreground">Create and manage your CLI definitions.</p>
            </div>

            <div className="space-y-2">
              <ApiExplorer
                method="POST"
                endpoint="/v1/clis"
                description="Create a new CLI definition"
                fields={[
                  { name: "name", placeholder: "acme  (becomes the binary name)" },
                  { name: "module_path", placeholder: "github.com/acme/acme-cli" },
                  { name: "env_prefix", placeholder: "ACME" },
                ]}
                sampleResponse={CLI_RESPONSE}
              />
              <ApiExplorer
                method="GET"
                endpoint="/v1/clis"
                description="List all your CLIs"
                sampleResponse={CLIS_LIST_RESPONSE}
              />
              <ApiExplorer
                method="GET"
                endpoint="/v1/clis/:id"
                description="Get a single CLI by ID"
                fields={[{ name: "id", placeholder: "cli_01j9x2m4k3n5p6q7r8s9t0u1v" }]}
                sampleResponse={CLI_RESPONSE}
              />
            </div>
          </section>

          {/* ── Versions API ──────────────────────────────────────────────── */}
          <section id="versions" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Versions</h2>
              <p className="mt-2 text-muted-foreground">
                Submit specs, track builds, publish releases. The same spec + config always produces the same binary — duplicate submissions return the existing build instantly.
              </p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-400">
              Uploads are <code>multipart/form-data</code>. The <code>spec</code> field is your OpenAPI YAML file. The optional <code>config</code> field is a <code>clicreator.yml</code> for command tree overrides.
            </div>

            <div className="space-y-2">
              <ApiExplorer
                method="POST"
                endpoint="/v1/clis/:id/versions"
                description="Submit spec → trigger build"
                fields={[
                  { name: "id", placeholder: "cli_01j9x..." },
                  { name: "version", placeholder: "1.0.0  (semver)" },
                ]}
                sampleResponse={VERSION_RESPONSE}
              />
              <ApiExplorer
                method="GET"
                endpoint="/v1/clis/:id/versions/:version"
                description="Get build status + artifact URLs"
                fields={[
                  { name: "id", placeholder: "cli_01j9x..." },
                  { name: "version", placeholder: "1.0.0" },
                ]}
                sampleResponse={VERSION_RESPONSE}
              />
              <ApiExplorer
                method="POST"
                endpoint="/v1/clis/:id/versions/:version/publish"
                description="Set as current version — enables update notifications"
                fields={[
                  { name: "id", placeholder: "cli_01j9x..." },
                  { name: "version", placeholder: "1.0.0" },
                ]}
                sampleResponse={`{ "ok": true, "current_version": "1.0.0" }`}
              />
              <ApiExplorer
                method="POST"
                endpoint="/v1/clis/:id/versions/:version/deprecate"
                description="Mark a version deprecated — users see a warning on next run"
                fields={[
                  { name: "id", placeholder: "cli_01j9x..." },
                  { name: "version", placeholder: "0.9.0" },
                ]}
                sampleResponse={`{ "ok": true, "deprecated_at": "2026-04-19T00:00:00Z" }`}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Version status lifecycle</p>
              <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                {["pending", "→", "building", "→", "ready", "→", "deprecated"].map((s, i) => (
                  <span
                    key={i}
                    className={s === "→" ? "text-muted-foreground" : "px-2 py-1 rounded bg-muted border border-border text-foreground"}
                  >
                    {s}
                  </span>
                ))}
                <span className="text-muted-foreground ml-2">or</span>
                <span className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400">failed</span>
              </div>
            </div>
          </section>

          {/* ── Metrics API ───────────────────────────────────────────────── */}
          <section id="metrics" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Metrics</h2>
              <p className="mt-2 text-muted-foreground">
                Aggregated analytics over your CLI&apos;s telemetry events. All endpoints accept a <code className="text-xs bg-muted px-1.5 py-0.5 rounded">?period=7d|30d|90d</code> query param (default 7d).
              </p>
            </div>

            <div className="space-y-2">
              <ApiExplorer
                method="GET"
                endpoint="/v1/clis/:id/metrics"
                description="Usage overview — invocations, success rate, caller breakdown"
                fields={[{ name: "id", placeholder: "cli_01j9x..." }]}
                sampleResponse={METRICS_RESPONSE}
              />
              <ApiExplorer
                method="GET"
                endpoint="/v1/clis/:id/metrics/commands"
                description="Per-command breakdown — count, error rate, P95 latency"
                fields={[{ name: "id", placeholder: "cli_01j9x..." }]}
                sampleResponse={COMMANDS_RESPONSE}
              />
              <ApiExplorer
                method="GET"
                endpoint="/v1/clis/:id/metrics/errors"
                description="Error code distribution over time"
                fields={[{ name: "id", placeholder: "cli_01j9x..." }]}
                sampleResponse={`{
  "data": [
    { "error_code": "auth_failed",      "count": 82,  "rate": 0.006 },
    { "error_code": "not_found",        "count": 210, "rate": 0.014 },
    { "error_code": "validation_error", "count": 156, "rate": 0.011 }
  ]
}`}
              />
            </div>
          </section>

          {/* ── Telemetry overview ────────────────────────────────────────── */}
          <section id="telemetry-overview" className="scroll-mt-20 space-y-6">
            <div>
              <div className="text-xs text-muted-foreground mb-3">Telemetry</div>
              <h2 className="text-2xl font-bold">How It Works</h2>
              <p className="mt-2 text-muted-foreground">
                Every generated CLI has a telemetry emitter baked in. It fires one event per command invocation — async, non-blocking, and silent on failure. Your users never feel it.
              </p>
            </div>

            <InteractiveTerminal lines={telemetryLines} autoPlay={false} />

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { title: "Non-blocking", desc: "Events fire in a goroutine after the command exits. CLIs never wait for delivery." },
                { title: "At-least-once", desc: "A 3-second flush window on exit ensures events arrive even for fast commands." },
                { title: "Opt-out", desc: "Users set ACME_NO_TELEMETRY=1 to disable entirely. Missing data is expected — not an error." },
                { title: "Token attribution", desc: "The telemetry token baked into each binary maps events back to your CLI automatically." },
              ].map(item => (
                <div key={item.title} className="rounded-lg border border-border p-4 space-y-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Privacy ───────────────────────────────────────────────────── */}
          <section id="privacy" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Privacy Model</h2>
              <p className="mt-2 text-muted-foreground">
                Telemetry is designed to be structurally incapable of capturing sensitive data — not just policy-prohibited.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Flag values", status: "never", desc: "Only flag names are captured (e.g. [\"output\", \"filter\"]). Values like --output=secret are never transmitted." },
                { label: "Base URLs", status: "hashed", desc: "The API base URL is SHA-256 hashed (first 16 chars) so you can distinguish prod vs staging without exposing endpoints." },
                { label: "Session IDs", status: "opaque", desc: "Session IDs come from the agent's own environment (e.g. CLAUDE_CODE). Treated as opaque — never deanonymized." },
                { label: "IP addresses", status: "never", desc: "The ingest endpoint never logs source IPs. No consent required because no PII is captured." },
                { label: "Auth commands", status: "excluded", desc: "configure, login, and logout commands are never wrapped with telemetry. Credentials can't accidentally leak." },
              ].map(item => (
                <div key={item.label} className="flex gap-4 rounded-lg border border-border p-4">
                  <div className="w-28 shrink-0">
                    <code className="text-xs font-mono">{item.label}</code>
                    <div className={`text-xs mt-1 font-medium ${item.status === "never" ? "text-red-400" : item.status === "hashed" ? "text-yellow-400" : item.status === "excluded" ? "text-red-400" : "text-blue-400"}`}>
                      {item.status}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Event Schema ──────────────────────────────────────────────── */}
          <section id="event-schema" className="scroll-mt-20 space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Event Schema</h2>
              <p className="mt-2 text-muted-foreground">
                Every telemetry event has this shape. Fields are set by the runtime — you never construct them manually.
              </p>
            </div>

            <CodeTabs
              tabs={[
                {
                  label: "JSON",
                  language: "json",
                  code: `{
  // Identity
  "cli_id":      "clicreator_tok_...",  // maps to your CLI
  "cli_name":    "acme",
  "cli_version": "1.2.0",

  // Invocation
  "command":     "events list",         // full cobra path
  "caller_type": "agent",               // "human" | "agent" | "ci"
  "agent_type":  "claude_code",         // which AI tool
  "session_id":  "sess_abc123",         // from agent env var

  // Timing
  "timestamp":   "2026-04-19T12:00:00Z",
  "duration_ms": 312,

  // Usage
  "flags_used":     ["output", "filter"],  // names only, never values
  "output_format":  "json",
  "used_jq":        false,
  "used_schema":    false,
  "used_dry_run":   false,

  // Result
  "exit_code":   0,
  "error_code":  "",
  "http_status": 200,

  // Environment
  "base_url_hash": "a3f9c2b1d4e7f8a0"    // SHA-256 of base URL, first 16 chars
}`,
                },
                {
                  label: "Go struct",
                  language: "go",
                  code: `type Event struct {
  CLIID       string    \`json:"cli_id"\`
  CLIName     string    \`json:"cli_name"\`
  CLIVersion  string    \`json:"cli_version"\`

  Command     string    \`json:"command"\`
  CallerType  string    \`json:"caller_type"\`
  AgentType   string    \`json:"agent_type"\`
  SessionID   string    \`json:"session_id"\`

  Timestamp   time.Time \`json:"timestamp"\`
  DurationMS  int64     \`json:"duration_ms"\`

  FlagsUsed    []string \`json:"flags_used"\`
  OutputFormat string   \`json:"output_format"\`
  UsedJQ       bool     \`json:"used_jq"\`
  UsedSchema   bool     \`json:"used_schema"\`
  UsedDryRun   bool     \`json:"used_dry_run"\`

  ExitCode   int    \`json:"exit_code"\`
  ErrorCode  string \`json:"error_code"\`
  HTTPStatus int    \`json:"http_status"\`

  BaseURLHash string \`json:"base_url_hash"\`
}`,
                },
              ]}
            />
          </section>

        </main>
      </div>
    </div>
  )
}
