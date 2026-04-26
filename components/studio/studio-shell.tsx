"use client"

import { StudioHeader } from "./studio-header"
import { ConfigEditor } from "./config-editor"
import type { PreviewResponse } from "@/lib/engine"

type StudioShellProps = {
  cli: {
    id: string
    name: string
    config_yml: string
    spec_content: string
    spec_filename: string
    repo_url?: string | null
    repo_owner?: string | null
    repo_name?: string | null
    invite_sent_at?: string | null
    invite_accepted_at?: string | null
  }
  previewData: PreviewResponse
}

export function StudioShell({ cli, previewData }: StudioShellProps) {
  return (
    <div className="flex flex-col h-screen">
      <StudioHeader
        cliName={cli.name}
        cliId={cli.id}
        repoUrl={cli.repo_url}
        repoOwner={cli.repo_owner}
        repoName={cli.repo_name}
        inviteSentAt={cli.invite_sent_at}
        inviteAcceptedAt={cli.invite_accepted_at}
      />
      <div className="flex-1 overflow-hidden min-h-0">
        <ConfigEditor
          cliId={cli.id}
          initialConfigYml={cli.config_yml}
          api={previewData.api}
        />
      </div>
    </div>
  )
}
