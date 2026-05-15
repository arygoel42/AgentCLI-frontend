import { notFound, redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { callPreview, type PreviewResponse } from "@/lib/engine"
import { DocsPreview } from "@/components/docs/docs-preview"
import { buildDocsViewModel, slugify } from "@/lib/docs-render"
import { parseConfig } from "@/lib/parse-yml"

// Per-CLI end-user docs. Looked up by slug derived from the CLI's name.
// Only renders when the provider has flipped docs_published = true.
//
// Auto sections (auth, groups, commands) regenerate from the spec via the
// engine's /preview endpoint, then merge with the provider's intro markdown
// stored in clis.docs_md.

export const dynamic = "force-dynamic"

export default async function ProjectDocsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createClient()

  // Slug isn't a stable column today — derive it on lookup. Names are kebab
  // already in most cases, so an exact-match check after slugify works for
  // the common path.
  const { data: candidates } = await supabase
    .from("clis")
    .select("id, name, spec_content, spec_filename, config_yml, docs_md, docs_published, repo_owner, repo_name, preview_json, latest_release_version")

  // The public docs slug is the project/docs name (for example "brev").
  // Keep accepting the generated binary/config name as a legacy alias, but
  // redirect it back to the docs slug so shared links are stable.
  const cli = (candidates ?? []).find((c) => {
    const binaryName = parseConfig(c.config_yml ?? "").cli?.name ?? c.name
    const docsSlug = slugify(c.name)
    return docsSlug === slug || slugify(binaryName) === slug
  })
  if (!cli || !cli.docs_published) notFound()

  const binaryName = parseConfig(cli.config_yml ?? "").cli?.name ?? cli.name
  const canonicalSlug = slugify(cli.name)
  if (canonicalSlug && slug !== canonicalSlug) {
    redirect(`/docs/${canonicalSlug}`)
  }

  let previewData: PreviewResponse | null = null
  if (cli.preview_json) {
    try {
      previewData = JSON.parse(cli.preview_json) as PreviewResponse
    } catch {
      // fall through
    }
  }

  // If the cached preview is missing user_docs (older row), refresh.
  if ((!previewData || !previewData.user_docs?.groups) && cli.spec_content) {
    try {
      previewData = await callPreview(
        cli.spec_content,
        cli.spec_filename ?? "openapi.yaml",
        cli.config_yml ?? undefined
      )
    } catch (err) {
      console.error("[/docs/[slug]] preview refresh failed:", err)
    }
  }

  if (!previewData) notFound()

  const viewModel = buildDocsViewModel({
    userDocs: previewData.user_docs,
    docsMd: cli.docs_md ?? "",
    cliName: binaryName,
    repoOwner: cli.repo_owner ?? null,
    repoName: cli.repo_name ?? null,
    origin: null,
    slug: canonicalSlug || slug,
  })

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto">
        <DocsPreview viewModel={viewModel} rawMarkdownUrl={`/docs/${canonicalSlug || slug}/raw`} />
      </main>
    </div>
  )
}
