"use client"

import { useMemo, useState } from "react"
import { CodeBlock } from "@/components/docs/code-block"
import { resolveSection, type DocsViewModel } from "@/lib/docs-render"
import type { UserDocsCommand, UserDocsGroup } from "@/lib/engine"
import {
  ChevronDown,
  Command,
  KeyRound,
  Layers3,
  Route,
  Search,
  Terminal,
} from "lucide-react"

type DocsPreviewProps = {
  viewModel: DocsViewModel
  // compact mode is used inside the studio tab — tighter padding, narrower
  // max-width, no top-level header bar (the tab provides its own).
  compact?: boolean
}

export function DocsPreview({ viewModel, compact = false }: DocsPreviewProps) {
  const { userDocs, install } = viewModel
  const [commandFilter, setCommandFilter] = useState("")
  const containerPad = compact ? "px-6 py-6" : "px-4 sm:px-8 py-12"
  const maxW = compact ? "max-w-3xl" : "max-w-4xl"
  const cliName = userDocs.cli_name || "CLI"
  const commandCount = countCommands(userDocs.groups)
  const filteredGroups = useMemo(
    () => filterGroups(userDocs.groups, commandFilter),
    [userDocs.groups, commandFilter]
  )

  return (
    <div className={`${containerPad} ${maxW} mx-auto space-y-14`}>
      <section className={compact ? "space-y-5" : "space-y-6 border-b border-border pb-10"}>
        <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Terminal className="h-3.5 w-3.5" />
          End-user CLI docs
        </div>
        <div className="space-y-3">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className={compact ? "text-2xl font-bold tracking-tight" : "text-4xl font-bold tracking-tight"}>
              {cliName}
            </h1>
            {userDocs.version && (
              <span className="font-mono text-xs text-muted-foreground">v{userDocs.version}</span>
            )}
          </div>
          <Markdown
            paragraphClassName={compact ? undefined : "text-base text-muted-foreground leading-7 max-w-2xl"}
          >
            {resolveSection(viewModel, "intro_md")}
          </Markdown>
        </div>

        <div className={compact ? "grid grid-cols-2 gap-x-6 gap-y-3" : "grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 pt-2"}>
          <Fact icon={Command} label="Commands" value={String(commandCount)} />
          <Fact icon={Layers3} label="Groups" value={String(userDocs.groups.length)} />
          <Fact icon={KeyRound} label="Auth" value={userDocs.auth.length > 0 ? `${userDocs.auth.length} scheme${userDocs.auth.length === 1 ? "" : "s"}` : "None"} />
          <Fact icon={Route} label="Base URL" value={userDocs.base_url || "From spec"} />
        </div>
      </section>

      <Section title="Install">
        <Markdown>{resolveSection(viewModel, "install_md")}</Markdown>
        <div className="space-y-4">
          {install.map((s) => (
            <div key={s.label} className="space-y-2 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <CodeBlock language="bash" code={s.command} />
              {s.note && <p className="text-[11px] text-muted-foreground">{s.note}</p>}
            </div>
          ))}
        </div>
      </Section>

      {userDocs.auth.length > 0 && (
        <Section title="Authentication">
          <Markdown>{resolveSection(viewModel, "auth_md")}</Markdown>
          <div className="space-y-2">
            {userDocs.auth.map((a) => (
              <div key={a.id} className="rounded-md border border-border px-3 py-2.5 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs font-mono font-semibold">{a.id}</code>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
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
        <Markdown>{resolveSection(viewModel, "commands_md")}</Markdown>
        <label className="relative block w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={commandFilter}
            onChange={(event) => setCommandFilter(event.target.value)}
            placeholder="Filter commands"
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground"
          />
        </label>
        {userDocs.groups.length === 0 ? (
          <p className="text-xs text-muted-foreground">No commands defined yet.</p>
        ) : filteredGroups.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-xs text-muted-foreground">
            No commands match &ldquo;{commandFilter}&rdquo;.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {filteredGroups.map((g, index) => (
              <GroupBlock
                key={g.name}
                group={g}
                compact={compact}
                defaultOpen={!compact && index === 0 && commandFilter.trim().length === 0}
              />
            ))}
          </div>
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

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0" />
        <span>{label}</span>
      </div>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function GroupBlock({
  group,
  compact,
  defaultOpen,
}: {
  group: UserDocsGroup
  compact: boolean
  defaultOpen: boolean
}) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] gap-4 px-4 py-3 transition-colors hover:bg-muted/30">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-sm font-semibold">{group.name}</h3>
            <span className="text-[10px] text-muted-foreground">
              {group.commands.length} endpoint{group.commands.length === 1 ? "" : "s"}
            </span>
          </div>
          {group.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{group.description}</p>
          )}
        </div>
        <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="divide-y divide-border border-t border-border">
        {group.commands.map((c) => (
          <CommandBlock key={c.name} cmd={c} compact={compact} />
        ))}
      </div>
    </details>
  )
}

// Method label is intentionally monochrome — no colored boxes. The text alone
// (plus its position in the row) is enough to identify the verb, and it keeps
// the docs scanning at one consistent visual weight.
function MethodLabel({ method }: { method: string }) {
  const key = method.toUpperCase()
  return (
    <span className="w-14 shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {key.slice(0, 6) || "HTTP"}
    </span>
  )
}

function CommandBlock({ cmd, compact }: { cmd: UserDocsCommand; compact: boolean }) {
  const required = cmd.parameters.filter((p) => p.required)
  return (
    <details className="group/command">
      <summary className="grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-3 px-4 py-3 text-xs transition-colors hover:bg-muted/30">
        <MethodLabel method={cmd.http_method} />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
            <code className="font-mono font-semibold truncate">{cmd.name}</code>
            <code className="truncate font-mono text-[10px] text-muted-foreground">{cmd.path}</code>
            {required.length > 0 && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                · {required.length} required
              </span>
            )}
          </div>
          {cmd.description && !compact && (
            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{cmd.description}</p>
          )}
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open/command:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border px-4 py-4">
        {cmd.description && (
          <Markdown paragraphClassName="text-xs text-muted-foreground leading-relaxed">
            {cmd.description}
          </Markdown>
        )}
        <CodeBlock language="bash" code={cmd.sample} />
        {cmd.parameters.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Flags</p>
            <div className="divide-y divide-border border-t border-border">
              {cmd.parameters.map((p) => (
                <div key={p.name} className="grid gap-1 py-2 text-xs sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <code className="truncate font-mono font-medium">--{p.name}</code>
                    {p.required && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">required</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 min-w-0 flex-wrap text-[10px] text-muted-foreground">
                    <code className="font-mono">{p.type || "value"}</code>
                    {p.location && <span>in {p.location}</span>}
                    {p.description && <span className="min-w-0">{p.description}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  )
}

// Markdown renders provider/API-authored text without executing HTML. It keeps
// the parser small, but handles the common OpenAPI markdown we see in docs:
// headings, lists, response-code tables, inline code, bold, and links.
function Markdown({
  children,
  paragraphClassName = "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap",
}: {
  children: string
  paragraphClassName?: string
}) {
  const lines = normalizeMarkdown(children).split("\n")
  const blocks: React.ReactNode[] = []
  let para: string[] = []
  let listItems: string[] = []

  const flush = () => {
    if (para.length === 0) return
    blocks.push(
      <p key={`p-${blocks.length}`} className={paragraphClassName}>
        <InlineText text={para.join("\n")} />
      </p>
    )
    para = []
  }

  const flushList = () => {
    if (listItems.length === 0) return
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-1 pl-5 text-sm text-muted-foreground leading-relaxed">
        {listItems.map((item, index) => (
          <li key={index}>
            <InlineText text={item} />
          </li>
        ))}
      </ul>
    )
    listItems = []
  }

  const flushAll = () => {
    flush()
    flushList()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (isTableLine(trimmed)) {
      flushAll()
      const tableLines: string[] = []
      while (i < lines.length && isTableLine(lines[i].trim())) {
        tableLines.push(lines[i].trim())
        i++
      }
      i--
      const table = parseTable(tableLines)
      if (table) {
        blocks.push(<MarkdownTable key={`table-${blocks.length}`} table={table} />)
      }
    } else if (line.startsWith("# ")) {
      flushAll()
      blocks.push(<h2 key={`h2-${blocks.length}`} className="text-lg font-semibold">{line.slice(2)}</h2>)
    } else if (line.startsWith("## ")) {
      flushAll()
      blocks.push(<h3 key={`h3-${blocks.length}`} className="text-sm font-semibold mt-3">{line.slice(3)}</h3>)
    } else if (/^[-*]\s+/.test(trimmed)) {
      flush()
      listItems.push(trimmed.replace(/^[-*]\s+/, ""))
    } else if (trimmed === "") {
      flushAll()
    } else {
      flushList()
      para.push(line)
    }
  }
  flushAll()

  return <div className="space-y-3">{blocks}</div>
}

type ParsedTable = {
  headers: string[]
  rows: string[][]
}

function normalizeMarkdown(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n").trim()

  // Some imported OpenAPI descriptions collapse markdown rows into one line:
  // "**Possible responses** | Code | Message | | 200 | OK |". Rehydrate those
  // row boundaries so the table parser can do the useful thing.
  text = text.replace(/\s+\|\s+\|\s+/g, "|\n| ")
  text = text.replace(/(^|\n)(\*\*[^*\n]+\*\*)\s+\|\s+/g, "$1$2\n| ")

  // Rehydrate common inline bullet lists produced by collapsed descriptions.
  text = text.replace(/\s+:\s+-\s+/g, ":\n- ")
  let previous = ""
  while (previous !== text) {
    previous = text
    text = text.replace(/(\n[-*]\s+[^\n]*?)\s+-\s+/g, "$1\n- ")
  }

  return text
}

function isTableLine(line: string): boolean {
  return line.startsWith("|") && line.endsWith("|") && line.split("|").length > 2
}

function parseTable(lines: string[]): ParsedTable | null {
  const rows = lines
    .map((line) => line.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()))
    .filter((cells) => cells.length > 1)

  if (rows.length === 0) return null

  const [first, second, ...rest] = rows
  const hasSeparator = second?.every((cell) => /^:?-{2,}:?$/.test(cell))
  return {
    headers: first,
    rows: hasSeparator ? rest : rows.slice(1),
  }
}

function MarkdownTable({ table }: { table: ParsedTable }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/60 text-foreground">
            <tr>
              {table.headers.map((header, index) => (
                <th key={index} className="whitespace-nowrap px-3 py-2 font-semibold">
                  <InlineText text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-background">
                {table.headers.map((_, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-muted-foreground align-top">
                    <InlineText text={row[cellIndex] ?? ""} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code key={index} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
              {part.slice(1, -1)}
            </code>
          )
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
        }
        const markdownLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
        if (markdownLink) {
          return (
            <a
              key={index}
              href={markdownLink[2]}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              {markdownLink[1]}
            </a>
          )
        }
        if (part.startsWith("http://") || part.startsWith("https://")) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              {part}
            </a>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </>
  )
}

function countCommands(groups: UserDocsGroup[]): number {
  return groups.reduce((sum, group) => sum + group.commands.length, 0)
}

function filterGroups(groups: UserDocsGroup[], query: string): UserDocsGroup[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return groups
  return groups
    .map((group) => ({
      ...group,
      commands: group.commands.filter((cmd) => {
        const haystack = [
          group.name,
          group.description,
          cmd.name,
          cmd.description,
          cmd.http_method,
          cmd.path,
        ].join(" ").toLowerCase()
        return haystack.includes(needle)
      }),
    }))
    .filter((group) => group.commands.length > 0)
}

