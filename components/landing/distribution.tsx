const installLines = [
  { text: "$ brew install myapi", className: "text-zinc-100" },
  { text: "==> Downloading myapi 0.1.0...", className: "text-zinc-500" },
  { text: "==> Installing myapi...", className: "text-zinc-500" },
  { text: "✓  myapi installed", className: "text-emerald-400" },
  { text: "" },
  { text: "$ myapi --version", className: "text-zinc-100" },
  { text: "myapi version 0.1.0 (darwin/arm64)", className: "text-zinc-400" },
]

export function Distribution() {
  return (
    <section className="px-6 py-24 border-t border-border/40">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        {/* Left: copy */}
        <div className="space-y-5">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">
            Distribution
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight leading-snug">
            We handle distribution&nbsp;too
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Every generated CLI comes with a GoReleaser config that builds for
            Linux, macOS, and Windows — x86 and ARM. Push a tag and GitHub
            Actions ships signed binaries, a Homebrew tap, and an install
            script automatically.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Homebrew tap (brew install)",
              "curl | sh install script",
              "Signed binaries for 5 platforms",
              "GitHub Releases with checksums",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-emerald-500/80">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: static terminal */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0c] overflow-hidden shadow-xl shadow-black/50">
          {/* Chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#141414] select-none">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="flex-1 text-center text-xs text-zinc-600 font-mono">bash</span>
          </div>

          {/* Body */}
          <div className="p-5 font-mono text-sm leading-relaxed space-y-0.5">
            {installLines.map((line, i) => (
              <div
                key={i}
                className={line.className ?? "text-zinc-400"}
              >
                {line.text || "\u00a0"}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
