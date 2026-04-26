const features = [
  {
    tag: "jq filtering",
    title: "Transform responses on the fly",
    description:
      "Pipe any command through --jq to filter, reshape, or extract fields inline. Your agent gets exactly the data it needs — nothing more.",
    example: "./stripe customers list --jq '.[] | {id, email}'",
    agent: false,
  },
  {
    tag: "llms.txt + skills.md",
    title: "Built-in agent discoverability",
    description:
      "Every generated CLI ships with llms.txt and skills.md so agents can self-discover your entire API surface without reading docs or trial-and-erroring.",
    example: "curl https://your-api.com/llms.txt",
    agent: true,
  },
  {
    tag: "agent mode",
    title: "Compact output, fewer tokens",
    description:
      "Inside Claude Code, Cursor, or Codex, output switches to JSONL — one record per line, nulls stripped, ~60% the token cost.",
    example: "./stripe customers list -o compact",
    agent: true,
  },
  {
    tag: "--schema",
    title: "Self-describing surface",
    description:
      "A single --schema call returns every command, flag, auth scheme, and output format. Agents read it once and never trial-and-error again.",
    example: "./stripe --schema",
    agent: true,
  },
  {
    tag: "--dry-run",
    title: "Safe by default",
    description:
      "Preview the exact request an agent is about to make — method, URL, headers (redacted), and body — before any side effect leaves the machine.",
    example: "./stripe --dry-run customers create",
    agent: true,
  },
  {
    tag: "static binary",
    title: "No runtime, no protocol",
    description:
      "The output is a single Go binary. No sidecar, no MCP server, no SDK to install. Drops into CI, Docker, or an agent's tool list with one line.",
    example: "go build ./cmd/stripe",
    agent: false,
  },
]

export function Features() {
  return (
    <section className="px-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Everything an agent needs, in the binary itself.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.tag}
              className="group relative rounded-xl border border-border/50 bg-secondary/20 p-6 flex flex-col gap-4 transition-colors hover:border-border hover:bg-secondary/40"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-md"
                  style={{
                    color: "var(--green)",
                    backgroundColor: "var(--green-glow)",
                    border: "1px solid var(--green-border)",
                  }}
                >
                  {f.tag}
                </span>
                {f.agent && (
                  <span
                    className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ color: "var(--green)", opacity: 0.7 }}
                  >
                    agent
                  </span>
                )}
              </div>

              <h3 className="text-lg font-medium tracking-tight">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                {f.description}
              </p>

              <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground bg-background/60 border border-border/40 rounded-md px-3 py-2 overflow-x-auto">
                <span className="select-none shrink-0" style={{ color: "var(--green)" }}>
                  $
                </span>
                <span className="whitespace-nowrap">{f.example}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
