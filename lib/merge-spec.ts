import { generateYml } from "./generate-yml"
import { parseConfig, serializeConfig } from "./parse-yml"
import type { PreviewApi } from "./engine"

/**
 * Merges a new spec into an existing config YAML.
 *
 * The new spec is truth for everything it specifies: resources, methods, auth
 * schemes, base URL, client settings. Three values are derived-not-specified —
 * the engine picks them from the spec at creation time but the spec doesn't
 * mandate them — so we preserve the user's versions:
 *   - cli.name       (sanitized from info.title; user may have renamed the binary)
 *   - cli.env_prefix (derived from cli.name; changing it breaks existing env vars)
 *   - cli.version    (pure release versioning; spec has no say here)
 *
 * Non-production environments (staging, dev, etc.) are user-added and have no
 * spec equivalent, so they are merged on top of the new production URL.
 */
export function mergeSpecIntoConfig(newApi: PreviewApi, oldConfigYml: string): string {
  const freshYml = generateYml(newApi)
  const freshConfig = parseConfig(freshYml)
  const oldConfig = parseConfig(oldConfigYml)

  const merged = { ...freshConfig }

  // Preserve the three derived-not-specified cli scalars
  if (freshConfig.cli) {
    merged.cli = { ...freshConfig.cli }
    const old = oldConfig.cli ?? {}
    if (old.name) merged.cli.name = old.name
    if (old.env_prefix) merged.cli.env_prefix = old.env_prefix
    if (old.version) merged.cli.version = old.version
  }

  // Merge non-production environments from old config on top of new production URL
  const oldEnvs = oldConfig.environments ?? {}
  const nonProd = Object.fromEntries(
    Object.entries(oldEnvs).filter(([k]) => k !== "production")
  )
  if (Object.keys(nonProd).length > 0) {
    merged.environments = { ...(freshConfig.environments ?? {}), ...nonProd }
  }

  return serializeConfig(merged)
}
