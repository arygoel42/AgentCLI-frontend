"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Github, ExternalLink, Copy, Check,
  Loader2, RefreshCw, Package, AlertCircle, Terminal, Box, CheckCircle2,
} from "lucide-react"

type ReleaseStatus = "idle" | "in_progress" | "completed" | "failed"

type ReleaseShellProps = {
  cliId: string
  cliName: string
  version: string | null
  latestReleaseVersion: string | null
  latestReleaseUrl: string | null
  latestReleaseAt: string | null
  buildsSinceRelease: number
  initialReleaseStatus: ReleaseStatus
  initialReleaseError: string | null
  provisioningStatus: string
  repoOwner: string | null
  repoName: string | null
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
      <code className="flex-1 text-[11px] font-mono text-foreground whitespace-pre-wrap break-all leading-relaxed">
        {code}
      </code>
      <CopyButton text={code} />
    </div>
  )
}

function ComingSoonCard({ icon: Icon, label, description }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 flex items-start gap-3 opacity-50 cursor-not-allowed select-none">
      <Icon className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold">{label}</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
            Coming soon
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

function bumpPatch(version: string): string {
  const parts = version.split(".")
  if (parts.length !== 3) return version
  const patch = parseInt(parts[2], 10)
  if (isNaN(patch)) return version
  return `${parts[0]}.${parts[1]}.${patch + 1}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function HistorySidebar({
  entries,
}: {
  entries: { version: string; url: string | null; releasedAt: string | null }[]
}) {
  return (
    <aside className="w-56 shrink-0 border-l border-border px-4 py-6 overflow-y-auto">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
        Release history
      </p>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No releases yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div key={e.version} className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "var(--green)" }} />
                <span className="text-xs font-mono font-semibold">v{e.version}</span>
              </div>
              {e.releasedAt && (
                <p className="text-[10px] text-muted-foreground pl-4">{formatDate(e.releasedAt)}</p>
              )}
              {e.url && (
                <a
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors pl-4"
                >
                  GitHub <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}

// The release page is always a "ready to release" form on load.
// completed is a historical result — show it only when triggered in this session.
// failed is preserved so the user sees the error on reload.
function computeInitialStatus(dbStatus: ReleaseStatus): ReleaseStatus {
  if (dbStatus === "completed") return "idle"
  return dbStatus
}

export function ReleaseShell({
  cliId,
  cliName,
  version,
  latestReleaseVersion,
  latestReleaseUrl: initialReleaseUrl,
  latestReleaseAt,
  buildsSinceRelease,
  initialReleaseStatus,
  initialReleaseError,
  provisioningStatus,
  repoOwner,
  repoName,
}: ReleaseShellProps) {
  const router = useRouter()

  const [status, setStatus]         = useState<ReleaseStatus>(
    computeInitialStatus(initialReleaseStatus)
  )
  const [error, setError]           = useState<string | null>(initialReleaseError)
  const [releaseUrl, setReleaseUrl] = useState<string | null>(initialReleaseUrl)
  const [releasedVersion, setReleasedVersion] = useState<string | null>(latestReleaseVersion)
  const [releasedAt, setReleasedAt] = useState<string | null>(latestReleaseAt)

  const canRelease      = provisioningStatus === "completed"
  const alreadyReleased = !!version && version === latestReleaseVersion
  const noVersion       = !version

  const downloadBase =
    repoOwner && repoName && releasedVersion
      ? `https://github.com/${repoOwner}/${repoName}/releases/download/v${releasedVersion}`
      : null

  const installOneliner =
    repoOwner && repoName
      ? `curl -fsSL https://github.com/${repoOwner}/${repoName}/releases/latest/download/install.sh | sh`
      : null

  // Build history entries from what we know (latest release only for now)
  const historyEntries =
    latestReleaseVersion
      ? [{ version: latestReleaseVersion, url: initialReleaseUrl, releasedAt: latestReleaseAt }]
      : []

  async function handleRelease() {
    setStatus("in_progress")
    setError(null)
    try {
      const res = await fetch(`/api/releases/${cliId}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setStatus("failed")
        setError(data.error ?? "Release failed")
      } else {
        const now = new Date().toISOString()
        setStatus("completed")
        setReleaseUrl(data.releaseUrl)
        setReleasedVersion(data.version)
        setReleasedAt(now)
        router.refresh()
      }
    } catch (err) {
      setStatus("failed")
      setError(err instanceof Error ? err.message : "Release failed")
    }
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.push(`/dashboard/projects/${cliId}`)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to studio
        </button>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs text-muted-foreground">{cliName}</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs font-medium">Release</span>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 py-10">
          <div className="max-w-xl w-full mx-auto space-y-8">

            {/* ── In progress ── */}
            {status === "in_progress" && (
              <div className="rounded-xl border border-border p-10 flex flex-col items-center gap-4 text-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--green)" }} />
                <div>
                  <p className="text-sm font-semibold">Releasing {cliName}…</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cross-compiling for all platforms and uploading to GitHub. This takes about 30–60 seconds.
                  </p>
                </div>
              </div>
            )}

            {/* ── Failed ── */}
            {status === "failed" && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-red-400 shrink-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-sm font-semibold">Release failed</p>
                  </div>
                  <button
                    onClick={() => { setStatus("idle"); setError(null) }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Try again
                  </button>
                </div>
                <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all max-h-48 overflow-y-auto leading-relaxed">
                  {error}
                </pre>
              </div>
            )}

            {/* ── Completed ── */}
            {status === "completed" && releaseUrl && (
              <div className="space-y-6">
                <div className="rounded-xl border p-5 space-y-1.5" style={{ borderColor: "var(--green)", backgroundColor: "var(--green-glow)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>
                    v{releasedVersion} released
                  </p>
                  <a
                    href={releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {releaseUrl}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-5">
                  <h2 className="text-sm font-semibold">Install instructions</h2>

                  {installOneliner && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                        One-liner (macOS + Linux)
                      </p>
                      <CodeBlock code={installOneliner} />
                      <p className="text-[10px] text-muted-foreground pl-0.5">
                        Auto-detects OS and architecture, always installs the latest release.
                      </p>
                    </div>
                  )}

                  {downloadBase && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1.5">
                        <Github className="w-3.5 h-3.5 text-muted-foreground" />
                        Direct download
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: "macOS (Apple Silicon)", suffix: "darwin-arm64" },
                          { label: "macOS (Intel)",         suffix: "darwin-amd64" },
                          { label: "Linux (x86-64)",        suffix: "linux-amd64"  },
                          { label: "Linux (ARM64)",         suffix: "linux-arm64"  },
                        ].map(({ label, suffix }) => (
                          <div key={suffix} className="space-y-0.5">
                            <CodeBlock
                              code={`curl -L ${downloadBase}/${cliName}-${suffix} -o ${cliName} && chmod +x ${cliName} && sudo mv ${cliName} /usr/local/bin/`}
                            />
                            <p className="text-[10px] text-muted-foreground pl-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/dashboard/projects/${cliId}`)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to studio to bump version for next release
                </button>
              </div>
            )}

            {/* ── Idle / configure ── */}
            {status === "idle" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-lg font-semibold">Release {cliName}</h1>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cross-compile for all platforms and publish to GitHub Releases.
                  </p>
                </div>

                {/* Version */}
                <div className="rounded-lg border border-border p-4 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Version</p>
                  {noVersion ? (
                    <p className="text-xs text-yellow-400">
                      No version set. Add a <code className="font-mono">version</code> field under <code className="font-mono">cli:</code> in your config.
                    </p>
                  ) : alreadyReleased ? (
                    <p className="text-xs text-yellow-400">
                      <code className="font-mono">v{version}</code> is already released. Bump the version in your config to release again.
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold font-mono" style={{ color: "var(--green)" }}>
                        v{version}
                      </span>
                      {latestReleaseVersion && (
                        <span className="text-xs text-muted-foreground">(previously v{latestReleaseVersion})</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Unreleased builds warning */}
                {buildsSinceRelease > 0 && latestReleaseVersion && (
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 space-y-0.5">
                    <p className="text-xs font-semibold text-yellow-400">
                      {buildsSinceRelease} build{buildsSinceRelease !== 1 ? "s" : ""} since last release
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Consider bumping to{" "}
                      <code className="font-mono">v{bumpPatch(latestReleaseVersion)}</code> before releasing.
                    </p>
                  </div>
                )}

                {/* Channels */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Channels</p>

                  <div className="rounded-lg border border-border p-4 flex items-start gap-3">
                    <Github className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">GitHub Releases + install script</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Uploads 5 platform binaries and a <code className="font-mono">install.sh</code> one-liner as release assets.
                      </p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground shrink-0">
                      Always on
                    </span>
                  </div>

                  <ComingSoonCard
                    icon={Package}
                    label="Homebrew"
                    description="Commit a formula to a shared tap so users can brew install your CLI."
                  />

                  <ComingSoonCard
                    icon={Box}
                    label="npm / npx"
                    description="Publish a thin npm wrapper so users can run your CLI with npx."
                  />
                </div>

                {/* Release button */}
                <button
                  onClick={handleRelease}
                  disabled={!canRelease || noVersion || alreadyReleased}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--green)", color: "#000" }}
                  title={
                    !canRelease       ? "Repo must be provisioned first"
                    : noVersion       ? "Set a version in your config"
                    : alreadyReleased ? "Bump the version to release again"
                    : undefined
                  }
                >
                  Release v{version ?? "?"}
                </button>

                {!canRelease && (
                  <p className="text-xs text-center text-muted-foreground">
                    Repo provisioning must complete before you can release.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — version history */}
        <HistorySidebar
          entries={
            releasedVersion
              ? [{ version: releasedVersion, url: releaseUrl, releasedAt: releasedAt }]
              : historyEntries
          }
        />
      </div>
    </div>
  )
}
