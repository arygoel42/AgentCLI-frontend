"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CommandGroup, Command } from "@/lib/engine"

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:    { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
  POST:   { bg: "var(--green-glow)",     text: "var(--green)" },
  PUT:    { bg: "rgba(245,158,11,0.15)", text: "#fbbf24" },
  PATCH:  { bg: "rgba(139,92,246,0.15)", text: "#a78bfa" },
  DELETE: { bg: "rgba(239,68,68,0.15)",  text: "#f87171" },
}

function methodStyle(method: string) {
  return METHOD_COLORS[method.toUpperCase()] ?? { bg: "rgba(156,163,175,0.15)", text: "#9ca3af" }
}

type TreeNode = {
  name: string
  group?: CommandGroup
  children: Map<string, TreeNode>
}

function buildTree(groups: CommandGroup[]): Map<string, TreeNode> {
  const tree = new Map<string, TreeNode>()

  function ensurePath(path: string[]): TreeNode {
    let current = tree
    let node!: TreeNode
    for (const seg of path) {
      if (!current.has(seg)) current.set(seg, { name: seg, children: new Map() })
      node = current.get(seg)!
      current = node.children
    }
    return node
  }

  for (const group of (groups ?? [])) {
    const fullPath = [...(group.parent_path ?? []), group.name]
    const node = ensurePath(fullPath)
    node.group = group
  }

  return tree
}

type CommandItemProps = {
  cmd: Command
  groupPath: string
  selected: string | null
  onSelect: (key: string) => void
}

function CommandItem({ cmd, groupPath, selected, onSelect }: CommandItemProps) {
  const key = `${groupPath}/${cmd.name}`
  const isSelected = selected === key
  const { bg, text } = methodStyle(cmd.http_method)

  return (
    <button
      onClick={() => onSelect(key)}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs rounded transition-colors hover:bg-muted/60"
      style={isSelected ? { backgroundColor: "var(--green-glow)" } : undefined}
    >
      <span
        className="shrink-0 text-[9px] font-bold font-mono px-1 py-0.5 rounded uppercase"
        style={{ backgroundColor: bg, color: text }}
      >
        {cmd.http_method.toUpperCase().slice(0, 3)}
      </span>
      <span className="truncate text-foreground/80">{cmd.name}</span>
    </button>
  )
}

type TreeNodeViewProps = {
  name: string
  node: TreeNode
  depth: number
  selected: string | null
  onSelect: (key: string) => void
  parentPath: string
}

function TreeNodeView({ name, node, depth, selected, onSelect, parentPath }: TreeNodeViewProps) {
  const [open, setOpen] = useState(true)
  const currentPath = parentPath ? `${parentPath}/${name}` : name
  const hasContent =
    (node.group?.commands && node.group.commands.length > 0) || node.children.size > 0

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        {open ? (
          <ChevronDown className="w-3 h-3 shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 shrink-0" />
        )}
        {name}
      </button>

      {open && hasContent && (
        <div>
          {node.group?.commands?.map((cmd) => (
            <div key={cmd.name} style={{ paddingLeft: `${depth * 12}px` }}>
              <CommandItem
                cmd={cmd}
                groupPath={currentPath}
                selected={selected}
                onSelect={onSelect}
              />
            </div>
          ))}
          {Array.from(node.children.entries()).map(([childName, childNode]) => (
            <TreeNodeView
              key={childName}
              name={childName}
              node={childNode}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              parentPath={currentPath}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type CommandTreeProps = {
  groups: CommandGroup[]
  selectedCommand: string | null
  onSelectCommand: (key: string) => void
}

export function CommandTree({ groups, selectedCommand, onSelectCommand }: CommandTreeProps) {
  const tree = buildTree(groups)

  return (
    <div className="w-56 shrink-0 border-r border-border flex flex-col">
      <div className="px-3 py-3 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Commands
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {tree.size === 0 ? (
            <p className="px-3 text-xs text-muted-foreground">No commands found</p>
          ) : (
            Array.from(tree.entries()).map(([name, node]) => (
              <TreeNodeView
                key={name}
                name={name}
                node={node}
                depth={0}
                selected={selectedCommand}
                onSelect={onSelectCommand}
                parentPath=""
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
