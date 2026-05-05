const STEPS = [
  {
    title: "Paste your spec",
    description:
      "Drop in a docs URL or an OpenAPI file. Studio fetches and parses it in seconds.",
    video: "/step-1-paste-spec.mp4",
  },
  {
    title: "Get a CLI",
    description:
      "Our engine maps every endpoint to commands designed to make agent use ergonomic.",
    video: "/step-3-install.mp4",
  },
  {
    title: "Install with one line",
    description:
      "A GitHub release is created automatically with a one-line install script.",
    video: "/step-2-generated-cli.mp4",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 border-t border-border/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-20">
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--green)" }}>
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
            API docs to production CLI ready for agents.
          </h2>
        </div>

        <div className="relative">
          {/* vertical connector line, hidden on mobile */}
          <div className="hidden md:block absolute left-[27px] top-4 bottom-4 w-px bg-border/60" />

          <div className="space-y-20 md:space-y-28">
            {STEPS.map((step, i) => {
              const imageFirst = i % 2 === 1
              return (
                <div key={step.title} className="relative">
                  <div className="grid md:grid-cols-[56px_1fr] gap-x-6">
                    {/* Step number badge — sits on the connector line */}
                    <div className="hidden md:flex items-start justify-center pt-1">
                      <span
                        className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center font-mono text-sm"
                        style={{
                          color: "var(--green)",
                          borderColor: "var(--green-border)",
                          backgroundColor: "var(--background)",
                          border: "1px solid var(--green-border)",
                          boxShadow: "0 0 0 6px var(--background)",
                        }}
                      >
                        0{i + 1}
                      </span>
                    </div>

                    <div
                      className={`grid md:grid-cols-2 gap-8 md:gap-12 items-center ${
                        imageFirst ? "md:[&>*:first-child]:order-2" : ""
                      }`}
                    >
                      <div className="space-y-3">
                        <span
                          className="md:hidden inline-block text-[10px] font-mono px-2 py-0.5 rounded border"
                          style={{
                            color: "var(--green)",
                            borderColor: "var(--green-border)",
                            backgroundColor: "var(--green-glow)",
                          }}
                        >
                          Step {i + 1}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-medium tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed max-w-md">
                          {step.description}
                        </p>
                      </div>

                      <div className="relative rounded-xl border border-border bg-secondary/20 overflow-hidden shadow-lg">
                        <video
                          src={step.video}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full aspect-[16/10] object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
