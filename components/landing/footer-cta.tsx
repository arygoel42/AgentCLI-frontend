"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FooterCta() {
  return (
    <section className="px-6 py-32 relative overflow-hidden">
      {/* subtle green radial glow behind the CTA */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, var(--green-glow), transparent)" }}
      />
      <div className="max-w-2xl mx-auto text-center space-y-8 relative z-10">
        <p className="text-muted-foreground text-lg">
          Built for the agent era.
        </p>
        <h2 className="text-3xl md:text-5xl font-medium tracking-tight">
          Generate your <span style={{ color: "var(--green)" }}>CLI</span>.
        </h2>
        {/* green accent rule */}
        <div className="flex justify-center">
          <div className="h-px w-24" style={{ background: "linear-gradient(to right, transparent, var(--green), transparent)" }} />
        </div>
        <div className="pt-2">
          <Button
            size="lg"
            className="gap-2 text-base px-8"
            style={{ backgroundColor: "var(--green)", color: "#000", border: "none" }}
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
