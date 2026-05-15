import type { UserDocs } from "@/lib/engine"

// DocsOverrides is the provider-editable markdown for each section of the
// generated docs site. Stored as JSON in clis.docs_md. Empty strings mean
// "use the auto fallback"; this keeps the document fully driven by the spec
// for any section the provider hasn't touched.
export type DocsOverrides = {
  intro_md: string
  install_md: string
  auth_md: string
  commands_md: string
}

export const DOCS_SECTIONS = [
  { id: "intro_md",    label: "Intro" },
  { id: "install_md",  label: "Install" },
  { id: "auth_md",     label: "Auth" },
  { id: "commands_md", label: "Commands" },
] as const

export type DocsSectionId = (typeof DOCS_SECTIONS)[number]["id"]

export function emptyOverrides(): DocsOverrides {
  return { intro_md: "", install_md: "", auth_md: "", commands_md: "" }
}

// parseDocsMd accepts both the new JSON-encoded overrides format and the
// legacy plain-markdown intro format, so older rows still render.
export function parseDocsMd(raw: string): DocsOverrides {
  const empty = emptyOverrides()
  const t = raw.trim()
  if (!t) return empty
  if (t.startsWith("{")) {
    try {
      const parsed = JSON.parse(t)
      return {
        intro_md:    typeof parsed.intro_md    === "string" ? parsed.intro_md    : "",
        install_md:  typeof parsed.install_md  === "string" ? parsed.install_md  : "",
        auth_md:     typeof parsed.auth_md     === "string" ? parsed.auth_md     : "",
        commands_md: typeof parsed.commands_md === "string" ? parsed.commands_md : "",
      }
    } catch {
      // fall through to legacy treatment
    }
  }
  return { ...empty, intro_md: raw }
}

export function serializeOverrides(overrides: DocsOverrides): string {
  // If every section is empty, persist an empty string so the column stays
  // visually clean and the legacy fallback keeps working.
  if (Object.values(overrides).every((v) => v.trim().length === 0)) return ""
  return JSON.stringify(overrides)
}

// DocsViewModel is the final shape consumed by both the studio Docs tab and
// the public /docs/<slug> page. Auto sections come from `userDocs`; each
// `_md` field is the provider's override (or empty string for fallback).
export type DocsViewModel = {
  userDocs: UserDocs
  overrides: DocsOverrides
  defaults: DocsOverrides
  install: InstallSnippet[]
  docsUrl: string | null
}

export type InstallSnippet = {
  label: string
  command: string
  note?: string
}

export type DocsContext = {
  userDocs: UserDocs
  docsMd: string
  repoOwner: string | null
  repoName: string | null
  cliName: string
  origin: string | null
  slug: string | null
}

function defaultOverrides(userDocs: UserDocs, cliName: string): DocsOverrides {
  const name = userDocs.cli_name || cliName
  const desc = userDocs.description
    ? userDocs.description
    : `${name} is a CLI generated from an OpenAPI spec. Every command maps 1:1 to an API endpoint.`
  return {
    intro_md: desc,
    install_md: "Install once, then run any command. The binary self-updates on minor versions.",
    auth_md: userDocs.auth.length > 0
      ? "Set the listed environment variables, or pass the matching flag at the command line. Credentials are never sent anywhere except the upstream API."
      : "This API does not require authentication.",
    commands_md: "Commands are grouped by resource. Run `--help` on any group or command for full flag detail.",
  }
}

export function buildDocsViewModel(ctx: DocsContext): DocsViewModel {
  return {
    userDocs: ctx.userDocs,
    overrides: parseDocsMd(ctx.docsMd),
    defaults: defaultOverrides(ctx.userDocs, ctx.cliName),
    install: buildInstallSnippets(ctx),
    docsUrl: ctx.origin && ctx.slug ? `${ctx.origin}/docs/${ctx.slug}` : null,
  }
}

// resolveSection returns the override if non-empty, otherwise the auto default.
// Centralized so the studio preview and the public page render identically.
export function resolveSection(viewModel: DocsViewModel, id: DocsSectionId): string {
  const override = viewModel.overrides[id]
  return override.trim().length > 0 ? override : viewModel.defaults[id]
}

function buildInstallSnippets({ repoOwner, repoName, cliName }: DocsContext): InstallSnippet[] {
  const snippets: InstallSnippet[] = []
  if (repoOwner && repoName) {
    snippets.push({
      label: "npm (any OS)",
      command: `npm install -g @${repoOwner}/${repoName}`,
      note: "Works on macOS, Linux, and Windows. Requires Node.js.",
    })
    snippets.push({
      label: "macOS + Linux",
      command: `curl -fsSL https://github.com/${repoOwner}/${repoName}/releases/latest/download/install.sh | sh`,
      note: "Auto-detects OS and architecture.",
    })
  } else {
    snippets.push({
      label: "Install",
      command: `# release ${cliName} from the studio to publish install scripts`,
    })
  }
  return snippets
}

// renderMarkdown serializes the docs view model as a plain markdown document.
// Used by the /docs/<slug>/raw route so agents can curl docs without parsing HTML.
export function renderMarkdown(viewModel: DocsViewModel): string {
  const { userDocs, install } = viewModel
  const name = userDocs.cli_name || "CLI"
  const out: string[] = []

  out.push(`# ${name}${userDocs.version ? ` v${userDocs.version}` : ""}`)
  out.push("")
  out.push(resolveSection(viewModel, "intro_md"))
  out.push("")

  out.push("## Install")
  out.push("")
  const installNotes = resolveSection(viewModel, "install_md")
  if (installNotes.trim()) { out.push(installNotes); out.push("") }
  for (const s of install) {
    out.push(`### ${s.label}`)
    out.push("")
    out.push("```bash")
    out.push(s.command)
    out.push("```")
    if (s.note) { out.push(""); out.push(s.note) }
    out.push("")
  }

  if (userDocs.auth.length > 0) {
    out.push("## Authentication")
    out.push("")
    const authNotes = resolveSection(viewModel, "auth_md")
    if (authNotes.trim()) { out.push(authNotes); out.push("") }
    for (const a of userDocs.auth) {
      const meta = [a.type, a.env_var].filter(Boolean).join(" · ")
      out.push(`- \`${a.id}\`${meta ? ` — ${meta}` : ""}`)
      if (a.hint) out.push(`  ${a.hint}`)
    }
    out.push("")
  }

  out.push("## Commands")
  out.push("")
  const cmdNotes = resolveSection(viewModel, "commands_md")
  if (cmdNotes.trim()) { out.push(cmdNotes); out.push("") }
  for (const g of userDocs.groups) {
    out.push(`### ${g.name}`)
    if (g.description) { out.push(""); out.push(g.description) }
    out.push("")
    for (const c of g.commands) {
      out.push(`#### \`${c.name}\` — ${c.http_method.toUpperCase()} ${c.path}`)
      if (c.description) { out.push(""); out.push(c.description) }
      out.push("")
      out.push("```bash")
      out.push(c.sample)
      out.push("```")
      if (c.parameters.length > 0) {
        out.push("")
        out.push("Flags:")
        for (const p of c.parameters) {
          const bits = [p.type || "value", p.location && `in ${p.location}`, p.required && "required"]
            .filter(Boolean).join(", ")
          out.push(`- \`--${p.name}\` (${bits})${p.description ? ` — ${p.description}` : ""}`)
        }
      }
      out.push("")
    }
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n"
}

// slugify reduces a CLI name to a URL-safe slug. Stable for the same input.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
