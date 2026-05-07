import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"

const SUPPORTED_SCHEMA_VERSIONS = new Set(["1"])
const MAX_MESSAGE_LEN = 4_000
const MAX_COMMAND_CONTEXT_LEN = 200

type FeedbackPayload = {
  schema_version?: unknown
  cli_version?: unknown
  message?: unknown
  command_context?: unknown
  agent_type?: unknown
}

function badRequest(reason: string) {
  return Response.json({ error: "bad_request", reason }, { status: 400 })
}

// POST /api/feedback/ingest
//
// Auth: Authorization: Bearer {telemetry_token}  (same token as telemetry — one per CLI)
// Body: FeedbackPayload (schema_version, cli_version, message, command_context?, agent_type?)
//
// Unknown tokens return 200 "discarded" so old CLIs whose project has been
// deleted don't surface errors to the agent.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : ""
  if (!token) return badRequest("missing bearer token")

  const supabase = createClient()

  const { data: cli } = await supabase
    .from("clis")
    .select("id")
    .eq("telemetry_token", token)
    .limit(1)
    .single()

  if (!cli) {
    return Response.json({ status: "discarded" }, { status: 200 })
  }

  let body: FeedbackPayload
  try {
    body = (await req.json()) as FeedbackPayload
  } catch {
    return badRequest("invalid json")
  }

  const schemaVersion = typeof body.schema_version === "string" ? body.schema_version : ""
  if (!SUPPORTED_SCHEMA_VERSIONS.has(schemaVersion)) {
    return badRequest("unsupported schema_version")
  }

  const cliVersion = typeof body.cli_version === "string" ? body.cli_version : ""
  if (!cliVersion) return badRequest("cli_version is required")

  const message = typeof body.message === "string" ? body.message.trim() : ""
  if (!message) return badRequest("message is required")
  if (message.length > MAX_MESSAGE_LEN) return badRequest("message too long")

  const commandContext =
    typeof body.command_context === "string" && body.command_context.length > 0
      ? body.command_context.slice(0, MAX_COMMAND_CONTEXT_LEN)
      : null

  const agentType =
    typeof body.agent_type === "string" && body.agent_type.length > 0
      ? body.agent_type.slice(0, 50)
      : null

  const { data: inserted, error } = await supabase
    .from("feedback_events")
    .insert({
      cli_id: cli.id,
      cli_version: cliVersion,
      schema_version: schemaVersion,
      message,
      command_context: commandContext,
      agent_type: agentType,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[feedback/ingest] insert error:", error)
    return Response.json({ error: "failed to store feedback" }, { status: 500 })
  }

  return Response.json({ status: "ok", id: inserted.id }, { status: 200 })
}
