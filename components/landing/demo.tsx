"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const defaultSpec = `openapi: 3.0.0
info:
  title: Users API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List all users
      operationId: listUsers
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
    post:
      summary: Create user
      operationId: createUser
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                email:
                  type: string
  /users/{id}:
    get:
      summary: Get user by ID
      operationId: getUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string`

const agentOutput = `{
  "users": [
    {
      "id": "usr_a1b2c3",
      "name": "Alex Rivera",
      "email": "alex@company.com",
      "created": "2026-03-15"
    },
    {
      "id": "usr_d4e5f6",
      "name": "Jordan Chen",
      "email": "jordan@company.com",
      "created": "2026-03-12"
    },
    {
      "id": "usr_g7h8i9",
      "name": "Sam Taylor",
      "email": "sam@company.com",
      "created": "2026-03-10"
    }
  ],
  "total": 3,
  "page": 1
}`

const humanOutput = `┌─ Users [3] ─────────────────────────────────────┐
│                                                 │
│   ID           NAME          EMAIL              │
│   ─────────────────────────────────────────     │
│   usr_a1b2c3   Alex Rivera   alex@company.com   │
│   usr_d4e5f6   Jordan Chen   jordan@company.com │
│   usr_g7h8i9   Sam Taylor    sam@company.com    │
│                                                 │
│   Page 1 of 1                                   │
│                                                 │
└─────────────────────────────────────────────────┘`

const generatedSchema = `$ users-cli --help

Commands:
  list-users    List all users
  create-user   Create user
  get-user      Get user by ID

Options:
  --agent      Output structured JSON
  --human      Output human-readable format
  --help       Show help

$ users-cli list-users --agent`

export function Demo() {
  const [mode, setMode] = useState<"agent" | "human">("agent")
  const [spec, setSpec] = useState(defaultSpec)

  return (
    <section className="px-6 py-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Mode Toggle */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-lg">
            <button
              onClick={() => setMode("agent")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                mode === "agent"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              --agent
            </button>
            <button
              onClick={() => setMode("human")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                mode === "human"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              --human
            </button>
          </div>
          <span className="text-sm text-muted-foreground font-mono">
            ~{mode === "agent" ? "85" : "180"} tokens
          </span>
        </div>

        {/* Demo Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input: OpenAPI Spec */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-muted-foreground font-mono ml-2">
                openapi.yaml
              </span>
            </div>
            <div className="bg-secondary/30 rounded-lg border border-border/50 overflow-hidden">
              <textarea
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                className="w-full h-[400px] p-4 bg-transparent font-mono text-sm text-foreground/90 resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Output: Generated CLI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-muted-foreground font-mono ml-2">
                terminal
              </span>
            </div>
            <div className="bg-secondary/30 rounded-lg border border-border/50 overflow-hidden">
              <div className="h-[400px] p-4 font-mono text-sm overflow-auto">
                <pre className="text-muted-foreground whitespace-pre-wrap">
                  {generatedSchema}
                </pre>
                <div className="mt-4 pt-4 border-t border-border/30">
                  <pre
                    className={cn(
                      "whitespace-pre transition-all duration-300",
                      mode === "agent" ? "text-emerald-400/90" : "text-foreground/90"
                    )}
                  >
                    {mode === "agent" ? agentOutput : humanOutput}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
