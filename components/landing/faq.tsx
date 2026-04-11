"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const faqs = [
  {
    q: "How is this different from an MCP?",
    a: "MCPs expose tools over a JSON-RPC protocol and typically run as a sidecar process. api2cli generates a standalone binary — no server, no protocol overhead. Agents invoke it like any shell command and get structured JSON back. It composes with pipes, works in CI, and doesn't inflate your token budget.",
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
    a: "Run ./mycli --schema and the CLI emits a machine-readable JSON document describing every command group, flag, auth scheme, and output format. Agents read this once, cache it, and never need to trial-and-error. There's also --usage per-command for inline introspection.",
  },
  {
    q: "Can I customize the generated CLI?",
    a: "The generator is template-based and deterministic — same spec in, same code out. You can fork the generated project and edit it freely. For common customizations (renaming commands, hiding operations) we're building x-cli extensions into the spec directly so customizations survive regeneration.",
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
            "shrink-0 text-muted-foreground transition-transform duration-200 select-none text-lg leading-none",
            open && "rotate-45"
          )}
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
    <section className="px-6 py-24 border-t border-border/40">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="space-y-3">
          <p className="text-xs tracking-widest uppercase text-muted-foreground">FAQ</p>
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
