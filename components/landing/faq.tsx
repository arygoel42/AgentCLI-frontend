"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "How is this different from an MCP?",
    a: "MCPs use an agent loop — one tool call, one round-trip. A CLI lets your agent write a shell script: chain commands with pipes, fan out with xargs, filter with jq, all in one shot. It's a real binary your agent uses at the terminal, the same way a developer would.",
  },
  {
    q: "Do I need to write any code?",
    a: "No. You point the generator at your OpenAPI spec and it emits a complete Go project — commands, flags, auth, pagination, output formatting — all from the spec. The only thing you configure is the CLI name, env-var prefix, and Go module path.",
  },
  {
    q: "What OpenAPI versions are supported?",
    a: "OpenAPI 3.0 and 3.1. JSON and YAML. The parser resolves $ref chains, handles circular references, and validates the spec before generating anything.",
  },
  {
    q: "How do agents discover what commands exist?",
    a: "Run mycli --help for a full list of groups and subcommands. For machine-readable introspection, mycli --scheme emits a JSON document covering every command, flag, and expected output — no trial and error.",
  },
  {
    q: "Can I customize the generated CLI?",
    a: "Customizations live in clicreator.yml — rename commands, hide operations, set an env-var prefix. When your API changes, update the spec, bump the version, and petl publishes a new GitHub release. Your users get the update with a single command.",
  },
  {
    q: "What authentication schemes are supported?",
    a: "API key (header and query param) and HTTP Bearer. OAuth flows are planned for v2. Credentials resolve from CLI flags, environment variables, and a config file in that order of precedence.",
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-border/60">
      <button
        className="w-full flex items-center justify-between gap-6 py-5 text-left group"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-medium text-foreground group-hover:text-foreground/80 transition-colors">
          {q}
        </span>
        <span
          className={cn(
            "shrink-0 transition-transform duration-200 select-none text-lg leading-none",
            open && "rotate-45"
          )}
          style={{ color: open ? "var(--green)" : undefined }}
        >
          +
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-96 pb-5" : "max-h-0"
        )}
      >
        <p className="text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export function Faq() {
  return (
    <section id="faq" className="px-6 py-24 border-t border-border/40">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="space-y-3">
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--green)" }}>FAQ</p>
          <h2 className="text-3xl md:text-4xl font-medium tracking-tight">
            Common questions
          </h2>
        </div>
        <div>
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
