import { auth } from "@/lib/auth"
import { Octokit } from "@octokit/rest"
import { NextRequest } from "next/server"

function botToken(): string {
  const token = process.env.GITHUB_BOT_TOKEN
  if (!token) throw new Error("GITHUB_BOT_TOKEN is not set")
  return token
}

// Maps the Actions job name (from the workflow matrix) to the canonical platform string.
const PLATFORM_FROM_JOB_NAME: Record<string, string> = {
  "Build darwin-arm64":  "darwin-arm64",
  "Build darwin-amd64":  "darwin-amd64",
  "Build linux-amd64":   "linux-amd64",
  "Build linux-arm64":   "linux-arm64",
  "Build windows-amd64": "windows-amd64",
}

// Proxies the GitHub Actions API using the server-side bot token so the OAuth
// token is never exposed to the browser.
//
// Query params:
//   owner      — repo owner (required)
//   repo       — repo name (required)
//   run_id     — specific run to query (preferred once known)
//   commit_sha — used to find the run when run_id is not yet known
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const owner = searchParams.get("owner")
  const repo  = searchParams.get("repo")
  const runId = searchParams.get("run_id")
  const tag   = searchParams.get("tag") // e.g. "v0.1.1" — used to find the run before run_id is known

  if (!owner || !repo) {
    return Response.json({ error: "owner and repo are required" }, { status: 400 })
  }

  if (!runId && !tag) {
    return Response.json({ error: "run_id or tag is required" }, { status: 400 })
  }

  const octokit = new Octokit({ auth: botToken() })

  try {
    let resolvedRunId: number

    if (runId) {
      resolvedRunId = parseInt(runId, 10)
    } else {
      // For tag-triggered runs GitHub sets head_branch to the tag name (e.g. "v0.1.1"),
      // so filtering by branch is more reliable than head_sha for tag pushes.
      const { data: runs } = await octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        branch: tag!,
        event: "push",
        per_page: 5,
      })
      const run = runs.workflow_runs[0]
      if (!run) {
        // Actions hasn't started yet — return empty state, frontend will retry
        return Response.json({
          runId: null,
          runStatus: "queued",
          runConclusion: null,
          runUrl: null,
          jobs: [],
        })
      }
      // Return the run summary from the list response immediately — skip the
      // extra getWorkflowRun + listJobs calls while still in the queued phase
      // to halve the number of GitHub API calls per poll tick.
      if (run.status === "queued") {
        return Response.json({
          runId: run.id,
          runStatus: run.status,
          runConclusion: run.conclusion,
          runUrl: run.html_url,
          jobs: [],
        })
      }
      resolvedRunId = run.id
    }

    // Fetch run summary and individual job statuses in parallel
    const [runRes, jobsRes] = await Promise.all([
      octokit.actions.getWorkflowRun({ owner, repo, run_id: resolvedRunId }),
      octokit.actions.listJobsForWorkflowRun({ owner, repo, run_id: resolvedRunId, per_page: 20 }),
    ])

    const run  = runRes.data
    const jobs = jobsRes.data.jobs
      .filter((j) => j.name.startsWith("Build "))
      .map((j) => ({
        name:           j.name,
        platform:       PLATFORM_FROM_JOB_NAME[j.name] ?? j.name,
        status:         j.status as string,
        conclusion:     j.conclusion as string | null,
        stepsTotal:     j.steps?.length ?? 0,
        stepsCompleted: j.steps?.filter((s) => s.status === "completed").length ?? 0,
      }))

    return Response.json({
      runId:         resolvedRunId,
      runStatus:     run.status,
      runConclusion: run.conclusion,
      runUrl:        run.html_url,
      jobs,
    })
  } catch (err) {
    console.error("[api/releases/status]", err)
    return Response.json({ error: "Failed to fetch Actions status" }, { status: 500 })
  }
}
