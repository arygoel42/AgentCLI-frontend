import yaml from "js-yaml"

export type CliSection = {
  name?: string
  env_prefix?: string
  version?: string
}

export type ResourceNode = {
  methods?: Record<string, string>
  subresources?: Record<string, ResourceNode>
}

export type CliConfig = {
  cli?: CliSection
  environments?: Record<string, string>
  security_schemes?: Record<string, unknown>
  security?: unknown[]
  client_settings?: unknown
  resources?: Record<string, ResourceNode>
}

const KEY_ORDER = ["cli", "environments", "security_schemes", "security", "client_settings", "resources"]

export function parseConfig(yml: string): CliConfig {
  if (!yml?.trim()) return {}
  try {
    return (yaml.load(yml) as CliConfig) ?? {}
  } catch {
    return {}
  }
}

export function serializeConfig(config: CliConfig): string {
  const ordered: Record<string, unknown> = {}
  for (const key of KEY_ORDER) {
    const v = (config as Record<string, unknown>)[key]
    if (v !== undefined && v !== null) ordered[key] = v
  }
  return yaml.dump(ordered, { indent: 2, lineWidth: -1, noRefs: true, sortKeys: false })
}

export function findSectionLines(
  yml: string,
  sectionKey: string
): { start: number; end: number } {
  const lines = yml.split("\n")
  const topLevel = /^[a-z_][a-z0-9_]*:/
  let start = -1
  let end = lines.length

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${sectionKey}:`)) {
      start = i
    } else if (start >= 0 && topLevel.test(lines[i]) && !lines[i].startsWith(`${sectionKey}:`)) {
      end = i
      break
    }
  }
  return { start, end }
}
