import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) return Response.json({ error: "Not found" }, { status: 404 })

  const { data: cli } = await supabase
    .from("clis")
    .select(
      "id, provider_id, release_status, release_error, latest_release_version, latest_release_url, latest_release_at, homebrew_formula_url"
    )
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({
    releaseStatus: cli.release_status ?? "idle",
    releaseError: cli.release_error ?? null,
    latestReleaseVersion: cli.latest_release_version ?? null,
    latestReleaseUrl: cli.latest_release_url ?? null,
    latestReleaseAt: cli.latest_release_at ?? null,
    homebrewFormulaUrl: cli.homebrew_formula_url ?? null,
  })
}
