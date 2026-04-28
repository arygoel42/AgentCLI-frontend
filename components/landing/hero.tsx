"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { LoginDialog } from "@/components/auth/login-dialog"

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 py-24 overflow-hidden text-center">
      <div className="relative z-10 max-w-5xl mx-auto space-y-10">
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[1.05]">
          Build agent interfaces from your {" "}
          <span style={{ color: "var(--green)" }}>API</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
          Create and deploy a CLI in minutes with Petl
        </p>
        <div className="flex justify-center">
          <LoginDialog>
            <Button
              size="lg"
              className="gap-2 text-lg px-10 py-6 h-auto"
              style={{ backgroundColor: "var(--green)", color: "#000", border: "none", cursor: "pointer"}}
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </LoginDialog>
        </div>
      </div>
    </section>
  )
}
