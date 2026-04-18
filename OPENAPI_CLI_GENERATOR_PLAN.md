# openapi-cli-gen: Agent-First CLI Generator from OpenAPI Specs

## Project Overview

Build an open-source, deterministic, template-based CLI generator that takes an OpenAPI specification and produces a standalone, branded Go CLI binary. The generated CLI wraps a generic HTTP runtime and is purpose-built for consumption by AI agents (Claude Code, Cursor, Codex, etc.) while remaining usable by humans.

**This is NOT an SDK generator.** The generated CLI makes HTTP calls directly through a shared Go runtime library — no intermediate typed SDK. The runtime handles auth, retries, pagination, error handling, and output formatting generically.

**The generation pipeline is 100% deterministic.** Same spec in → same code out, every time. No LLMs in the generation path. Templates + spec metadata = generated source code.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   openapi-cli-gen                    │
│                  (the generator)                     │
│                                                      │
│  ┌──────────┐   ┌──────────┐   ┌─────────────────┐  │
│  │  Parser   │──▶│    IR    │──▶│  Go Templates   │  │
│  │(OpenAPI)  │   │(internal │   │ (text/template)  │  │
│  │          │   │  model)  │   │                  │  │
│  └──────────┘   └──────────┘   └────────┬─────────┘  │
│                                          │           │
└──────────────────────────────────────────┼───────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │   Generated CLI Project  │
                              │                          │
                              │  cmd/myapi/main.go       │
                              │  commands/              │
                              │    root.go               │
                              │    users_list.go         │
                              │    users_create.go       │
                              │    ...                   │
                              │  go.mod (imports runtime)│
                              └─────────┬───────────────┘
                                        │
                                        │ imports
                                        ▼
                              ┌─────────────────────────┐
                              │   Runtime Library        │
                              │   (shared Go module)     │
                              │                          │
                              │  httpclient/  (requests, │
                              │    retries, auth)        │
                              │  output/  (json, compact,│
                              │    table, agent mode)    │
                              │  config/  (env vars,     │
                              │    config file, keychain)│
                              │  flags/  (flag parsing,  │
                              │    request building)     │
                              │  schema/  (--usage       │
                              │    emission)             │
                              └─────────────────────────┘
```

**Two Go modules in one monorepo:**

1. `openapi-cli-gen` — the generator binary (reads spec, emits Go project)
2. `runtime` — shared library imported by every generated CLI

---

## Tech Stack Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Generator language | Go | Same language as output. Develop/test runtime directly. One codebase. |
| CLI framework (generated output) | Cobra | Industry standard (kubectl, docker, gh). Subcommand trees, flag parsing, completions, help generation all built in. |
| OpenAPI parser | `libopenapi` (pb33f) | Most actively maintained Go OpenAPI 3.0/3.1 parser. Handles $ref resolution, circular refs, full spec model. Alternative: `kin-openapi`. |
| Template engine | Go `text/template` | Standard library. No external deps. Sufficient for Go codegen. |
| Config in generated CLIs | Viper | Standard companion to Cobra. File-based config, env var binding, precedence ordering. |
| Build/distribution of generated CLIs | GoReleaser | Cross-platform binary builds, checksums, GitHub releases. Include config in generated project. |

---

## Implementation Plan

Work through these phases sequentially. Each phase produces testable, working output.

---

### Phase 1: Project Scaffolding & OpenAPI Parser

**Goal:** Read any OpenAPI 3.0/3.1 spec and produce a clean internal representation (IR) of all operations, parameters, schemas, and auth schemes.

**Tasks:**

1. Initialize the monorepo structure:
   ```
   openapi-cli-gen/
   ├── cmd/
   │   └── openapi-cli-gen/
   │       └── main.go          # Generator entrypoint
   ├── internal/
   │   ├── parser/              # OpenAPI spec parsing
   │   │   ├── parser.go        # Main parse function
   │   │   └── parser_test.go
   │   ├── ir/                  # Internal representation types
   │   │   └── types.go
   │   ├── generator/           # Template execution & file emission
   │   │   ├── generator.go
   │   │   └── templates/       # Go text/template files
   │   └── naming/              # Name transformation utilities
   │       ├── naming.go        # Stutter removal, case conversion
   │       └── naming_test.go
   ├── runtime/                 # Shared runtime module (separate go.mod)
   │   ├── go.mod
   │   ├── httpclient/
   │   ├── output/
   │   ├── config/
   │   ├── flags/
   │   └── schema/
   ├── testdata/                # Sample OpenAPI specs for testing
   │   ├── petstore.yaml
   │   └── complex-api.yaml
   ├── go.mod
   ├── go.sum
   └── README.md
   ```

2. Implement the OpenAPI parser using `libopenapi`:
   - Read YAML/JSON spec files
   - Resolve all `$ref` references
   - Validate the spec is well-formed (fail early with clear errors)
   - Extract into the IR (see below)

3. Define the IR types in `internal/ir/types.go`:

   ```go
   // API is the top-level IR for a parsed OpenAPI spec.
   type API struct {
       Name        string          // From info.title, sanitized
       Version     string          // From info.version
       Description string          // From info.description
       BaseURL     string          // From servers[0].url
       Auth        []AuthScheme    // From securitySchemes
       Groups      []CommandGroup  // Operations grouped by tag
   }

   // CommandGroup maps to an OpenAPI tag → CLI subcommand namespace.
   type CommandGroup struct {
       Name        string     // Tag name, sanitized to CLI-friendly form
       Description string     // Tag description
       Commands    []Command  // Operations under this tag
   }

   // Command maps to a single OpenAPI operation → CLI command.
   type Command struct {
       Name          string      // Derived from operationId, stutter-removed
       Description   string      // From operation summary/description
       HTTPMethod    string      // GET, POST, PUT, DELETE, PATCH
       Path          string      // URL path template e.g. /users/{id}
       Parameters    []Parameter // Path, query, header params as CLI flags
       RequestBody   *RequestBody
       Responses     []Response
       RequiresAuth  bool
       Pagination    *PaginationConfig // nil if not paginated
   }

   // Parameter maps to a CLI flag.
   type Parameter struct {
       Name        string    // Flag name (kebab-case)
       OrigName    string    // Original name in spec (for request building)
       Location    string    // "path", "query", "header"
       Type        string    // "string", "integer", "number", "boolean", "array"
       Format      string    // OpenAPI format hint: "date-time", "email", "uuid", etc.
       Required    bool
       Default     any
       Description string
       Enum        []string  // Allowed values, if constrained
   }

   // RequestBody represents the operation's request body.
   type RequestBody struct {
       ContentType string       // "application/json", "multipart/form-data", etc.
       Required    bool
       Fields      []Parameter  // Flattened top-level fields as flags
       HasNesting  bool         // If true, nested objects exist — user should use --body
   }

   // Response represents a possible response.
   type Response struct {
       StatusCode  string  // "200", "201", "4XX", etc.
       ContentType string
       Description string
       IsBinary    bool    // If true, needs --output-file handling
       IsStream    bool    // SSE or JSONL
   }

   // AuthScheme represents a security scheme.
   type AuthScheme struct {
       Type     string // "apiKey", "http-bearer", "http-basic"
       Name     string // Header/query param name for apiKey
       Location string // "header", "query" for apiKey
       EnvVar   string // Generated env var name e.g. MYAPI_API_KEY
   }

   // PaginationConfig describes how to auto-paginate.
   type PaginationConfig struct {
       Style         string // "cursor", "offset", "page"
       InputParam    string // Query param name: "cursor", "offset", "page"
       ResponseField string // JSON path to next cursor/token in response
       ItemsField    string // JSON path to the array of results
   }
   ```

4. Implement naming utilities in `internal/naming/`:
   - `ToKebabCase(s string) string` — convert operationId to CLI flag/command style: `listUsers` → `list-users`
   - `ToCamelCase(s string) string` — for Go identifiers
   - `RemoveStutter(group, name string) string` — `users` + `list-users` → `list`. Also handle: `users` + `users-list` → `list`, `users` + `getUser` → `get`
   - `SanitizeCommandName(s string) string` — strip non-alphanumeric, lowercase
   - `ToEnvVar(prefix, name string) string` — `MYAPI` + `api-key` → `MYAPI_API_KEY`

5. Write parser tests against:
   - The standard Petstore spec (covers basic CRUD, path params, query params, API key auth)
   - A more complex spec you create in `testdata/` that covers: nested request bodies, multiple auth schemes, pagination, binary responses, array query params, enums
   - Edge cases: operations with no tags (assign to a "default" group), operations with no operationId (generate from method + path), empty descriptions

**Acceptance criteria for Phase 1:**
- `go test ./internal/parser/...` passes for all test specs
- `go test ./internal/naming/...` passes with comprehensive case coverage
- Running the parser on any valid 3.0/3.1 spec produces a complete IR without panics
- Invalid specs produce clear error messages pointing to the problem

---

### Phase 2: Runtime Library — HTTP Client & Output Formatting

**Goal:** Build the shared runtime module that every generated CLI imports. This is the core of the project — all the "smart" behavior lives here.

**Tasks:**

1. **HTTP Client (`runtime/httpclient/`):**

   ```go
   // Client is the generic HTTP client used by all generated CLI commands.
   type Client struct {
       BaseURL    string
       Auth       AuthProvider
       Headers    map[string]string
       Timeout    time.Duration
       RetryConfig *RetryConfig
       Debug      bool
       DryRun     bool
   }

   // Request represents a generic API request built from CLI flags.
   type Request struct {
       Method      string
       Path        string            // With path params already substituted
       QueryParams map[string]string
       Headers     map[string]string
       Body        any               // Will be JSON-serialized
       ContentType string
   }

   // Response wraps the HTTP response with convenience methods.
   type Response struct {
       StatusCode int
       Headers    http.Header
       Body       []byte
       IsJSON     bool
   }
   ```

   Implement:
   - `Client.Do(req *Request) (*Response, error)` — the core method
   - Path parameter substitution: `/users/{id}` + `id=123` → `/users/123`
   - Query parameter encoding (handle arrays as `?tag=a&tag=b`)
   - JSON body serialization
   - Auth injection (add header/query param based on AuthProvider)
   - Timeout handling
   - **Retry logic:** On 429 and 5xx, exponential backoff with jitter. Respect `Retry-After` header. Configurable max retries and max elapsed time. Controllable via `--no-retries`, `--retry-max-elapsed-time` flags.
   - **Dry-run mode:** When enabled, build the full request but don't send it. Return a synthetic response containing the request details (method, URL, headers with secrets redacted, body).
   - **Debug mode:** Log request/response details to stderr. Auto-redact `Authorization`, `X-Api-Key`, and any header containing `secret`, `token`, or `key` (case insensitive).

2. **Output Formatting (`runtime/output/`):**

   Implement output formatters, selectable via `--output-format` / `-o` flag:

   - `json` — full JSON response body, pretty-printed when TTY, compact when piped
   - `compact` — JSONL-style, one logical record per line. For array responses, emit one JSON object per line. For single objects, emit on one line. Optimized for agent token efficiency.
   - `table` — columnar output for array responses. Auto-detect columns from first item's keys. Truncate long values.
   - `pretty` — human-friendly colored output with headers and formatting. Default when TTY detected and not in agent mode.

   Also implement:
   - `--jq` flag support: embed a jq evaluator (use `itchyny/gojq` library) to filter/transform output before formatting
   - `--include-headers` flag: prepend response headers to output
   - `--output-file` flag: write response body (especially binary) to a file
   - Binary response detection: if Content-Type is not JSON/text, block raw terminal output and instruct user to use `--output-file`

3. **Agent Mode Detection (`runtime/output/agentmode.go`):**

   ```go
   // DetectAgentMode checks for known AI agent environment signals.
   func DetectAgentMode() bool {
       agentEnvVars := []string{
           "CLAUDE_CODE",          // Claude Code
           "CURSOR_SESSION_ID",    // Cursor
           "CODEX",                // OpenAI Codex CLI
           "AIDER",                // Aider
           "CLINE",                // Cline
           "WINDSURF_SESSION",     // Windsurf
           "GITHUB_COPILOT",       // GitHub Copilot
           "AMAZON_Q_SESSION",     // Amazon Q
           "GEMINI_CODE_ASSIST",   // Gemini Code Assist
           "CODY",                 // Sourcegraph Cody
       }
       for _, env := range agentEnvVars {
           if os.Getenv(env) != "" {
               return true
           }
       }
       return false
   }
   ```

   When agent mode is active:
   - Default output format switches to `compact`
   - All errors become structured JSON to stderr
   - No colors, no spinners, no interactive prompts
   - `--usage` schema is always available

4. **Structured Errors (`runtime/output/errors.go`):**

   ```go
   type CLIError struct {
       Error      bool   `json:"error"`
       Code       string `json:"code"`        // Machine-readable: "auth_failed", "not_found", "validation_error", "rate_limited", "server_error"
       Status     int    `json:"status"`       // HTTP status code
       Message    string `json:"message"`      // Human-readable description
       Suggestion string `json:"suggestion"`   // Actionable next step
       Details    any    `json:"details,omitempty"` // Validation errors, etc.
   }
   ```

   Map HTTP status codes to error codes:
   - 401 → `auth_failed`, suggestion: "Run '<cli> configure' or set <PREFIX>_API_KEY"
   - 403 → `forbidden`, suggestion: "Check API key permissions"
   - 404 → `not_found`
   - 422 → `validation_error`, include response body in details
   - 429 → `rate_limited`, include retry-after if present
   - 5xx → `server_error`, suggestion: "Retry the request or check API status page"

5. **Config & Auth (`runtime/config/`):**

   Implement credential resolution with this precedence (highest to lowest):
   1. CLI flags (`--api-key`, `--bearer-token`)
   2. Environment variables (`<PREFIX>_API_KEY`, `<PREFIX>_BEARER_TOKEN`)
   3. Config file (`~/.config/<cliName>/config.yaml` via Viper)

   Skip OS keychain for v1 — env vars and config files are sufficient and simpler. Keychain can be added later.

   The config file also stores:
   - Default base URL (for APIs with multiple environments: prod, staging, dev)
   - Default output format preference

**Acceptance criteria for Phase 2:**
- `go test ./runtime/...` passes with high coverage
- HTTP client correctly retries 429/5xx with backoff
- Dry-run mode produces correct request representation with redacted secrets
- All four output formats produce correct output for: single JSON objects, JSON arrays, nested objects, binary responses
- Agent mode auto-detects correctly when env vars are set
- Structured errors are valid JSON with correct codes for each HTTP status
- Config precedence works correctly (flag overrides env overrides file)

---

### Phase 3: Code Generator — Templates & File Emission

**Goal:** Take the IR from Phase 1 and emit a complete, buildable Go project that imports the runtime from Phase 2.

**Tasks:**

1. **Define the generator config** (user provides this when running the generator):

   ```go
   type GeneratorConfig struct {
       SpecPath     string // Path to OpenAPI spec
       OutputDir    string // Where to write the generated project
       ModulePath   string // Go module path: "github.com/acme/myapi-cli"
       CLIName      string // Binary name: "myapi"
       EnvVarPrefix string // Env var prefix: "MYAPI"
       Version      string // Initial version: "0.1.0"
   }
   ```

2. **Create Go templates** in `internal/generator/templates/`:

   - `main.go.tmpl` — Binary entrypoint. Initializes Cobra root command, adds all command groups.
   - `root.go.tmpl` — Root command with global flags: `--output-format`, `--agent-mode`, `--debug`, `--dry-run`, `--no-retries`, `--timeout`, `--jq`, `--include-headers`, `--api-key`/auth flags. Also registers `--usage` and `--schema` flags.
   - `group.go.tmpl` — One file per tag/command group. Defines the parent command (e.g., `usersCmd`) and adds child commands.
   - `command.go.tmpl` — One file per operation. Defines the Cobra command, registers flags from IR parameters, implements the `Run` function that: reads flags → builds runtime.Request → calls client.Do → formats output.
   - `configure.go.tmpl` — The `configure` command for interactive auth/config setup.
   - `go.mod.tmpl` — Module file importing the runtime library.
   - `goreleaser.yaml.tmpl` — GoReleaser config for cross-platform builds.
   - `README.md.tmpl` — Generated README with usage examples for every command.

3. **Implement the `command.go.tmpl` carefully** — this is the most complex template. For each operation, it must:

   - Register a flag for each parameter (using correct Cobra flag type: `StringVar`, `IntVar`, `BoolVar`, `StringSliceVar`)
   - Register `--body` flag (string, for raw JSON input)
   - In the Run function:
     a. Check for stdin JSON input (if stdin is not a TTY and --body not provided)
     b. Parse --body JSON if provided
     c. Read individual flags and overlay onto the body (flags take precedence)
     d. Validate required fields are present
     e. Build `runtime.Request` (substitute path params, set query params, set headers, set body)
     f. Call `client.Do(request)`
     g. Handle errors (emit structured CLIError)
     h. Format and print output

4. **Implement the generator orchestrator** (`internal/generator/generator.go`):

   ```go
   func Generate(ir *ir.API, config *GeneratorConfig) error {
       // 1. Create output directory structure
       // 2. Execute each template with IR data
       // 3. Write files
       // 4. Run gofmt on all generated .go files
       // 5. Run goimports to fix imports
       // 6. Verify: run "go build" on the generated project as a sanity check
       return nil
   }
   ```

5. **Implement the CLI for the generator itself:**

   ```
   openapi-cli-gen generate \
     --spec ./openapi.yaml \
     --output ./generated-cli \
     --module github.com/acme/myapi-cli \
     --name myapi \
     --env-prefix MYAPI
   ```

**Acceptance criteria for Phase 3:**
- Running the generator against the Petstore spec produces a Go project that compiles with zero errors
- The generated CLI's `--help` correctly lists all command groups and commands
- Every command has correct flags matching the spec's parameters
- `go build` succeeds on the generated project
- The generated project has a valid `go.mod` importing the runtime module

---

### Phase 4: Agent-Specific Features

**Goal:** Implement the features that differentiate this from a generic CLI generator.

**Tasks:**

1. **Machine-readable usage schema (`--usage` and `--schema`):**

   `myapi users create --usage` emits:
   ```json
   {
     "command": "users create",
     "method": "POST",
     "path": "/users",
     "flags": [
       {"name": "name", "type": "string", "required": true, "description": "User display name"},
       {"name": "email", "type": "string", "required": true, "format": "email"},
       {"name": "role", "type": "string", "required": false, "enum": ["admin", "member"], "default": "member"}
     ],
     "accepts_body": true,
     "accepts_stdin": true,
     "auth_required": true,
     "output_formats": ["json", "compact", "table", "pretty"]
   }
   ```

   `myapi --schema` emits the full command tree:
   ```json
   {
     "name": "myapi",
     "version": "0.1.0",
     "auth_schemes": [{"type": "apiKey", "env_var": "MYAPI_API_KEY", "header": "X-Api-Key"}],
     "commands": [
       {
         "group": "users",
         "commands": [
           {"name": "list", "method": "GET", "path": "/users", "flags": [...]},
           {"name": "create", "method": "POST", "path": "/users", "flags": [...]}
         ]
       }
     ]
   }
   ```

   This is the discovery mechanism for agents. An agent reads `--schema` once, caches the output, and knows every available command and its interface without trial-and-error.

2. **Compact output format optimization:**

   Design the compact format for minimal token usage:
   - Array responses: one JSON object per line (JSONL), no wrapping array brackets
   - Single objects: one line
   - Strip null fields
   - Shorten long string values beyond 200 chars with truncation marker
   - Include a `_meta` line at the end with pagination info if applicable:
     `{"_meta": {"total": 142, "page": 1, "has_more": true}}`

3. **Pagination support in generated commands:**

   When the IR marks an operation as paginated, the generated command template adds:
   - `--all` flag: auto-paginate through all pages, streaming results
   - `--max-pages` flag: limit the number of pages fetched
   - When `--all` is used with compact output, each page's items are emitted as they arrive (streaming, not buffered)

   Pagination detection heuristics during parsing (Phase 1 enhancement):
   - Look for common pagination patterns: `cursor`/`next_cursor`, `offset`/`limit`, `page`/`per_page` in query params + response schema
   - Support explicit config via `x-pagination` extension in the spec (for API providers who want to be explicit)

4. **Stdin JSON input handling:**

   In the generated command's Run function:
   ```go
   // If stdin is not a TTY and --body flag not set, read stdin as JSON body
   if !term.IsTerminal(int(os.Stdin.Fd())) && bodyFlag == "" {
       stdinBytes, err := io.ReadAll(os.Stdin)
       if err == nil && len(stdinBytes) > 0 {
           bodyJSON = stdinBytes
       }
   }
   ```

   This enables: `echo '{"name":"Alice"}' | myapi users create`
   And piping between commands: `myapi users get --id 123 --jq '.team_id' | xargs -I{} myapi teams get --id {}`

5. **`--dry-run` output format:**

   ```json
   {
     "dry_run": true,
     "request": {
       "method": "POST",
       "url": "https://api.example.com/users",
       "headers": {
         "Authorization": "[REDACTED]",
         "Content-Type": "application/json"
       },
       "body": {"name": "Alice", "email": "alice@example.com"}
     }
   }
   ```

**Acceptance criteria for Phase 4:**
- `--schema` emits valid JSON describing the full CLI interface
- `--usage` per-command emits valid JSON describing that command's interface
- Compact output uses fewer tokens than JSON output for the same data (measure on sample responses)
- Pagination works end-to-end with `--all` against a paginated mock API
- Stdin piping works: `echo '{"name":"Alice"}' | myapi users create` produces correct request
- `--dry-run` emits valid JSON with secrets redacted

---

### Phase 5: End-to-End Testing & Polish

**Goal:** Validate the entire pipeline against real-world specs and make it robust.

**Tasks:**

1. **Test against real-world OpenAPI specs:**
   - Petstore (simple, standard)
   - GitHub API (complex, many operations, nested paths)
   - Stripe API (complex auth, pagination, nested objects)
   - A spec with minimal info (no descriptions, no operationIds) — verify graceful degradation

2. **Generated README quality:**
   - The generated README should include: installation instructions, auth setup (env vars), example commands for every operation, output format examples
   - An agent reading the README should be able to use the CLI without `--schema`

3. **GoReleaser integration:**
   - Generated project includes `.goreleaser.yaml` that builds for: linux/amd64, linux/arm64, darwin/amd64, darwin/arm64, windows/amd64
   - Include install scripts (shell for unix, PowerShell for windows) in generated project

4. **Error handling hardening:**
   - Malformed specs produce clear error messages with line numbers
   - Network errors (DNS failure, connection refused, TLS errors) produce structured errors with suggestions
   - Invalid flag combinations produce clear errors before making any HTTP call
   - Ctrl+C during pagination cleanly outputs what was received so far

5. **CI setup for the generator itself:**
   - GitHub Actions workflow: lint, test, build
   - Integration test that runs the full pipeline: parse spec → generate project → build generated project → run commands against a mock server → validate output

---

## Non-Goals for v1

These are explicitly out of scope for the initial release. They can be added later:

- **Interactive mode / TUI explorer** — agents don't need it, humans can use `--help`
- **Shell completions** — nice-to-have, not essential for agent use
- **OAuth2 flows** — start with API key and bearer token. OAuth adds significant complexity.
- **OS keychain storage** — env vars and config files are sufficient
- **Streaming endpoints (SSE/JSONL)** — add in v2
- **Binary/file upload requests** — add in v2
- **OpenAPI extensions for customization** (x-cli-name, etc.) — add when real users ask for it
- **MCP server generation** — potential future direction, separate project
- **Approach B runtime interpreter mode** — not building this; going straight to codegen

---

## Key Design Principles

1. **Agent-first, human-compatible.** Every design decision should optimize for agent consumption first. Human UX is a secondary concern — it should work, but agent ergonomics win when there's a tradeoff.

2. **Deterministic always.** Same spec → same output. Generated code goes into version control. Diffs should be meaningful and minimal when the spec changes.

3. **Thin generated code, thick runtime.** Keep generated per-command files as thin as possible. All complex logic (retries, pagination, output formatting, error handling) lives in the shared runtime module. This means bugs get fixed once, and generated CLIs get the fix by updating the runtime dependency.

4. **Structured everything.** In agent mode: structured output, structured errors, structured usage schemas. Agents should never need to parse prose.

5. **Explicit over clever.** Don't infer too much. If the spec says it, emit it. If the spec doesn't say it, don't guess. The generated CLI should be a faithful, predictable representation of the API.

---

## Sample Workflow (What Success Looks Like)

```bash
# API provider generates a CLI from their spec
openapi-cli-gen generate \
  --spec ./openapi.yaml \
  --output ./myapi-cli \
  --module github.com/acme/myapi-cli \
  --name myapi \
  --env-prefix MYAPI

# Build it
cd myapi-cli
go build -o myapi ./cmd/myapi

# Agent discovers the CLI interface
./myapi --schema

# Agent sets auth
export MYAPI_API_KEY="sk-..."

# Agent uses the CLI
./myapi users create --body '{"name": "Alice", "email": "alice@acme.com"}' -o compact

# Agent checks before executing
./myapi users delete --id user_123 --dry-run

# Agent paginates through all results
./myapi users list --all -o compact

# Agent handles errors gracefully (gets structured JSON error)
./myapi users get --id nonexistent
# {"error":true,"code":"not_found","status":404,"message":"User not found","suggestion":"Verify the user ID exists"}
```
