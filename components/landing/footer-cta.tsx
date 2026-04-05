"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FooterCta() {
  return (
    <section className="px-6 py-32">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <p className="text-muted-foreground text-lg">
          Built for the agent era.
        </p>
        <h2 className="text-3xl md:text-5xl font-medium tracking-tight">
          Generate your CLI.
        </h2>
        <div className="pt-4">
          <Button size="lg" className="gap-2 text-base px-8">
            Get started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
