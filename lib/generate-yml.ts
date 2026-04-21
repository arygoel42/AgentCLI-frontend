import type { PreviewApi, CommandGroup, AuthScheme } from "./engine"

export function sanitizeName(s: string | undefined | null): string {
  if (!s) return "mycli"
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "mycli"
}

function toScreamingSnake(s: string): string {
  return sanitizeName(s).replace(/-/g, "_").toUpperCase()
}

function toKebabCase(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[_\s/{}]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

function indent(n: number): string {
  return "  ".repeat(n)
}

function buildAuthBlock(auth: AuthScheme[] | undefined | null): string[] {
  if (!auth || auth.length === 0) return []
  const lines: string[] = []

  // security_schemes
  lines.push("security_schemes:")
  for (const scheme of auth) {
    if (scheme.type === "oauth2") continue
    lines.push(`${indent(1)}${scheme.id}:`)
    if (scheme.type === "http") {
      lines.push(`${indent(2)}type: http`)
      lines.push(`${indent(2)}scheme: ${scheme.scheme ?? "bearer"}`)
    } else if (scheme.type === "apiKey") {
      lines.push(`${indent(2)}type: apiKey`)
      lines.push(`${indent(2)}in: ${scheme.in ?? "header"}`)
      lines.push(`${indent(2)}name: ${scheme.name ?? "X-Api-Key"}`)
    }
  }

  // security
  lines.push("")
  lines.push("security:")
  for (const scheme of auth) {
    lines.push(`${indent(1)}- ${scheme.id}: []`)
  }

  // client_settings — only first scheme
  const first = auth[0]
  if (first && first.type !== "oauth2") {
    lines.push("")
    lines.push("client_settings:")
    lines.push(`${indent(1)}opts:`)
    lines.push(`${indent(2)}api_key:`)
    lines.push(`${indent(3)}type: string`)
    lines.push(`${indent(3)}read_env: ${first.env_var}`)
    lines.push(`${indent(3)}auth:`)
    lines.push(`${indent(4)}security_scheme: ${first.id}`)
  }

  return lines
}

type ResourceNode = {
  group?: CommandGroup
  children: Map<string, ResourceNode>
}

function buildResourceTree(groups: CommandGroup[]): Map<string, ResourceNode> {
  const tree = new Map<string, ResourceNode>()

  function ensurePath(path: string[]): ResourceNode {
    let current = tree
    let node!: ResourceNode
    for (const seg of path) {
      if (!current.has(seg)) {
        current.set(seg, { children: new Map() })
      }
      node = current.get(seg)!
      current = node.children
    }
    return node
  }

  for (const group of groups) {
    const fullPath = [...(group.parent_path ?? []), group.name]
    const node = ensurePath(fullPath)
    node.group = group
  }

  return tree
}

function buildMethodKey(method: string, path: string): string {
  return toKebabCase(`${method}-${path}`)
}

function renderMethods(group: CommandGroup, depth: number): string[] {
  const lines: string[] = []
  const commands = group.commands ?? []
  const nameCounts = new Map<string, number>()
  for (const cmd of commands) {
    nameCounts.set(cmd.name, (nameCounts.get(cmd.name) ?? 0) + 1)
  }

  lines.push(`${indent(depth)}methods:`)
  const usedKeys = new Set<string>()
  for (const cmd of commands) {
    let key = cmd.name
    if ((nameCounts.get(cmd.name) ?? 0) > 1) {
      key = toKebabCase(cmd.original_operation_id || buildMethodKey(cmd.http_method, cmd.path))
    }
    if (usedKeys.has(key)) {
      key = `${cmd.http_method.toLowerCase()}-${key}`
    }
    usedKeys.add(key)
    lines.push(`${indent(depth + 1)}${key}: "${cmd.http_method.toLowerCase()} ${cmd.path}"`)
  }
  return lines
}

function renderNode(name: string, node: ResourceNode, depth: number): string[] {
  const lines: string[] = []
  lines.push(`${indent(depth)}${name}:`)
  if (node.group && (node.group.commands?.length ?? 0) > 0) {
    lines.push(...renderMethods(node.group, depth + 1))
  }
  if (node.children.size > 0) {
    lines.push(`${indent(depth + 1)}subresources:`)
    for (const [childName, childNode] of node.children) {
      lines.push(...renderNode(childName, childNode, depth + 2))
    }
  }
  return lines
}

export function generateYml(api: PreviewApi): string {
  const cliName = sanitizeName(api.name)
  const envPrefix = toScreamingSnake(cliName)

  const lines: string[] = []

  lines.push("cli:")
  lines.push(`${indent(1)}name: ${cliName}`)
  lines.push(`${indent(1)}env_prefix: ${envPrefix}`)
  lines.push(`${indent(1)}version: "0.1.0"`)

  if (api.base_url) {
    lines.push("")
    lines.push("environments:")
    lines.push(`${indent(1)}production: ${api.base_url}`)
  }

  const authLines = buildAuthBlock(api.auth)
  if (authLines.length > 0) {
    lines.push("")
    lines.push(...authLines)
  }

  if (api.groups?.length > 0) {
    lines.push("")
    lines.push("resources:")
    const tree = buildResourceTree(api.groups)
    for (const [name, node] of tree) {
      lines.push(...renderNode(name, node, 1))
    }
  }

  return lines.join("\n")
}
