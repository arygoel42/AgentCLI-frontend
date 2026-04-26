"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface OutputLine {
  text: string
  className?: string
}

interface ScriptStep {
  command: string
  outputLines: OutputLine[]
}

const SCRIPT: ScriptStep[] = [
  {
    command: "openapi-cli-gen generate --spec stripe.yaml --name stripe --env-prefix STRIPE",
    outputLines: [
      { text: "  ✓  Parsing stripe.yaml...", className: "text-emerald-400" },
      { text: "  ✓  Found 847 operations across 120 paths", className: "text-emerald-400" },
      { text: "  ✓  Generating 112 command files...", className: "text-emerald-400" },
      { text: "  ✓  go build ./cmd/stripe  ·  done", className: "text-emerald-400" },
      { text: "" },
      { text: "  CLI written to ./stripe-cli/", className: "text-zinc-500" },
      { text: "  Quick start:", className: "text-zinc-500" },
      { text: '    export STRIPE_API_KEY="sk_..."', className: "text-zinc-400" },
      { text: "    ./stripe --schema", className: "text-zinc-400" },
    ],
  },
  {
    command: "./stripe --schema | jq '.commands[0]'",
    outputLines: [
      { text: "{", className: "text-amber-200" },
      { text: '  "group": "customers",', className: "text-zinc-300" },
      { text: '  "commands": ["create", "list", "retrieve", "update", "delete"]', className: "text-zinc-300" },
      { text: "}", className: "text-amber-200" },
    ],
  },
  {
    command: 'export STRIPE_API_KEY="sk_test_4eC39HqLyjWDomblZoUFe2C"',
    outputLines: [],
  },
  {
    command: "./stripe customers list -o compact --limit 3",
    outputLines: [
      {
        text: '{"id":"cus_Nk2M","email":"alice@acme.com","name":"Alice Rivera","created":"2026-03-15"}',
        className: "text-emerald-300",
      },
      {
        text: '{"id":"cus_Pq8X","email":"bob@acme.com","name":"Bob Chen","created":"2026-03-12"}',
        className: "text-emerald-300",
      },
      {
        text: '{"_meta":{"total":142,"has_more":true,"next_cursor":"cus_Pq8X"}}',
        className: "text-zinc-500",
      },
    ],
  },
]

// Canned responses for interactive mode
const RESPONSES: Record<string, OutputLine[]> = {
  help: [
    { text: "Available commands:", className: "text-zinc-400" },
    { text: "  ./stripe --schema             Discover the full CLI interface", className: "text-zinc-300" },
    { text: "  ./stripe customers list        List customers", className: "text-zinc-300" },
    { text: "  ./stripe charges list          List charges", className: "text-zinc-300" },
    { text: "  ./stripe --dry-run [cmd]       Preview a request without sending", className: "text-zinc-300" },
    { text: "  clear                          Clear the terminal", className: "text-zinc-300" },
  ],
  "./stripe --schema": [
    { text: "{", className: "text-amber-200" },
    { text: '  "name": "stripe", "version": "0.1.0",', className: "text-zinc-300" },
    { text: '  "auth_schemes": [{"type": "apiKey", "env_var": "STRIPE_API_KEY"}],', className: "text-zinc-300" },
    {
      text: '  "commands": [{"group":"customers","count":5},{"group":"charges","count":4},...]',
      className: "text-zinc-300",
    },
    { text: "}", className: "text-amber-200" },
  ],
  "./stripe customers list": [
    {
      text: '{"id":"cus_Nk2M","email":"alice@acme.com","name":"Alice Rivera"}',
      className: "text-emerald-300",
    },
    {
      text: '{"id":"cus_Pq8X","email":"bob@acme.com","name":"Bob Chen"}',
      className: "text-emerald-300",
    },
    { text: '{"_meta":{"total":142,"has_more":true}}', className: "text-zinc-500" },
  ],
  "./stripe charges list": [
    {
      text: '{"id":"ch_1A2B","amount":2999,"currency":"usd","status":"succeeded","description":"Subscription"}',
      className: "text-emerald-300",
    },
    {
      text: '{"id":"ch_3C4D","amount":4900,"currency":"usd","status":"succeeded","description":"One-time"}',
      className: "text-emerald-300",
    },
    { text: '{"_meta":{"total":88,"has_more":true}}', className: "text-zinc-500" },
  ],
  "./stripe --dry-run customers create --email test@example.com --name Test": [
    { text: "{", className: "text-amber-200" },
    { text: '  "dry_run": true,', className: "text-zinc-300" },
    { text: '  "method": "POST",', className: "text-zinc-300" },
    { text: '  "url": "https://api.stripe.com/v1/customers",', className: "text-zinc-300" },
    {
      text: '  "headers": {"Authorization": "[REDACTED]", "Content-Type": "application/json"},',
      className: "text-zinc-300",
    },
    { text: '  "body": {"email": "test@example.com", "name": "Test"}', className: "text-zinc-300" },
    { text: "}", className: "text-amber-200" },
  ],
}

type Phase = "pre-fill" | "waiting" | "typing" | "showing-output" | "interactive"

interface HistoryEntry {
  command: string
  outputLines: OutputLine[]
}

const TYPING_SPEED = 36
const OUTPUT_LINE_DELAY = 55
const PAUSE_AFTER_COMMAND = 480
const PAUSE_AFTER_OUTPUT = 1350
const PRE_FILL_WAIT = 950

export function Demo() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [phase, setPhase] = useState<Phase>("pre-fill")
  const [stepIdx, setStepIdx] = useState(0)
  // Start with first command already visible (pre-filled)
  const [typedLen, setTypedLen] = useState(() => SCRIPT[0].command.length)
  const [shownLines, setShownLines] = useState(0)
  const [userInput, setUserInput] = useState("")

  const bodyRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isInteractive = phase === "interactive"
  const currentStep = !isInteractive ? SCRIPT[stepIdx] : null
  const currentCommand = currentStep?.command ?? ""
  const currentOutput = currentStep?.outputLines ?? []

  // Auto-scroll to bottom on every render
  useEffect(() => {
    const el = bodyRef.current
    if (el) el.scrollTop = el.scrollHeight
  })

  // Demo state machine
  useEffect(() => {
    if (isInteractive) return
    let timer: ReturnType<typeof setTimeout>

    switch (phase) {
      case "pre-fill": {
        // First command is already shown; wait briefly then "run" it
        timer = setTimeout(() => {
          if (currentOutput.length === 0) {
            setHistory((h) => [...h, { command: currentCommand, outputLines: [] }])
            if (stepIdx < SCRIPT.length - 1) {
              setStepIdx((i) => i + 1)
              setTypedLen(0)
              setShownLines(0)
              setPhase("typing")
            } else {
              setPhase("interactive")
            }
          } else {
            setShownLines(0)
            setPhase("showing-output")
          }
        }, PRE_FILL_WAIT)
        break
      }

      case "typing": {
        if (typedLen < currentCommand.length) {
          timer = setTimeout(() => setTypedLen((n) => n + 1), TYPING_SPEED)
        } else {
          // Done typing — brief pause before showing output
          setPhase("waiting")
        }
        break
      }

      case "waiting": {
        timer = setTimeout(() => {
          if (currentOutput.length === 0) {
            setHistory((h) => [...h, { command: currentCommand, outputLines: [] }])
            if (stepIdx < SCRIPT.length - 1) {
              setStepIdx((i) => i + 1)
              setTypedLen(0)
              setShownLines(0)
              setPhase("typing")
            } else {
              setPhase("interactive")
            }
          } else {
            setShownLines(0)
            setPhase("showing-output")
          }
        }, PAUSE_AFTER_COMMAND)
        break
      }

      case "showing-output": {
        if (shownLines < currentOutput.length) {
          timer = setTimeout(() => setShownLines((n) => n + 1), OUTPUT_LINE_DELAY)
        } else {
          // All lines shown — pause then advance
          timer = setTimeout(() => {
            setHistory((h) => [...h, { command: currentCommand, outputLines: currentOutput }])
            if (stepIdx < SCRIPT.length - 1) {
              setStepIdx((i) => i + 1)
              setTypedLen(0)
              setShownLines(0)
              setPhase("typing")
            } else {
              setPhase("interactive")
            }
          }, PAUSE_AFTER_OUTPUT)
        }
        break
      }
    }

    return () => clearTimeout(timer)
  }, [phase, typedLen, shownLines, stepIdx, isInteractive, currentCommand, currentOutput])

  const enterInteractive = useCallback(() => {
    setPhase("interactive")
    setTimeout(() => inputRef.current?.focus(), 60)
  }, [])

  const handleTerminalClick = useCallback(() => {
    if (!isInteractive) {
      enterInteractive()
    } else {
      inputRef.current?.focus()
    }
  }, [isInteractive, enterInteractive])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const cmd = userInput.trim()
        setUserInput("")
        if (!cmd) return

        if (cmd === "clear") {
          setHistory([])
          return
        }

        const responseLines =
          RESPONSES[cmd] ??
          [{ text: `bash: ${cmd.split(" ")[0]}: command not found`, className: "text-red-400" }]

        setHistory((h) => [...h, { command: cmd, outputLines: responseLines }])
      }
    },
    [userInput]
  )

  const showCommandCursor = phase === "typing" || phase === "pre-fill"

  return (
    <section id="demo" className="px-6 pt-24 pb-12 border-t border-border/40">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--green)" }}>
            Try it live
          </p>
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight">
            Create an agent-native CLI<br className="hidden md:block" /> in minutes.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Click the terminal to take control — every command below is real.
          </p>
        </div>

        {/* Terminal window */}
        <div
          className="rounded-xl border border-white/[0.08] bg-[#0c0c0c] overflow-hidden shadow-2xl shadow-black/60 cursor-text"
          onClick={handleTerminalClick}
        >
          {/* macOS window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#141414] select-none">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="flex-1 text-center text-xs text-zinc-600 font-mono tracking-tight select-none">
              bash — 80×24
            </span>
          </div>

          {/* Terminal body */}
          <div
            ref={bodyRef}
            className="p-5 font-mono text-sm leading-relaxed min-h-[380px] max-h-[520px] overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}
          >
            {/* Completed history entries */}
            {history.map((item, i) => (
              <div key={i} className="mb-1.5">
                <PromptLine command={item.command} />
                {item.outputLines.map((line, j) => (
                  <div
                    key={j}
                    className={cn(
                      "pl-5 whitespace-pre-wrap break-all",
                      line.className ?? "text-zinc-400"
                    )}
                  >
                    {line.text === "" ? "\u00a0" : line.text}
                  </div>
                ))}
              </div>
            ))}

            {/* Active (current) command line */}
            {!isInteractive && currentStep && (
              <div className="mb-1">
                <div className="flex gap-2">
                  <span className="text-emerald-400 select-none shrink-0">$</span>
                  <span className="text-zinc-100 break-all">
                    {currentCommand.slice(0, typedLen)}
                    {showCommandCursor && (
                      <span
                        className="inline-block w-[7px] h-[13px] bg-zinc-300 ml-px align-middle"
                        style={{ animation: "terminal-blink 1s step-end infinite" }}
                      />
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Output lines appearing for current step */}
            {!isInteractive && phase === "showing-output" &&
              currentOutput.slice(0, shownLines).map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "pl-5 whitespace-pre-wrap break-all",
                    line.className ?? "text-zinc-400"
                  )}
                >
                  {line.text === "" ? "\u00a0" : line.text}
                </div>
              ))}

            {/* Interactive input line */}
            {isInteractive && (
              <div className="flex gap-2 items-center">
                <span className="text-emerald-400 select-none shrink-0">$</span>
                <span className="text-zinc-100 break-all">
                  {userInput}
                  <span
                    className="inline-block w-[7px] h-[13px] bg-zinc-300 ml-px align-middle"
                    style={{ animation: "terminal-blink 1s step-end infinite" }}
                  />
                </span>
                <input
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="sr-only"
                  aria-label="Terminal input"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}

            {/* Hint while in demo mode */}
            {!isInteractive && (
              <p className="mt-4 text-zinc-700 text-xs select-none">
                click anywhere to take control ↵
              </p>
            )}
          </div>

          {/* Bottom status bar (interactive mode only) */}
          {isInteractive && (
            <div className="px-5 py-2 border-t border-white/[0.05] bg-[#111] flex items-center justify-between select-none">
              <span className="text-emerald-500/60 text-xs font-mono">● interactive</span>
              <span className="text-zinc-600 text-xs font-mono">
                type <span className="text-zinc-400">help</span> for commands
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PromptLine({ command }: { command: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-emerald-400 select-none shrink-0">$</span>
      <span className="text-zinc-100 break-all">{command}</span>
    </div>
  )
}
