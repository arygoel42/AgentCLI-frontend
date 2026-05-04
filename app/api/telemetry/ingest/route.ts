import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"

type RawEvent = {
  command?: unknown
  group?: unknown
  // CLI sends snake_case; accept both for forward-compat
  flags_used?: unknown
  flags?: unknown
  exit_code?: unknown
  exitCode?: unknown
  latency_ms?: unknown
  latencyMs?: unknown
  error_type?: unknown
  errorType?: unknown
  error_code?: unknown
  errorCode?: unknown
  output_bytes?: unknown
  outputBytes?: unknown
  session_id?: unknown
  sessionId?: unknown
  version?: unknown
  occurred_at?: unknown
  occurredAt?: unknown
}

// POST /api/telemetry/ingest
//
// Auth: Authorization: Bearer {telemetry_token}  (no user session — CLI has none)
// Body: { events: RawEvent[] }  (max 100 events per batch)
//
// The telemetry_token is baked into each generated CLI binary at build time.
// It maps to a specific CLI row — every event is tagged with that cli_id.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : ""
  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient()

  // Resolve token → cli_id
  const { data: cli } = await supabase
    .from("clis")
    .select("id")
    .eq("telemetry_token", token)
    .limit(1)
    .single()

  if (!cli) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let parsed: unknown
  try {
    parsed = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Accept both a bare array [ {...}, ... ] and a wrapped { events: [...] }
  const eventsArray = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>)?.events)
      ? (parsed as { events: unknown[] }).events
      : null

  if (!eventsArray) {
    return Response.json({ error: "expected a JSON array or {events:[...]}" }, { status: 400 })
  }

  const raw: RawEvent[] = eventsArray.slice(0, 100)

  const rows = raw
    .map((e) => {
      const command = typeof e.command === "string" ? e.command.slice(0, 200) : null
      const exitCode = e.exit_code ?? e.exitCode
      const latencyMs = e.latency_ms ?? e.latencyMs
      const sessionId = (e.session_id ?? e.sessionId)
      const version = typeof e.version === "string" ? e.version.slice(0, 50) : "unknown"
      const occurredAt = (e.occurred_at ?? e.occurredAt)

      if (
        !command ||
        typeof exitCode !== "number" ||
        typeof latencyMs !== "number" ||
        typeof sessionId !== "string" || !sessionId
      ) return null

      const flagsRaw = e.flags_used ?? e.flags
      const flagsArr = Array.isArray(flagsRaw)
        ? (flagsRaw as unknown[]).filter((f) => typeof f === "string") as string[]
        : []

      const errorType = e.error_type ?? e.errorType
      const errorCode = e.error_code ?? e.errorCode
      const outputBytes = e.output_bytes ?? e.outputBytes

      return {
        cli_id: cli.id,
        cli_version: version,
        command,
        group_name: typeof e.group === "string" ? e.group.slice(0, 100) : null,
        flags_used: flagsArr.slice(0, 50),
        flag_count: flagsArr.length,
        exit_code: exitCode,
        latency_ms: Math.max(0, Math.min(latencyMs, 300_000)),
        error_type: typeof errorType === "string" ? errorType.slice(0, 50) : null,
        error_code: typeof errorCode === "number" ? errorCode : null,
        output_bytes: typeof outputBytes === "number" ? Math.max(0, outputBytes) : 0,
        session_id: sessionId.slice(0, 64),
        occurred_at: typeof occurredAt === "string" ? occurredAt : new Date().toISOString(),
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length > 0) {
    const { error } = await supabase.from("cli_events").insert(rows)
    if (error) {
      console.error("[telemetry/ingest] insert error:", error)
      return Response.json({ error: "Failed to store events" }, { status: 500 })
    }
  }

  return new Response(null, { status: 204 })
}
