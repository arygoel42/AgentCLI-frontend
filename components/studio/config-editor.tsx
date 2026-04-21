"use client"

import { useState, useTransition, useCallback } from "react"
import { toast } from "sonner"
import {
  Terminal, Globe, Lock, FolderTree, Sparkles,
  Save, Plus, Trash2, GripVertical, ChevronRight,
} from "lucide-react"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { YamlPanel } from "./yaml-panel"
import { parseConfig, serializeConfig, type CliConfig, type ResourceNode } from "@/lib/parse-yml"
import { saveConfig } from "@/app/dashboard/projects/[id]/actions"
import type { PreviewApi } from "@/lib/engine"

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "cli" | "environments" | "security" | "resources" | "agent"

const SECTION_YAML_KEY: Record<string, string> = {
  cli: "cli",
  environments: "environments",
  security: "security_schemes",
  resources: "resources",
}

// ─── Method badge ─────────────────────────────────────────────────────────────

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  get:    { bg: "rgba(59,130,246,0.15)",  text: "#60a5fa" },
  post:   { bg: "var(--green-glow)",      text: "var(--green)" },
  put:    { bg: "rgba(245,158,11,0.15)",  text: "#fbbf24" },
  patch:  { bg: "rgba(139,92,246,0.15)", text: "#a78bfa" },
  delete: { bg: "rgba(239,68,68,0.15)",  text: "#f87171" },
}

function MethodBadge({ method }: { method: string }) {
  const s = METHOD_COLORS[method.toLowerCase()] ?? { bg: "rgba(156,163,175,0.15)", text: "#9ca3af" }
  return (
    <span
      className="shrink-0 text-[9px] font-bold font-mono px-1 py-0.5 rounded uppercase"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {method.slice(0, 3).toUpperCase()}
    </span>
  )
}

// ─── CLI Identity section ─────────────────────────────────────────────────────

function CliSection({ config, onChange }: { config: CliConfig; onChange: (c: CliConfig) => void }) {
  const cli = config.cli ?? {}
  function set(key: keyof typeof cli, val: string) {
    onChange({ ...config, cli: { ...cli, [key]: val } })
  }
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">CLI Identity</h3>
      <div className="space-y-3">
        {([
          ["name", "Binary name", "my-api", false],
          ["env_prefix", "Env prefix", "MY_API", true],
          ["version", "Version", "0.1.0", true],
        ] as [keyof typeof cli, string, string, boolean][]).map(([key, label, placeholder, mono]) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground block mb-1">{label}</label>
            <input
              value={cli[key] ?? ""}
              onChange={(e) => set(key, e.target.value)}
              placeholder={placeholder}
              className={`w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground/40 ${mono ? "font-mono" : ""}`}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        The binary name becomes the CLI command (kebab-case). The env prefix is prepended to all
        environment variables the CLI reads.
      </p>
    </div>
  )
}

// ─── Environments section ─────────────────────────────────────────────────────

function EnvironmentsSection({ config, onChange }: { config: CliConfig; onChange: (c: CliConfig) => void }) {
  const envs = config.environments ?? {}
  const entries = Object.entries(envs)

  function setEntry(oldKey: string, newKey: string, val: string) {
    const updated: Record<string, string> = {}
    for (const [k, v] of Object.entries(envs)) {
      if (k === oldKey) updated[newKey || oldKey] = val
      else updated[k] = v
    }
    onChange({ ...config, environments: updated })
  }

  function addEntry() {
    onChange({ ...config, environments: { ...envs, "": "" } })
  }

  function removeEntry(key: string) {
    const updated = { ...envs }
    delete updated[key]
    onChange({ ...config, environments: updated })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Environments</h3>
      <div className="space-y-2">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground">No environments defined.</p>
        )}
        {entries.map(([key, val], idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              defaultValue={key}
              onBlur={(e) => setEntry(key, e.target.value, val)}
              placeholder="production"
              className="w-28 shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-foreground/40"
            />
            <input
              value={val}
              onChange={(e) => setEntry(key, key, e.target.value)}
              placeholder="https://api.example.com"
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-mono outline-none focus:border-foreground/40"
            />
            <button onClick={() => removeEntry(key)} className="text-muted-foreground hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addEntry}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add environment
      </button>
    </div>
  )
}

// ─── Security section (read-only) ────────────────────────────────────────────

function SecuritySection({ api }: { api: PreviewApi }) {
  const schemes = api.auth ?? []
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Security</h3>
      {schemes.length === 0 ? (
        <p className="text-xs text-muted-foreground">No authentication schemes detected in this spec.</p>
      ) : (
        <div className="space-y-2">
          {schemes.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-xs font-medium">{s.id}</p>
                <p className="text-xs text-muted-foreground">
                  {s.type}{s.scheme ? ` · ${s.scheme}` : ""}{s.in ? ` · in ${s.in}` : ""}{s.name ? ` · ${s.name}` : ""}
                </p>
              </div>
              <code className="text-[10px] font-mono text-muted-foreground">{s.env_var}</code>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Lock className="w-3 h-3" /> Edit security in the YAML panel to make changes.
      </p>
    </div>
  )
}

// ─── Resources section with drag + drop ──────────────────────────────────────

type DragState = { cmdKey: string; fromGroup: string }

function ResourcesSection({ config, onChange }: { config: CliConfig; onChange: (c: CliConfig) => void }) {
  const resources = config.resources ?? {}
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState("")
  const [renamingGroup, setRenamingGroup] = useState<string | null>(null)
  const [renamingCmd, setRenamingCmd] = useState<{ group: string; key: string } | null>(null)

  function renameCommand(groupName: string, oldKey: string, newKey: string) {
    const safe = newKey.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
    if (!safe || safe === oldKey) { setRenamingCmd(null); return }
    const node = resources[groupName]
    const methods: Record<string, string> = {}
    for (const [k, v] of Object.entries(node.methods ?? {})) {
      methods[k === oldKey ? safe : k] = v
    }
    onChange({ ...config, resources: { ...resources, [groupName]: { ...node, methods } } })
    setRenamingCmd(null)
  }

  function moveCommand(from: string, cmdKey: string, to: string) {
    if (from === to) return
    const r = { ...resources }
    const src = { ...r[from], methods: { ...(r[from]?.methods ?? {}) } }
    const dst = { ...r[to], methods: { ...(r[to]?.methods ?? {}) } }
    const val = src.methods[cmdKey]
    delete src.methods[cmdKey]
    dst.methods[cmdKey] = val
    onChange({ ...config, resources: { ...r, [from]: src, [to]: dst } })
  }

  function removeCommand(group: string, cmdKey: string) {
    const r = { ...resources }
    const node = { ...r[group], methods: { ...(r[group]?.methods ?? {}) } }
    delete node.methods[cmdKey]
    onChange({ ...config, resources: { ...r, [group]: node } })
  }

  function renameGroup(oldName: string, newName: string) {
    if (!newName.trim() || newName === oldName) { setRenamingGroup(null); return }
    const key = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const r: Record<string, ResourceNode> = {}
    for (const [k, v] of Object.entries(resources)) {
      r[k === oldName ? key : k] = v
    }
    onChange({ ...config, resources: r })
    setRenamingGroup(null)
  }

  function addGroup() {
    const raw = newGroupName.trim()
    if (!raw) return
    const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    onChange({ ...config, resources: { ...resources, [key]: { methods: {} } } })
    setNewGroupName("")
  }

  function removeGroup(name: string) {
    const r = { ...resources }
    delete r[name]
    onChange({ ...config, resources: r })
  }

  const groupEntries = Object.entries(resources)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Resources</h3>
        <span className="text-xs text-muted-foreground">Drag commands between groups</span>
      </div>

      {groupEntries.length === 0 && (
        <p className="text-xs text-muted-foreground">No resources defined yet.</p>
      )}

      {groupEntries.map(([groupName, node]) => {
        const methods = Object.entries(node.methods ?? {})
        const isDragTarget = dragOverGroup === groupName && dragState?.fromGroup !== groupName
        return (
          <div
            key={groupName}
            className="rounded-lg border transition-all"
            style={
              isDragTarget
                ? { borderColor: "var(--green)", backgroundColor: "var(--green-glow)" }
                : { borderColor: "var(--border)" }
            }
            onDragOver={(e) => { e.preventDefault(); setDragOverGroup(groupName) }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverGroup(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragState) moveCommand(dragState.fromGroup, dragState.cmdKey, groupName)
              setDragOverGroup(null)
            }}
          >
            {/* Group header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-t-lg">
              {renamingGroup === groupName ? (
                <input
                  autoFocus
                  defaultValue={groupName}
                  onBlur={(e) => renameGroup(groupName, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") renameGroup(groupName, (e.target as HTMLInputElement).value)
                    if (e.key === "Escape") setRenamingGroup(null)
                  }}
                  className="flex-1 text-xs font-semibold bg-transparent outline-none border-b border-foreground/30"
                />
              ) : (
                <button
                  onDoubleClick={() => setRenamingGroup(groupName)}
                  className="flex-1 text-xs font-semibold text-left hover:text-foreground transition-colors"
                  title="Double-click to rename"
                >
                  {groupName}
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">
                    {methods.length} command{methods.length !== 1 ? "s" : ""}
                  </span>
                </button>
              )}
              <button
                onClick={() => removeGroup(groupName)}
                className="text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Commands */}
            <div className="p-2 space-y-1 min-h-[40px]">
              {methods.length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-2 border border-dashed border-border rounded">
                  Drop commands here
                </div>
              )}
              {methods.map(([cmdKey, methodPath]) => {
                const [method, path] = methodPath.split(" ")
                const isDragging = dragState?.cmdKey === cmdKey && dragState?.fromGroup === groupName
                return (
                  <div
                    key={cmdKey}
                    draggable
                    onDragStart={() => setDragState({ cmdKey, fromGroup: groupName })}
                    onDragEnd={() => { setDragState(null); setDragOverGroup(null) }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded bg-background border border-border text-xs cursor-grab active:cursor-grabbing hover:border-foreground/20 transition-all group"
                    style={isDragging ? { opacity: 0.4 } : undefined}
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                    <MethodBadge method={method ?? "get"} />
                    {renamingCmd?.group === groupName && renamingCmd?.key === cmdKey ? (
                      <input
                        autoFocus
                        defaultValue={cmdKey}
                        className="flex-1 text-xs font-medium bg-transparent outline-none border-b border-foreground/40 min-w-0"
                        onBlur={(e) => renameCommand(groupName, cmdKey, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameCommand(groupName, cmdKey, (e.target as HTMLInputElement).value)
                          if (e.key === "Escape") setRenamingCmd(null)
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="flex-1 font-medium truncate cursor-text"
                        title="Double-click to rename"
                        onDoubleClick={(e) => { e.stopPropagation(); setRenamingCmd({ group: groupName, key: cmdKey }) }}
                      >
                        {cmdKey}
                      </span>
                    )}
                    <code className="text-muted-foreground font-mono text-[10px] truncate max-w-[100px] hidden sm:block">
                      {path}
                    </code>
                    <button
                      onClick={() => removeCommand(groupName, cmdKey)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all ml-0.5 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}

              {/* Subresources (read-only display) */}
              {node.subresources && Object.keys(node.subresources).length > 0 && (
                <div className="mt-1 pl-2 border-l-2 border-border space-y-1">
                  {Object.entries(node.subresources).map(([subName, subNode]) => (
                    <div key={subName} className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      <span className="font-medium">{subName}</span>
                      <span>— {Object.keys(subNode.methods ?? {}).length} cmd(s)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Add group */}
      <div className="flex items-center gap-2 mt-2">
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addGroup()}
          placeholder="add-group-name"
          className="flex-1 rounded-md border border-dashed border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-foreground/40"
        />
        <button
          onClick={addGroup}
          disabled={!newGroupName.trim()}
          className="flex items-center justify-center w-7 h-7 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Agent features placeholder ───────────────────────────────────────────────

function AgentFeaturesContent() {
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

// ─── Main ConfigEditor ────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Section; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "cli",          label: "CLI Identity",  Icon: Terminal },
  { id: "environments", label: "Environments",  Icon: Globe },
  { id: "security",     label: "Security",      Icon: Lock },
  { id: "resources",    label: "Resources",     Icon: FolderTree },
]

type ConfigEditorProps = {
  cliId: string
  initialConfigYml: string
  api: PreviewApi
}

export function ConfigEditor({ cliId, initialConfigYml, api }: ConfigEditorProps) {
  const [config, setConfig] = useState<CliConfig>(() => parseConfig(initialConfigYml))
  const [yamlStr, setYamlStr] = useState(initialConfigYml)
  const [activeSection, setActiveSection] = useState<Section>("cli")
  const [isPending, startTransition] = useTransition()

  const updateConfig = useCallback((newConfig: CliConfig) => {
    setConfig(newConfig)
    setYamlStr(serializeConfig(newConfig))
  }, [])

  function handleYamlChange(newYml: string) {
    setYamlStr(newYml)
    const parsed = parseConfig(newYml)
    if (Object.keys(parsed).length > 0) setConfig(parsed)
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await saveConfig(cliId, yamlStr)
        toast.success("Config saved")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Save failed")
      }
    })
  }

  const yamlHighlightKey = activeSection !== "agent" ? (SECTION_YAML_KEY[activeSection] ?? null) : null

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left section nav */}
      <div className="w-44 shrink-0 border-r border-border flex flex-col bg-background">
        <div className="flex-1 py-2">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeSection === id
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
                style={
                  active
                    ? { backgroundColor: "var(--green-glow)", borderLeft: "2px solid var(--green)", color: "var(--foreground)", fontWeight: 500 }
                    : { borderLeft: "2px solid transparent", color: "var(--muted-foreground)" }
                }
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            )
          })}
        </div>

        <div className="border-t border-border py-2">
          <button
            onClick={() => setActiveSection("agent")}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors"
            style={
              activeSection === "agent"
                ? { backgroundColor: "var(--green-glow)", borderLeft: "2px solid var(--green)", color: "var(--foreground)", fontWeight: 500 }
                : { borderLeft: "2px solid transparent", color: "var(--muted-foreground)" }
            }
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            Agent Features
          </button>
        </div>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--green)", color: "#000" }}
          >
            <Save className="w-3 h-3" />
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Main content */}
      {activeSection === "agent" ? (
        <div className="flex-1">
          <AgentFeaturesContent />
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
          <ResizablePanel defaultSize={55} minSize={30}>
            <ScrollArea className="h-full">
              <div className="p-6 max-w-xl">
                {activeSection === "cli"          && <CliSection config={config} onChange={updateConfig} />}
                {activeSection === "environments" && <EnvironmentsSection config={config} onChange={updateConfig} />}
                {activeSection === "security"     && <SecuritySection api={api} />}
                {activeSection === "resources"    && <ResourcesSection config={config} onChange={updateConfig} />}
              </div>
            </ScrollArea>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={45} minSize={25}>
            <YamlPanel yml={yamlStr} highlightKey={yamlHighlightKey} onChange={handleYamlChange} />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  )
}
