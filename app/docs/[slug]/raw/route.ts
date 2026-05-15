import { createClient } from "@/utils/supabase/server"
import { callPreview, type PreviewResponse } from "@/lib/engine"
import { buildDocsViewModel, renderMarkdown, slugify } from "@/lib/docs-render"

// Plain-markdown view of the same docs site rendered at /docs/<slug>.
// Useful for agents: `curl https://petl.dev/docs/<slug>/raw` returns a clean
// markdown document instead of HTML.

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const supabase = createClient()

  const { data: candidates } = await supabase
    .from("clis")
    .select("id, name, spec_content, spec_filename, config_yml, docs_md, docs_published, repo_owner, repo_name, preview_json")

  const cli = (candidates ?? []).find((c) => slugify(c.name) === slug)
  if (!cli || !cli.docs_published) {
    return new Response("Not found", { status: 404 })
  }

  let previewData: PreviewResponse | null = null
  if (cli.preview_json) {
    try {
      previewData = JSON.parse(cli.preview_json) as PreviewResponse
    } catch {
      // fall through to refresh
    }
  }
  if ((!previewData || !previewData.user_docs?.groups) && cli.spec_content) {
    try {
      previewData = await callPreview(
        cli.spec_content,
        cli.spec_filename ?? "openapi.yaml",
        cli.config_yml ?? undefined,
      )
    } catch (err) {
      console.error("[/docs/[slug]/raw] preview refresh failed:", err)
    }
  }

  if (!previewData) return new Response("Not found", { status: 404 })

  const viewModel = buildDocsViewModel({
    userDocs: previewData.user_docs,
    docsMd: cli.docs_md ?? "",
    cliName: cli.name,
    repoOwner: cli.repo_owner ?? null,
    repoName: cli.repo_name ?? null,
    origin: null,
    slug,
  })

  return new Response(renderMarkdown(viewModel), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
