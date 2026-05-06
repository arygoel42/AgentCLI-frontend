import { describe, it, expect } from "vitest"
import { generateInstallScript, generateNpmPackage } from "./github-releases"

describe("generateInstallScript", () => {
  it("embeds cli name, owner, repo", () => {
    const script = generateInstallScript("stripe", "petl-cli", "stripe-cli")
    expect(script).toContain('CLI_NAME="stripe"')
    expect(script).toContain('OWNER="petl-cli"')
    expect(script).toContain('REPO="stripe-cli"')
  })

  it("installs to /usr/local/bin with sudo fallback", () => {
    const script = generateInstallScript("mycli", "org", "repo")
    expect(script).toContain('INSTALL_DIR="/usr/local/bin"')
    expect(script).toContain("sudo mv")
  })

  it("rejects unsupported OS", () => {
    const script = generateInstallScript("mycli", "org", "repo")
    expect(script).toContain("Unsupported OS")
    // windows falls through to the wildcard case
    expect(script).not.toContain("windows")
  })
})

describe("generateNpmPackage", () => {
  const files = generateNpmPackage("stripe", "petl-cli", "stripe-cli", "1.2.3")

  it("returns exactly the three expected paths", () => {
    expect([...files.keys()].sort()).toEqual([
      "npm/bin/run.js",
      "npm/package.json",
      "npm/scripts/install.js",
    ])
  })

  describe("package.json", () => {
    const pkg = JSON.parse(files.get("npm/package.json")!)

    it("uses the @petl-cli scope by default", () => {
      expect(pkg.name).toBe("@petl-cli/stripe")
    })

    it("uses a custom scope when provided", () => {
      const custom = generateNpmPackage("mycli", "o", "r", "1.0.0", "@myorg")
      const p = JSON.parse(custom.get("npm/package.json")!)
      expect(p.name).toBe("@myorg/mycli")
    })

    it("sets the version", () => {
      expect(pkg.version).toBe("1.2.3")
    })

    it("points bin entry at bin/run.js", () => {
      expect(pkg.bin).toEqual({ stripe: "bin/run.js" })
    })

    it("runs postinstall via scripts/install.js", () => {
      expect(pkg.scripts.postinstall).toBe("node scripts/install.js")
    })
  })

  describe("scripts/install.js", () => {
    const script = files.get("npm/scripts/install.js")!

    it("embeds cli name, owner, repo, version", () => {
      expect(script).toContain("const CLI_NAME = 'stripe'")
      expect(script).toContain("const OWNER = 'petl-cli'")
      expect(script).toContain("const REPO = 'stripe-cli'")
      expect(script).toContain("const VERSION = '1.2.3'")
    })

    it("maps win32 to windows platform", () => {
      expect(script).toContain("win32: 'windows'")
    })

    it("appends .exe on windows", () => {
      expect(script).toContain("platform === 'windows' ? '.exe' : ''")
    })

    it("builds the download URL from github releases", () => {
      expect(script).toContain("releases/download/v")
      expect(script).toContain("github.com/")
    })

    it("follows redirects", () => {
      // GitHub release asset URLs redirect; the script must handle 301/302
      expect(script).toContain("302")
      expect(script).toContain("301")
    })

    it("chmods the binary on non-windows", () => {
      expect(script).toContain("chmodSync")
      expect(script).toContain("platform !== 'windows'")
    })
  })

  describe("bin/run.js", () => {
    const run = files.get("npm/bin/run.js")!

    it("uses spawnSync with inherited stdio", () => {
      expect(run).toContain("spawnSync")
      expect(run).toContain("stdio: 'inherit'")
    })

    it("forwards all argv", () => {
      expect(run).toContain("process.argv.slice(2)")
    })

    it("exits with the child process status", () => {
      expect(run).toContain("process.exit(result.status")
    })

    it("appends .exe on win32", () => {
      expect(run).toContain("win32")
      expect(run).toContain(".exe")
    })

    it("prints a helpful error if binary is missing", () => {
      expect(run).toContain("binary not found")
      expect(run).toContain("npm install -g")
    })
  })
})
