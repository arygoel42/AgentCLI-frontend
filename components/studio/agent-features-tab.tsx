"use client"

import { Sparkles } from "lucide-react"

export function AgentFeaturesTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "var(--green-glow)" }}
      >
        <Sparkles className="w-6 h-6" style={{ color: "var(--green)" }} />
      </div>
      <p className="text-sm font-medium text-foreground">Agent features coming soon</p>
      <p className="text-xs text-center max-w-xs">
        MCP server generation, tool schemas, AI-native CLI patterns, and more.
      </p>
    </div>
  )
}
