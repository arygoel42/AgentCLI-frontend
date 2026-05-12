import type { UserDocs } from "@/lib/engine"

// DocsViewModel is the final shape consumed by both the studio Docs tab and
// the public /docs/<slug> page. It's a thin wrapper around the engine's
// UserDocs plus the provider's markdown override and any view-time fields
// (install snippets, public URL) the engine can't know about.
export type DocsViewModel = {
  userDocs: UserDocs
  introMd: string
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

const DEFAULT_INTRO = (cliName: string, description: string) =>
  description
    ? description
    : `${cliName} is a CLI generated from an OpenAPI spec. Every command maps 1:1 to an API endpoint.`

export function buildDocsViewModel(ctx: DocsContext): DocsViewModel {
  return {
    userDocs: ctx.userDocs,
    introMd: ctx.docsMd.trim().length > 0
      ? ctx.docsMd
      : DEFAULT_INTRO(ctx.userDocs.cli_name || ctx.cliName, ctx.userDocs.description),
    install: buildInstallSnippets(ctx),
    docsUrl: ctx.origin && ctx.slug ? `${ctx.origin}/docs/${ctx.slug}` : null,
  }
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

// slugify reduces a CLI name to a URL-safe slug. Stable for the same input.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
