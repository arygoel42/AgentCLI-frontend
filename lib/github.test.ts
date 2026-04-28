import { describe, it, expect } from "vitest"
import { mapWithConcurrency, validateRepoName } from "./github"

describe("validateRepoName", () => {
  it("accepts valid names", () => {
    expect(validateRepoName("ticketmaster")).toBeNull()
    expect(validateRepoName("foo-bar")).toBeNull()
    expect(validateRepoName("foo_bar")).toBeNull()
    expect(validateRepoName("foo.bar")).toBeNull()
    expect(validateRepoName("a1")).toBeNull()
  })

  it("rejects empty / missing names", () => {
    expect(validateRepoName("")).toBe("Project name is required")
  })

  it("rejects names that start with a dot or dash", () => {
    expect(validateRepoName(".foo")).toMatch(/can only contain/)
    expect(validateRepoName("-foo")).toMatch(/can only contain/)
  })

  it("rejects names with disallowed characters", () => {
    expect(validateRepoName("foo bar")).toMatch(/can only contain/)
    expect(validateRepoName("foo/bar")).toMatch(/can only contain/)
    expect(validateRepoName("foo@bar")).toMatch(/can only contain/)
  })

  it("rejects names over 100 characters", () => {
    expect(validateRepoName("a".repeat(101))).toMatch(/100 characters/)
    expect(validateRepoName("a".repeat(100))).toBeNull()
  })
})

describe("mapWithConcurrency", () => {
  it("returns results in input order", async () => {
    const out = await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (x) => x * 10)
    expect(out).toEqual([10, 20, 30, 40, 50])
  })

  it("respects the concurrency cap", async () => {
    let inFlight = 0
    let peak = 0
    const items = Array.from({ length: 20 }, (_, i) => i)
    await mapWithConcurrency(items, 3, async () => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise((r) => setTimeout(r, 5))
      inFlight--
    })
    expect(peak).toBeLessThanOrEqual(3)
  })

  it("handles empty input", async () => {
    const out = await mapWithConcurrency([], 5, async () => 1)
    expect(out).toEqual([])
  })

  it("propagates errors", async () => {
    const items = [1, 2, 3]
    await expect(
      mapWithConcurrency(items, 2, async (x) => {
        if (x === 2) throw new Error("boom")
        return x
      })
    ).rejects.toThrow("boom")
  })

  it("handles items count smaller than the limit", async () => {
    const out = await mapWithConcurrency([1, 2], 10, async (x) => x + 1)
    expect(out).toEqual([2, 3])
  })
})
