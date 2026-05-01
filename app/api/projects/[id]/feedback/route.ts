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

  if (!provider) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const { data: cli } = await supabase
    .from("clis")
    .select("id, provider_id")
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const { data: events, error } = await supabase
    .from("feedback_events")
    .select("id, message, command_context, agent_type, cli_version, created_at")
    .eq("cli_id", id)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ events: events ?? [] })
}
