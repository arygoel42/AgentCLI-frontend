import { describe, it, expect } from "vitest"
import { validateRepoName } from "./github"

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
