# Engine Context: `/release` Endpoint

This document is for whoever is working on the engine service. It explains exactly what the frontend needs from a new `/release` endpoint so that the release pipeline (GitHub Releases + Homebrew) can work.

---

## Background

The engine is a Go service that currently exposes two endpoints:

- **`POST /preview`** — parses an OpenAPI spec and returns a structured JSON representation of the API (commands, groups, auth schemes, etc.)
- **`POST /build`** — accepts an OpenAPI spec + YAML config and returns a **zip file** containing the generated Go CLI source code (and compiled binary) for the **current platform only**

The frontend takes the zip from `/build`, extracts it, and pushes the files to a GitHub repo (the user's provisioned repo). This is the "build" flow — it generates source and pushes to GitHub for development purposes.

We now need a **`/release`** flow. The difference is: instead of building for the current platform, we need to **cross-compile for all target platforms** and return all binaries in a single zip. The frontend then uploads those binaries as GitHub Release assets and generates a Homebrew formula.

---

## What we need: `POST /release`

### Request

Same multipart form fields as `/build`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spec` | file | yes | The OpenAPI spec file (JSON or YAML). Same as `/build`. |
| `config` | file | no | The `clicreator.yml` config file. Same as `/build`. |
| `module` | string | no | Go module path override. Same as `/build`. |
| `notes` | string | no | Plain markdown appended to SKILL.md under `## Notes`. Same as `/build`. |
| `version` | string | yes | Semver string, e.g. `0.2.0`. Used to name binaries. |
| `cli_name` | string | yes | The CLI binary name, e.g. `mycli`. Used to name binaries. |

The `version` and `cli_name` fields are new — `/build` doesn't need them because it's just generating source. `/release` needs them to name the output binaries correctly.

### What the endpoint should do internally

1. Parse the spec + config (same as `/build`)
2. Generate the Go CLI source code (same as `/build`)
3. Cross-compile for all 5 target platforms using `GOOS`/`GOARCH`:

| Target | GOOS | GOARCH |
|--------|------|--------|
| macOS Apple Silicon | `darwin` | `arm64` |
| macOS Intel | `darwin` | `amd64` |
| Linux x86-64 | `linux` | `amd64` |
| Linux ARM64 | `linux` | `arm64` |
| Windows x86-64 | `windows` | `amd64` |

4. Package all 5 binaries into a single zip and return it

### Response

**Content-Type:** `application/zip`

**Body:** A zip file with this exact structure:

```
release.zip
├── {cli_name}-darwin-arm64
├── {cli_name}-darwin-amd64
├── {cli_name}-linux-amd64
├── {cli_name}-linux-arm64
└── {cli_name}-windows-amd64.exe
```

Where `{cli_name}` is the value from the `cli_name` form field. No subdirectories — flat zip, binaries at root level.

**Example:** if `cli_name=petl` and `version=0.2.0`, the zip contains:

```
petl-darwin-arm64
petl-darwin-amd64
petl-linux-amd64
petl-linux-arm64
petl-windows-amd64.exe
```

The `.exe` extension on the Windows binary is required — Homebrew and the frontend both key off the filename to identify the platform.

### Error response

On any error, return JSON (same as `/build`):

```json
{ "error": "human-readable error message" }
```

With an appropriate HTTP status code (400 for bad input, 500 for compile failures).

---

## How the frontend uses the response

For context, here is exactly what the frontend does after receiving the zip:

```
1. Receive zip → extract all 5 binaries into memory as Buffers
2. Compute SHA256 of each binary (needed for Homebrew formula integrity check)
3. Create a GitHub Release tagged v{version} on the user's repo
4. Upload all 5 binaries as release assets → get stable download URLs
5. Generate a Homebrew Ruby formula using those URLs + SHA256s
6. Commit the formula to a shared tap repo
```

The frontend **does not** care about any source files in the zip — only the compiled binaries. If it's easier to include source files alongside the binaries that's fine, but the frontend will ignore anything that doesn't match the `{cli_name}-{os}-{arch}` naming pattern.

---

## Notes on cross-compilation

Go handles cross-compilation natively with no extra toolchain needed for pure Go code:

```bash
GOOS=linux GOARCH=arm64 go build -o petl-linux-arm64 .
GOOS=darwin GOARCH=arm64 go build -o petl-darwin-arm64 .
# etc.
```

If the generated CLI has CGO dependencies this gets more complicated (needs a cross-compilation toolchain per target). If that's the case, disabling CGO (`CGO_ENABLED=0`) is the standard fix and works for most CLI use cases:

```bash
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o petl-linux-amd64 .
```

The 5 compiles can run in parallel to keep the endpoint fast.

---

## Relationship to `/build`

`/release` is **not** a replacement for `/build`. They serve different purposes:

- `/build` → current platform only, used during development to push source to GitHub and iterate
- `/release` → all platforms, used when the user is ready to ship a versioned release to end users

Both endpoints should continue to exist. `/release` can reuse whatever internal code generation logic `/build` uses — the only difference is the compile step at the end.

---

## Summary

New endpoint: `POST /release`

- Same inputs as `/build`, plus `version` (string) and `cli_name` (string)
- Cross-compiles for 5 targets: `darwin/arm64`, `darwin/amd64`, `linux/amd64`, `linux/arm64`, `windows/amd64`
- Returns a flat zip containing 5 binaries named `{cli_name}-{os}-{arch}` (`.exe` suffix for Windows)
- On error: `{ "error": "..." }` with appropriate HTTP status
