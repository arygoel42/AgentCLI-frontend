import { FileText, Cpu, Rocket } from "lucide-react"

const STEPS = [
  {
    icon: FileText,
    title: "Paste your spec",
    description: "Paste a URL or drop an OpenAPI file.",
  },
  {
    icon: Cpu,
    title: "Get a CLI",
    description:
      "Our engine maps every endpoint to commands designed to make agent use ergonomic.",
  },
  {
    icon: Rocket,
    title: "Install with one line",
    description:
      "A GitHub release is created automatically with a one-line install script.",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-24 border-t border-border/40">
      <div className="max-w-5xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--green)" }}>
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
            API docs to production CLI ready for agents.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 relative">
          {/* connector lines on md+ */}
          <div className="hidden md:block absolute top-10 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px bg-border/60" />

          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-xl border border-border bg-secondary/20 p-6 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border"
                  style={{
                    color: "var(--green)",
                    borderColor: "var(--green-border)",
                    backgroundColor: "var(--green-glow)",
                  }}
                >
                  Step {i + 1}
                </span>
              </div>

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--green-glow)", border: "1px solid var(--green-border)" }}
              >
                <step.icon className="w-5 h-5" style={{ color: "var(--green)" }} />
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
