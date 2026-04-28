"use client"

import { Button } from "@/components/ui/button"
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
              className="font-mono gap-2 text-base md:text-lg px-6 py-5 h-auto rounded-md group"
              style={{
                backgroundColor: "transparent",
                color: "var(--green)",
                border: "1px solid var(--green)",
                cursor: "pointer",
                boxShadow: "0 0 0 0 rgba(16,185,129,0.0)",
              }}
            >
              <span style={{ color: "var(--green)" }}>$</span>
              <span className="tracking-tight">petl init</span>
              <span
                className="inline-block w-[8px] h-[16px] align-middle"
                style={{
                  backgroundColor: "var(--green)",
                  animation: "terminal-blink 1s step-end infinite",
                }}
              />
            </Button>
          </LoginDialog>
        </div>
      </div>
    </section>
  )
}
