export type AuthScheme = {
  id: string
  type: string
  scheme?: string
  name?: string
  in?: string
  env_var: string
  authorize_url?: string
  token_url?: string
  scopes?: Record<string, string>
}

export type Parameter = {
  name: string
  orig_name: string
  location: string
  type: string
  format?: string
  required: boolean
  description: string
  enum: string[]
  default?: string
}

export type Semantics = {
  safe: boolean
  idempotent: boolean
  reversible: boolean
  side_effects: string[]
  impact: string
}

export type Command = {
  name: string
  original_operation_id: string
  description: string
  http_method: string
  path: string
  parameters: Parameter[]
  request_body: unknown | null
  responses: unknown[]
  requires_auth: boolean
  pagination: unknown | null
  semantics: Semantics
}

export type CommandGroup = {
  name: string
  description: string
  parent_path: string[]
  commands: Command[]
}

export type PreviewApi = {
  name: string
  version: string
  description: string
  base_url: string
  auth: AuthScheme[]
  groups: CommandGroup[]
}

export type PreviewResponse = {
  api: PreviewApi
  warnings: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeResponse(raw: any): PreviewResponse {
  const a = raw.api ?? {}
  return {
    api: {
      name: a.Name ?? "",
      version: a.Version ?? "",
      description: a.Description ?? "",
      base_url: a.BaseURL ?? "",
      auth: (a.Auth ?? []).map((s: any) => ({
        id: s.ID ?? s.Id ?? "",
        type: s.Type ?? "",
        scheme: s.Scheme,
        name: s.Name,
        in: s.In ?? s.Location,
        env_var: s.EnvVar ?? s.Env ?? "",
        authorize_url: s.AuthorizeURL,
        token_url: s.TokenURL,
        scopes: s.Scopes,
      })),
      groups: (a.Groups ?? []).map((g: any) => ({
        name: g.Name ?? "",
        description: g.Description ?? "",
        parent_path: g.ParentPath ?? [],
        commands: (g.Commands ?? []).map((c: any) => ({
          name: c.Name ?? "",
          original_operation_id: c.OriginalOperationID ?? "",
          description: c.Description ?? "",
          http_method: c.HTTPMethod ?? "",
          path: c.Path ?? "",
          parameters: (c.Parameters ?? []).map((p: any) => ({
            name: p.Name ?? "",
            orig_name: p.OrigName ?? "",
            location: p.Location ?? "",
            type: p.Type ?? "",
            format: p.Format ?? "",
            required: p.Required ?? false,
            description: p.Description ?? "",
            enum: p.Enum ?? [],
            default: p.Default,
          })),
          request_body: c.RequestBody,
          responses: c.Responses ?? [],
          requires_auth: c.RequiresAuth ?? false,
          pagination: c.Pagination,
          semantics: {
            safe: c.Semantics?.Safe ?? false,
            idempotent: c.Semantics?.Idempotent ?? false,
            reversible: c.Semantics?.Reversible ?? false,
            side_effects: c.Semantics?.SideEffects ?? [],
            impact: c.Semantics?.Impact ?? "low",
          },
        })),
      })),
    },
    warnings: raw.warnings ?? raw.Warnings ?? [],
  }
}

function engineUrl(): string {
  const base = process.env.ENGINE_BASE_URL
  if (!base) throw new Error("ENGINE_BASE_URL is not set")
  return base.replace(/\/$/, "")
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (!res.ok) {
    let msg = `Engine error ${res.status}`
    try {
      const body = await res.json()
      if (body?.error) msg = body.error
    } catch {
      // ignore parse errors
    }
    throw new Error(msg)
  }
}

export async function callPreview(
  specContent: string,
  specFilename: string,
  configYml?: string
): Promise<PreviewResponse> {
  const form = new FormData()
  form.append("spec", new Blob([specContent], { type: "application/octet-stream" }), specFilename)
  if (configYml) {
    form.append("config", new Blob([configYml], { type: "text/plain" }), "clicreator.yml")
  }

  const res = await fetch(`${engineUrl()}/preview`, { method: "POST", body: form })
  await throwIfNotOk(res)
  return normalizeResponse(await res.json())
}

export async function callBuild(
  specContent: string,
  specFilename: string,
  configYml?: string,
  modulePath?: string
): Promise<Response> {
  const form = new FormData()
  form.append("spec", new Blob([specContent], { type: "application/octet-stream" }), specFilename)
  if (configYml) {
    form.append("config", new Blob([configYml], { type: "text/plain" }), "clicreator.yml")
  }
  if (modulePath) form.append("module", modulePath)

  const res = await fetch(`${engineUrl()}/build`, { method: "POST", body: form })
  await throwIfNotOk(res)
  return res
}
