const pillars = [
  {
    title: "Deterministic",
    description: "Same spec in, same CLI out. Fully auditable.",
  },
  {
    title: "Agent-native",
    description: "Self-describing commands. Discoverable via schema.",
  },
  {
    title: "Structured",
    description: "JSON output. JSON errors. No ambiguity.",
  },
]

export function Pillars() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 md:gap-8">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="space-y-3">
            <h3 className="text-xl font-medium text-foreground">
              {pillar.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
