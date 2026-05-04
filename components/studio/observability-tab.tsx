"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, Activity, Hash, AlertTriangle, Users } from "lucide-react"

type ObsSummary = {
  totalInvocations: number
  errorRate: number
  p50LatencyMs: number
  avgOutputTokens: number
  activeSessionsLast24h: number
  isActive: boolean
}

type ObsCommand = {
  command: string
  count: number
  errorRate: number
  avgLatencyMs: number
  avgTokens: number
  jqUsage: number
}

type ObsAgentSignals = {
  schemeCallRate: number
  jqUsageRate: number
  helpCallRate: number
}

type ObsError = {
  errorType: string
  command: string
  count: number
}

type ObsDayPoint = {
  date: string
  invocations: number
  errors: number
}

type ObsData = {
  summary: ObsSummary
  commands: ObsCommand[]
  agentSignals: ObsAgentSignals
  errors: ObsError[]
  dailySeries: ObsDayPoint[]
}

type Range = "24h" | "7d" | "30d"

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

function ms(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}s`
  return `${n}ms`
}

function tokenColor(tokens: number): string {
  if (tokens > 2000) return "#f87171"
  if (tokens > 500) return "#fbbf24"
  return "var(--green)"
}

function StatCard({
  label,
  value,
  sub,
  Icon,
  danger,
  valueColor,
}: {
  label: string
  value: string
  sub?: string
  Icon: React.ComponentType<{ className?: string }>
  danger?: boolean
  valueColor?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/10 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${danger ? "text-red-400" : "text-muted-foreground"}`} />
      </div>
      <div
        className={`text-2xl font-semibold tabular-nums ${danger ? "text-red-400" : ""}`}
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function Sparkline({ series, height = 40 }: { series: ObsDayPoint[]; height?: number }) {
  if (series.length === 0) return null
  const max = Math.max(...series.map((d) => d.invocations), 1)
  const w = 100 / series.length
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {series.map((d) => {
        const barH = Math.max(2, (d.invocations / max) * height)
        const hasError = d.errors > 0
        return (
          <div
            key={d.date}
            title={`${d.date}: ${d.invocations} calls, ${d.errors} errors`}
            className="flex-1 rounded-sm transition-opacity hover:opacity-80 cursor-default"
            style={{
              height: barH,
              backgroundColor: hasError ? "rgba(248,113,113,0.6)" : "var(--green)",
              minWidth: 2,
              maxWidth: `${w}%`,
            }}
          />
        )
      })}
    </div>
  )
}

export function ObservabilityTab({ cliId }: { cliId: string }) {
  const [data, setData] = useState<ObsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>("7d")
  const [sortBy, setSortBy] = useState<"count" | "errorRate" | "avgTokens">("count")

  async function load(r: Range) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/observability/${cliId}?range=${r}`, { cache: "no-store" })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Failed to load observability data")
      setData(body as ObsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliId, range])

  const sortedCommands = data
    ? [...data.commands].sort((a, b) => {
        if (sortBy === "errorRate") return b.errorRate - a.errorRate
        if (sortBy === "avgTokens") return b.avgTokens - a.avgTokens
        return b.count - a.count
      })
    : []

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Observability</h3>
            {data && (
              <span
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={
                  data.summary.isActive
                    ? { backgroundColor: "var(--green-glow)", color: "var(--green)" }
                    : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: data.summary.isActive ? "var(--green)" : "currentColor" }}
                />
                {data.summary.isActive ? "Active" : "No activity 24h"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(["24h", "7d", "30d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="text-[11px] px-2.5 py-1 rounded-md border transition-colors"
                style={
                  range === r
                    ? { borderColor: "var(--green)", backgroundColor: "var(--green-glow)", color: "var(--green)" }
                    : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
                }
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => load(range)}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 ml-1"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {data && data.summary.totalInvocations === 0 && (
          <div className="rounded border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">No invocations yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Agents using this CLI will appear here automatically.
            </p>
          </div>
        )}

        {data && data.summary.totalInvocations > 0 && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard
                label="Total invocations"
                value={data.summary.totalInvocations.toLocaleString()}
                sub={range}
                Icon={Activity}
              />
              <StatCard
                label="Error rate"
                value={pct(data.summary.errorRate)}
                sub={`${Math.round(data.summary.errorRate * data.summary.totalInvocations)} errors`}
                Icon={AlertTriangle}
                danger={data.summary.errorRate > 0.1}
              />
              <StatCard
                label="Avg tokens / call"
                value={data.summary.avgOutputTokens.toLocaleString()}
                sub="estimated from output"
                Icon={Hash}
                valueColor={tokenColor(data.summary.avgOutputTokens)}
              />
              <StatCard
                label="Active sessions"
                value={data.summary.activeSessionsLast24h.toString()}
                sub="last 24h"
                Icon={Users}
              />
            </div>

            {/* Daily sparkline */}
            {data.dailySeries.length > 1 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Daily invocations</span>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: "var(--green)" }} />
                      no errors
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm inline-block bg-red-400/60" />
                      has errors
                    </span>
                  </div>
                </div>
                <Sparkline series={data.dailySeries} height={48} />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{data.dailySeries[0]?.date}</span>
                  <span>{data.dailySeries[data.dailySeries.length - 1]?.date}</span>
                </div>
              </div>
            )}

            {/* Commands table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Commands
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  Sort:
                  {([["count", "Volume"], ["errorRate", "Error rate"], ["avgTokens", "Tokens"]] as [typeof sortBy, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className="px-2 py-0.5 rounded transition-colors"
                      style={
                        sortBy === key
                          ? { backgroundColor: "var(--green-glow)", color: "var(--green)" }
                          : { color: "var(--muted-foreground)" }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Command</th>
                      <th className="px-3 py-2 font-medium text-right">Calls</th>
                      <th className="px-3 py-2 font-medium text-right">Errors</th>
                      <th className="px-3 py-2 font-medium text-right">Avg tokens</th>
                      <th className="px-3 py-2 font-medium text-right">--jq</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCommands.slice(0, 20).map((cmd) => (
                      <tr key={cmd.command} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2 font-mono font-medium">{cmd.command}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {cmd.count.toLocaleString()}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums"
                          style={{ color: cmd.errorRate > 0.1 ? "#f87171" : "var(--muted-foreground)" }}
                        >
                          {pct(cmd.errorRate)}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums"
                          style={{ color: cmd.avgTokens > 2000 ? "#f87171" : "var(--muted-foreground)" }}
                        >
                          {cmd.avgTokens.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {pct(cmd.jqUsage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Errors */}
            {data.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Top errors
                </h4>
                <div className="rounded border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium">Type</th>
                        <th className="px-3 py-2 font-medium">Command</th>
                        <th className="px-3 py-2 font-medium text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.errors.map((e, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-red-500/10 text-red-400">
                              {e.errorType}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-muted-foreground">{e.command}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {e.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
