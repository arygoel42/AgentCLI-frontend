"use client"

import { useEffect, useState } from "react"
import { Loader2, RefreshCw } from "lucide-react"

type FeedbackRow = {
  id: string
  message: string
  command_context: string | null
  agent_type: string | null
  cli_version: string
  created_at: string
}

export function FeedbackTab({ cliId, cliName }: { cliId: string; cliName: string }) {
  const [events, setEvents] = useState<FeedbackRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${cliId}/feedback`, { cache: "no-store" })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error ?? "Failed to load feedback")
      setEvents(body.events ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliId])

  return (
    <div className="flex-1 min-w-0 overflow-y-auto">
      <div className="p-6 max-w-5xl">
        <div className="mb-4 flex items-baseline justify-between">
          <div>
            <h3 className="text-sm font-semibold">Agent feedback</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submitted by agents via{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">
                {cliName} feedback &quot;...&quot;
              </code>
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {!error && events !== null && events.length === 0 && (
          <div className="rounded border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
            No feedback yet.
          </div>
        )}

        {events !== null && events.length > 0 && (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Submitted</th>
                  <th className="px-3 py-2 font-medium">Agent</th>
                  <th className="px-3 py-2 font-medium">Version</th>
                  <th className="px-3 py-2 font-medium">About</th>
                  <th className="px-3 py-2 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {events.map((row) => (
                  <tr key={row.id} className="border-t border-border align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.agent_type ?? <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground font-mono">
                      {row.cli_version}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.command_context ? (
                        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                          {row.command_context}
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-pre-wrap">{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
