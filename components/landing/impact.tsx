const STATS = [
  {
    value: "< 5 min",
    label: "From spec to shipped binary",
  },
  {
    value: "0 lines",
    label: "Of code you have to write",
  },
  {
    value: "10×",
    label: "Faster than building a CLI from scratch",
  },
  {
    value: "5",
    label: "Platforms compiled automatically",
  },
]

export function Impact() {
  return (
    <section className="px-6 py-24 border-t border-border/40">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--green)" }}>
            Impact
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
            The numbers speak for themselves.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-3 text-center">
              <span
                className="text-5xl md:text-6xl font-bold tracking-tight font-mono"
                style={{ color: "var(--green)" }}
              >
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground leading-snug max-w-[130px]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
