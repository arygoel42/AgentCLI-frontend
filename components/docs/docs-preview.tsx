"use client"

import { InteractiveTerminal } from "@/components/docs/terminal"
import { CodeBlock } from "@/components/docs/code-block"
import type { DocsViewModel } from "@/lib/docs-render"
import type { UserDocsCommand, UserDocsGroup } from "@/lib/engine"

type DocsPreviewProps = {
  viewModel: DocsViewModel
  // compact mode is used inside the studio tab — tighter padding, narrower
  // max-width, no top-level header bar (the tab provides its own).
  compact?: boolean
}

export function DocsPreview({ viewModel, compact = false }: DocsPreviewProps) {
  const { userDocs, introMd, install } = viewModel
  const containerPad = compact ? "px-6 py-6" : "px-8 py-10"
  const maxW = compact ? "max-w-2xl" : "max-w-3xl"

  return (
    <div className={`${containerPad} ${maxW} mx-auto space-y-10`}>
      <Section>
        <h1 className="text-2xl font-bold tracking-tight">
          {userDocs.cli_name || "(unnamed)"}
          {userDocs.version && (
            <span className="ml-2 text-xs font-mono text-muted-foreground align-middle">
              v{userDocs.version}
            </span>
          )}
        </h1>
        <Markdown>{introMd}</Markdown>
      </Section>

      <Section title="Install">
        {install.map((s) => (
          <div key={s.label} className="space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <CodeBlock language="bash" code={s.command} />
            {s.note && <p className="text-[10px] text-muted-foreground">{s.note}</p>}
          </div>
        ))}
      </Section>

      {userDocs.demo_script.length > 0 && (
        <Section title="See it in action">
          <p className="text-xs text-muted-foreground">
            Live walkthrough using real commands from the spec — replay anytime.
          </p>
          <InteractiveTerminal lines={userDocs.demo_script} autoPlay={false} />
        </Section>
      )}

      {userDocs.auth.length > 0 && (
        <Section title="Authentication">
          <div className="space-y-2">
            {userDocs.auth.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs font-mono font-bold">{a.id}</code>
                  <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    {a.type}
                  </span>
                  {a.env_var && (
                    <code className="text-[10px] font-mono text-muted-foreground">{a.env_var}</code>
                  )}
                </div>
                {a.hint && <p className="text-xs text-muted-foreground">{a.hint}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Commands">
        {userDocs.groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">No commands defined yet.</p>
        ) : (
          userDocs.groups.map((g) => <GroupBlock key={g.name} group={g} compact={compact} />)
        )}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      {title && <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>}
      {children}
    </section>
  )
}

function GroupBlock({ group, compact }: { group: UserDocsGroup; compact: boolean }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold">{group.name}</h3>
        {group.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
        )}
      </div>
      <div className="space-y-2">
        {group.commands.map((c) => (
          <CommandBlock key={c.name} cmd={c} compact={compact} />
        ))}
      </div>
    </div>
  )
}

const METHOD_COLOR: Record<string, string> = {
  GET: "#60a5fa",
  POST: "#34d399",
  PUT: "#fbbf24",
  PATCH: "#a78bfa",
  DELETE: "#f87171",
}

function CommandBlock({ cmd, compact }: { cmd: UserDocsCommand; compact: boolean }) {
  const color = METHOD_COLOR[cmd.http_method.toUpperCase()] ?? "#9ca3af"
  return (
    <details className="rounded-lg border border-border" open={!compact}>
      <summary className="px-3 py-2 cursor-pointer flex items-center gap-2 flex-wrap text-xs select-none">
        <span
          className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded uppercase"
          style={{ color, backgroundColor: `${color}22` }}
        >
          {cmd.http_method.slice(0, 4)}
        </span>
        <code className="font-mono font-semibold">{cmd.name}</code>
        <code className="font-mono text-[10px] text-muted-foreground truncate">{cmd.path}</code>
      </summary>
      <div className="px-3 pb-3 space-y-2 border-t border-border">
        {cmd.description && (
          <p className="text-xs text-muted-foreground mt-2">{cmd.description}</p>
        )}
        <CodeBlock language="bash" code={cmd.sample} />
        {cmd.parameters.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Flags</p>
            <div className="space-y-1">
              {cmd.parameters.map((p) => (
                <div key={p.name} className="text-xs flex items-center gap-2 flex-wrap">
                  <code className="font-mono font-medium">--{p.name}</code>
                  <code className="text-[10px] font-mono text-muted-foreground">{p.type}</code>
                  {p.required && (
                    <span className="text-[10px] text-red-400">required</span>
                  )}
                  {p.location && (
                    <span className="text-[10px] text-muted-foreground">in {p.location}</span>
                  )}
                  {p.description && (
                    <span className="text-[10px] text-muted-foreground">{p.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  )
}

// Markdown renders provider-authored intro text. Intentionally minimal —
// no third-party dep, no script execution. Lines starting with # become
// headings, blank lines become paragraph breaks, everything else is plain text.
function Markdown({ children }: { children: string }) {
  const lines = children.split("\n")
  const blocks: React.ReactNode[] = []
  let para: string[] = []

  const flush = () => {
    if (para.length === 0) return
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {para.join("\n")}
      </p>
    )
    para = []
  }

  for (const line of lines) {
    if (line.startsWith("# ")) {
      flush()
      blocks.push(<h2 key={`h2-${blocks.length}`} className="text-lg font-semibold">{line.slice(2)}</h2>)
    } else if (line.startsWith("## ")) {
      flush()
      blocks.push(<h3 key={`h3-${blocks.length}`} className="text-sm font-semibold mt-3">{line.slice(3)}</h3>)
    } else if (line.trim() === "") {
      flush()
    } else {
      para.push(line)
    }
  }
  flush()

  return <div className="space-y-3">{blocks}</div>
}
