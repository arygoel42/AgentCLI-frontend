const features = [
  {
    index: "01",
    tag: "jq filtering",
    title: "Transform responses on the fly",
    description:
      "Pipe any command through --jq to filter, reshape, or extract fields inline. Your agent gets exactly the data it needs — nothing more.",
    example: "./stripe customers list --jq '.[] | {id, email}'",
  },
  {
    index: "02",
    tag: "llms.txt + skills.md",
    title: "Built-in agent discoverability",
    description:
      "Every generated CLI ships with llms.txt and skills.md so agents can self-discover your entire API surface without reading docs or trial-and-erroring commands.",
    example: "curl https://your-api.com/llms.txt",
  },
  {
    index: "03",
    tag: "agent mode",
    title: "Compact output, fewer tokens",
    description:
      "Running inside Claude Code, Cursor, or Codex? Output automatically switches to JSONL — one record per line, nulls stripped, same data at ~60% of the token cost.",
    example: "./stripe customers list -o compact",
  },
]

export function Features() {
  return (
    <section className="px-6 py-24 border-t border-border/40">
      <div className="max-w-4xl mx-auto space-y-20">
        {/* Heading */}
        <div className="space-y-3">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            Why api2cli
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
            Build CLIs agents love
          </h2>
        </div>

        {/* Feature rows */}
        <div className="space-y-16">
          {features.map((f) => (
            <div key={f.index} className="grid md:grid-cols-[80px_1fr] gap-6 md:gap-12">
              {/* Index */}
              <div className="text-sm font-mono text-muted-foreground/50 pt-1 select-none">
                {f.index}
              </div>

              {/* Content */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/60">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-xl font-medium tracking-tight">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xl">
                  {f.description}
                </p>
                {/* Example command */}
                <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground bg-secondary/40 border border-border/40 rounded-lg px-4 py-2.5 w-fit">
                  <span className="text-emerald-500/70 select-none">$</span>
                  <span>{f.example}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
