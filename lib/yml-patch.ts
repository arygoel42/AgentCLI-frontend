/**
 * Patches a scalar value at a YAML key path (e.g. ["cli", "name"]).
 * Only handles simple nested scalars — not arrays or multi-level maps beyond 2 levels.
 */
export function patchScalar(yml: string, keyPath: string[], value: string): string {
  if (keyPath.length === 0) return yml

  if (keyPath.length === 1) {
    const key = keyPath[0]
    const re = new RegExp(`^(${key}:\\s*)(.*)$`, "m")
    if (re.test(yml)) {
      return yml.replace(re, `$1${value}`)
    }
    return yml + `\n${key}: ${value}`
  }

  // Two-level: find parent key, then child key in its block
  const [parent, child] = keyPath
  const parentRe = new RegExp(`^(${parent}:)`, "m")
  const match = parentRe.exec(yml)
  if (!match) return yml

  const afterParent = yml.slice(match.index + match[0].length)
  const childRe = new RegExp(`^(\\s+${child}:\\s*)(.*)$`, "m")
  if (childRe.test(afterParent)) {
    const patched = afterParent.replace(childRe, `$1${value}`)
    return yml.slice(0, match.index + match[0].length) + patched
  }
  return yml
}

/**
 * Replaces the entire content of a top-level YAML section.
 * `newContent` should be the indented lines that follow the section key (without the key itself).
 */
export function patchSection(yml: string, sectionKey: string, newContent: string): string {
  // Match sectionKey: at start of a line, capture everything until the next top-level key or end
  const sectionRe = new RegExp(
    `(^${sectionKey}:[ \\t]*\\n)([\\s\\S]*?)(?=^[a-zA-Z_][a-zA-Z0-9_]*:|$)`,
    "m"
  )
  const replacement = `$1${newContent}\n`
  if (sectionRe.test(yml)) {
    return yml.replace(sectionRe, replacement)
  }
  // Section doesn't exist — append it
  return yml.trimEnd() + `\n\n${sectionKey}:\n${newContent}\n`
}
