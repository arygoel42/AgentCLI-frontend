"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface OutputLine {
  text: string
  className?: string
}

interface Feature {
  tag: string
  title: string
  description: string
  command: string
  output: OutputLine[]
}

const FEATURES: Feature[] = [
  {
    tag: "llms.txt",
    title: "Built-in agent discoverability",
    description:
      "Every generated CLI ships with llms.txt and skills.md so agents can self-discover your entire API surface without reading docs or trial-and-erroring.",
    command: "./acme --help",
    output: [
      { text: "acme  v0.2.1  ·  Acme Payments API", className: "text-zinc-200" },
      { text: "" },
      { text: "GROUPS", className: "text-zinc-500" },
      { text: "  customers    create, list, retrieve, update, delete", className: "text-zinc-300" },
      { text: "  charges      create, capture, refund, list", className: "text-zinc-300" },
      { text: "  products     list, retrieve, create, archive", className: "text-zinc-300" },
      { text: "  invoices     draft, finalize, pay, void, list", className: "text-zinc-300" },
      { text: "  webhooks     create, list, delete, inspect", className: "text-zinc-300" },
      { text: "" },
      { text: "FLAGS", className: "text-zinc-500" },
      { text: "  -o compact     JSONL output, ~60% fewer tokens", className: "text-zinc-400" },
      { text: "  --jq <expr>    filter response inline", className: "text-zinc-400" },
      { text: "  --dry-run      preview request, no side-effects", className: "text-zinc-400" },
      { text: "  --scheme       machine-readable command + flag schema", className: "text-zinc-400" },
      { text: "" },
      { text: "Run 'acme <group> --help' for per-group commands.", className: "text-zinc-600" },
    ],
  },
  {
    tag: "feedback",
    title: "Agents report gaps back to you",
    description:
      "A built-in feedback command lets agents flag missing operations, confusing flags, or broken auth right from the terminal. Routed to your dashboard so you know exactly what to ship next.",
    command: './acme feedback "invoices list needs --status filter, can\'t tell draft from paid"',
    output: [
      { text: "  ✓  logged   fb_3Rx9", className: "text-emerald-400" },
      { text: "" },
      { text: "  snapshot:", className: "text-zinc-500" },
      { text: '    version:       "0.2.1"', className: "text-zinc-400" },
      { text: '    last_command:  "acme invoices list --limit 50"', className: "text-zinc-400" },
      { text: '    agent:         "claude-code"', className: "text-zinc-400" },
      { text: '    session:       "sess_8fKm2"', className: "text-zinc-400" },
      { text: "" },
      { text: "  → routed to acme dashboard", className: "text-zinc-500" },
    ],
  },
  {
    tag: "-o compact",
    title: "Compact output, fewer tokens",
    description:
      "Inside Claude Code, Cursor, or Codex, output switches to JSONL — one record per line, nulls stripped, ~60% the token cost of pretty JSON.",
    command: "./acme customers list -o compact --limit 3",
    output: [
      {
        text: '{"id":"cus_Nk2M","email":"alice@acme.com","name":"Alice Rivera","created":"2026-03-15"}',
        className: "text-emerald-300",
      },
      {
        text: '{"id":"cus_Pq8X","email":"bob@acme.com","name":"Bob Chen","created":"2026-03-12"}',
        className: "text-emerald-300",
      },
      {
        text: '{"id":"cus_Rt4Z","email":"carol@acme.com","name":"Carol Singh","created":"2026-03-09"}',
        className: "text-emerald-300",
      },
      {
        text: '{"_meta":{"total":142,"has_more":true,"next_cursor":"cus_Rt4Z"}}',
        className: "text-zinc-500",
      },
      { text: "" },
      { text: "  tokens: 142   (default pretty: 387, -58%)", className: "text-zinc-600" },
    ],
  },
  {
    tag: "--jq",
    title: "Transform responses on the fly",
    description:
      "Pipe any command through --jq to filter, reshape, or extract fields inline. Your agent gets exactly the data it needs — nothing more.",
    command: "./acme customers list --jq '.[] | {id, email}'",
    output: [
      { text: '{"id":"cus_Nk2M","email":"alice@acme.com"}', className: "text-emerald-300" },
      { text: '{"id":"cus_Pq8X","email":"bob@acme.com"}', className: "text-emerald-300" },
      { text: '{"id":"cus_Rt4Z","email":"carol@acme.com"}', className: "text-emerald-300" },
    ],
  },
]

const TYPING_SPEED = 32
const OUTPUT_LINE_DELAY = 50
const PAUSE_BEFORE_OUTPUT = 380

export function Demo() {
  const [activeIdx, setActiveIdx] = useState(0)
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])

  // Scroll-driven active feature on lg+.
  // No dep array — intentionally reconnects after every render so hot-reload
  // key changes never leave observers watching detached DOM nodes.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!window.matchMedia("(min-width: 1024px)").matches) return

    const observers: IntersectionObserver[] = []
    featureRefs.current.forEach((el, i) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveIdx(i)
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  })

  const scrollToFeature = (i: number) => {
    setActiveIdx(i)
    const el = featureRefs.current[i]
    if (el && window.matchMedia("(min-width: 1024px)").matches) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <section id="demo" className="px-6 pt-24 pb-32 border-t border-border/40">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--green)" }}>
            What each CLI ships with
          </p>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight">
            Every command, designed for agents.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Mobile-first terminal (sticky on lg, ordered first on mobile) */}
          <div className="order-1 lg:order-2">
            <div className="lg:sticky lg:top-24">
              <Terminal feature={FEATURES[activeIdx]} />
            </div>
          </div>

          {/* Feature list */}
          <div className="order-2 lg:order-1 flex flex-col">
            {FEATURES.map((f, i) => (
              <div
                key={f.tag}
                ref={(el) => {
                  featureRefs.current[i] = el
                }}
                className="lg:min-h-[70vh] flex flex-col justify-center py-8 lg:py-0"
              >
                <button
                  type="button"
                  onClick={() => scrollToFeature(i)}
                  className={cn(
                    "text-left transition-all duration-500 cursor-pointer",
                    "rounded-xl border p-6",
                    activeIdx === i
                      ? "border-border bg-secondary/40 opacity-100"
                      : "border-border/30 bg-transparent opacity-50 hover:opacity-80"
                  )}
                >
                  <div className="flex items-center gap-3 mb-4">
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
                    <span className="text-xs font-mono text-muted-foreground">
                      0{i + 1} / 0{FEATURES.length}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-medium tracking-tight mb-3">
                    {f.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Terminal({ feature }: { feature: Feature }) {
  const [typedLen, setTypedLen] = useState(0)
  const [shownLines, setShownLines] = useState(0)
  const [phase, setPhase] = useState<"typing" | "pausing" | "output" | "done">("typing")
  const bodyRef = useRef<HTMLDivElement>(null)

  // Reset and replay whenever feature changes
  useEffect(() => {
    setTypedLen(0)
    setShownLines(0)
    setPhase("typing")
  }, [feature])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    switch (phase) {
      case "typing":
        if (typedLen < feature.command.length) {
          timer = setTimeout(() => setTypedLen((n) => n + 1), TYPING_SPEED)
        } else {
          setPhase("pausing")
        }
        break
      case "pausing":
        timer = setTimeout(() => setPhase("output"), PAUSE_BEFORE_OUTPUT)
        break
      case "output":
        if (shownLines < feature.output.length) {
          timer = setTimeout(() => setShownLines((n) => n + 1), OUTPUT_LINE_DELAY)
        } else {
          setPhase("done")
        }
        break
    }
    return () => clearTimeout(timer)
  }, [phase, typedLen, shownLines, feature])

  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  })

  const showCursor = phase === "typing" || phase === "pausing"

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c0c0c] overflow-hidden shadow-2xl shadow-black/60">
      {/* macOS chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#141414] select-none">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="flex-1 text-center text-xs text-zinc-600 font-mono tracking-tight">
          bash — 80×24
        </span>
      </div>

      <div
        ref={bodyRef}
        className="p-5 font-mono text-sm leading-relaxed h-[440px] overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}
      >
        <div className="flex gap-2">
          <span className="text-emerald-400 select-none shrink-0">$</span>
          <span className="text-zinc-100 break-all">
            {feature.command.slice(0, typedLen)}
            {showCursor && (
              <span
                className="inline-block w-[7px] h-[13px] bg-zinc-300 ml-px align-middle"
                style={{ animation: "terminal-blink 1s step-end infinite" }}
              />
            )}
          </span>
        </div>
        {(phase === "output" || phase === "done") &&
          feature.output.slice(0, shownLines).map((line, i) => (
            <div
              key={i}
              className={cn(
                "pl-5 whitespace-pre-wrap break-all",
                line.className ?? "text-zinc-400"
              )}
            >
              {line.text === "" ? " " : line.text}
            </div>
          ))}
      </div>
    </div>
  )
}
