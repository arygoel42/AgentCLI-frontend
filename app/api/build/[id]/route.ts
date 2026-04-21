import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { callBuild } from "@/lib/engine"
import { NextRequest } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  const supabase = createClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 })
  }

  const { data: cli } = await supabase
    .from("clis")
    .select("id, name, provider_id, spec_content, spec_filename, config_yml, module_path")
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 })
  }

  if (!cli.spec_content || !cli.spec_filename) {
    return new Response(JSON.stringify({ error: "No spec on file for this project" }), { status: 400 })
  }

  try {
    const engineRes = await callBuild(
      cli.spec_content,
      cli.spec_filename,
      cli.config_yml ?? undefined,
      cli.module_path ?? undefined
    )

    return new Response(engineRes.body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${cli.name}-cli.zip"`,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Build failed"
    return new Response(JSON.stringify({ error: msg }), { status: 500 })
  }
}
