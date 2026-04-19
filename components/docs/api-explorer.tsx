"use client"

import { useState } from "react"
import { Play, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface Field {
  name: string
  placeholder: string
  type?: "text" | "textarea" | "select"
  options?: string[]
}

interface Props {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  endpoint: string
  description: string
  fields?: Field[]
  sampleResponse: string
}

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  POST: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  PUT: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  PATCH: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  DELETE: "text-red-400 bg-red-400/10 border-red-400/30",
}

export function ApiExplorer({ method, endpoint, description, fields = [], sampleResponse }: Props) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState(false)
  const [ran, setRan] = useState(false)

  function buildCurl(): string {
    const hasBody = fields.length > 0 && method !== "GET"
    const bodyObj = hasBody
      ? Object.fromEntries(fields.map(f => [f.name, values[f.name] || `<${f.name}>`]))
      : null

    const ep = fields.reduce((acc, f) => {
      return acc.replace(`:${f.name}`, values[f.name] || `:${f.name}`)
    }, endpoint)

    let curl = `curl -X ${method} https://api.clicreator.dev${ep} \\\n  -H "Authorization: Bearer clicreator_pk_..." \\\n  -H "Content-Type: application/json"`
    if (bodyObj) curl += ` \\\n  -d '${JSON.stringify(bodyObj, null, 2)}'`
    return curl
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span className={cn("text-xs font-bold font-mono px-2 py-0.5 rounded border", METHOD_COLORS[method])}>
          {method}
        </span>
        <code className="text-sm font-mono text-foreground flex-1">{endpoint}</code>
        <span className="text-xs text-muted-foreground hidden sm:block flex-1">{description}</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {fields.length > 0 && (
            <div className="p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Parameters</p>
              {fields.map(field => (
                <div key={field.name} className="space-y-1">
                  <label className="text-xs font-mono text-foreground">{field.name}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                      className="w-full text-xs font-mono bg-background border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-border"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={values[field.name] ?? ""}
                      onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))}
                      className="w-full text-xs font-mono bg-background border border-border rounded px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-border"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Request</p>
            <pre className="bg-[#0d0d0d] rounded p-3 text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
              {buildCurl()}
            </pre>
            <button
              onClick={() => setRan(true)}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              <Play className="w-3 h-3" />
              Run example
            </button>
          </div>

          {ran && (
            <div className="p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sample response <span className="text-emerald-400 ml-2">200 OK</span>
              </p>
              <pre className="bg-[#0d0d0d] rounded p-3 text-xs font-mono text-zinc-300 overflow-x-auto">
                {sampleResponse}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
