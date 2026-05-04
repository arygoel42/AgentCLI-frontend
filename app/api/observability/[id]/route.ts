import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { NextRequest } from "next/server"

type CliEventRow = {
  command: string
  group_name: string | null
  flags_used: string[]
  exit_code: number
  latency_ms: number
  error_type: string | null
  output_bytes: number
  session_id: string
  occurred_at: string
}

function rangeToMs(range: string): number {
  if (range === "24h") return 24 * 60 * 60 * 1000
  if (range === "30d") return 30 * 24 * 60 * 60 * 1000
  return 7 * 24 * 60 * 60 * 1000 // default 7d
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, idx)]
}

// GET /api/observability/[id]?range=24h|7d|30d
export async function GET(
  req: NextRequest,
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
    .select("id, provider_id")
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  const range = req.nextUrl.searchParams.get("range") ?? "7d"
  const cutoff = new Date(Date.now() - rangeToMs(range)).toISOString()

  // Fetch up to 10k events for the range — computed in JS for flexibility
  const { data: events, error } = await supabase
    .from("cli_events")
    .select("command, group_name, flags_used, exit_code, latency_ms, error_type, output_bytes, session_id, occurred_at")
    .eq("cli_id", id)
    .gte("occurred_at", cutoff)
    .order("occurred_at", { ascending: false })
    .limit(10000)

  if (error) {
    console.error("[observability]", error)
    return Response.json({ error: "Failed to fetch events" }, { status: 500 })
  }

  const rows: CliEventRow[] = (events ?? []) as CliEventRow[]

  // ── Summary ──────────────────────────────────────────────────────────────────

  const totalInvocations = rows.length
  const errorCount = rows.filter((r) => r.exit_code !== 0).length
  const errorRate = totalInvocations > 0 ? errorCount / totalInvocations : 0

  const latencies = rows.map((r) => r.latency_ms).sort((a, b) => a - b)
  const p50LatencyMs = percentile(latencies, 50)

  const totalBytes = rows.reduce((s, r) => s + (r.output_bytes ?? 0), 0)
  const avgOutputTokens = totalInvocations > 0
    ? Math.round(totalBytes / totalInvocations / 4)
    : 0

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const activeSessions = new Set(
    rows.filter((r) => r.occurred_at >= cutoff24h).map((r) => r.session_id)
  )
  const activeSessionsLast24h = activeSessions.size
  const isActive = activeSessionsLast24h > 0

  // ── Per-command breakdown ─────────────────────────────────────────────────────

  type CmdAgg = {
    count: number
    errors: number
    latencies: number[]
    jqCount: number
    totalBytes: number
  }
  const cmdMap = new Map<string, CmdAgg>()

  for (const r of rows) {
    const key = r.command
    const agg = cmdMap.get(key) ?? { count: 0, errors: 0, latencies: [], jqCount: 0, totalBytes: 0 }
    agg.count++
    if (r.exit_code !== 0) agg.errors++
    agg.latencies.push(r.latency_ms)
    agg.totalBytes += r.output_bytes ?? 0
    const flags = r.flags_used ?? []
    if (flags.some((f) => f === "jq" || f === "--jq")) agg.jqCount++
    cmdMap.set(key, agg)
  }

  const commands = Array.from(cmdMap.entries())
    .map(([command, agg]) => {
      return {
        command,
        count: agg.count,
        errorRate: agg.count > 0 ? agg.errors / agg.count : 0,
        avgLatencyMs: agg.latencies.length > 0
          ? Math.round(agg.latencies.reduce((s, v) => s + v, 0) / agg.latencies.length)
          : 0,
        avgTokens: Math.round(agg.totalBytes / agg.count / 4),
        jqUsage: agg.count > 0 ? agg.jqCount / agg.count : 0,
      }
    })
    .sort((a, b) => b.count - a.count)

  // ── Agent signals ─────────────────────────────────────────────────────────────

  const hasFlag = (flags: string[], name: string) =>
    flags.some((f) => f === name || f === `--${name}`)

  const schemeCount = rows.filter((r) => hasFlag(r.flags_used ?? [], "schema")).length
  const jqCount     = rows.filter((r) => hasFlag(r.flags_used ?? [], "jq")).length
  const helpCount   = rows.filter((r) =>
    hasFlag(r.flags_used ?? [], "help") || r.command.endsWith("help")
  ).length

  const agentSignals = {
    schemeCallRate: totalInvocations > 0 ? schemeCount / totalInvocations : 0,
    jqUsageRate: totalInvocations > 0 ? jqCount / totalInvocations : 0,
    helpCallRate: totalInvocations > 0 ? helpCount / totalInvocations : 0,
  }

  // ── Error breakdown ───────────────────────────────────────────────────────────

  type ErrKey = string
  const errMap = new Map<ErrKey, number>()
  for (const r of rows) {
    if (r.exit_code === 0 || !r.error_type) continue
    const key = `${r.error_type}::${r.command}`
    errMap.set(key, (errMap.get(key) ?? 0) + 1)
  }

  const errors = Array.from(errMap.entries())
    .map(([key, count]) => {
      const [errorType, command] = key.split("::")
      return { errorType, command, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  // ── Daily series ──────────────────────────────────────────────────────────────

  const dayMap = new Map<string, { invocations: number; errors: number }>()
  for (const r of rows) {
    const date = r.occurred_at.slice(0, 10)
    const d = dayMap.get(date) ?? { invocations: 0, errors: 0 }
    d.invocations++
    if (r.exit_code !== 0) d.errors++
    dayMap.set(date, d)
  }

  const dailySeries = Array.from(dayMap.entries())
    .map(([date, d]) => ({ date, ...d }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return Response.json({
    summary: {
      totalInvocations,
      errorRate,
      p50LatencyMs,
      avgOutputTokens,
      activeSessionsLast24h,
      isActive,
    },
    commands,
    agentSignals,
    errors,
    dailySeries,
  })
}
