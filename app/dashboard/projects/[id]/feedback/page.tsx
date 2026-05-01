import { auth } from "@/lib/auth"
import { createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const session = await auth()
  if (!session?.user?.email) redirect("/")

  const supabase = createClient()

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("email", session.user.email)
    .limit(1)
    .single()

  if (!provider) redirect("/")

  const { data: cli } = await supabase
    .from("clis")
    .select("id, name, provider_id")
    .eq("id", id)
    .single()

  if (!cli || cli.provider_id !== provider.id) notFound()

  const { data: events } = await supabase
    .from("feedback_events")
    .select("id, message, command_context, agent_type, cli_version, created_at")
    .eq("cli_id", id)
    .order("created_at", { ascending: false })
    .limit(500)

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Feedback — {cli.name}</h1>
        <span className="text-sm text-muted-foreground">
          {events?.length ?? 0} most recent
        </span>
      </div>

      {!events || events.length === 0 ? (
        <div className="rounded border border-dashed p-10 text-center text-sm text-muted-foreground">
          No feedback yet. Agents using this CLI can submit feedback with{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            {cli.name} feedback &quot;...&quot;
          </code>
          .
        </div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Submitted</th>
                <th className="px-3 py-2 font-medium">Agent</th>
                <th className="px-3 py-2 font-medium">Version</th>
                <th className="px-3 py-2 font-medium">About</th>
                <th className="px-3 py-2 font-medium">Message</th>
              </tr>
            </thead>
            <tbody>
              {events.map((row) => (
                <tr key={row.id} className="border-t align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.agent_type ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {row.cli_version}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.command_context ? (
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">
                        {row.command_context}
                      </code>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-pre-wrap">
                    {row.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
