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
  }
  previewData: PreviewResponse
}

export function StudioShell({ cli, previewData }: StudioShellProps) {
  return (
    <div className="flex flex-col h-screen">
      <StudioHeader cliName={cli.name} cliId={cli.id} />
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
