"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"
import { LoginDialog } from "@/components/auth/login-dialog"
import { UserMenu } from "@/components/auth/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navbar() {
  const { status } = useSession()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-8 h-18 flex items-center justify-between" style={{ height: '72px' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <Leaf className="w-6 h-6" style={{ color: "var(--green)" }} />
          <span className="font-bold tracking-tight text-2xl">
            pe<span style={{ color: "var(--green)" }}>t</span>l
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <a href="#demo" className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium">
            Demo
          </a>
          <a href="/docs" className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium">
            Docs
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-base text-muted-foreground hover:text-foreground transition-colors font-medium">
            GitHub
          </a>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {status === "authenticated" ? (
            <>
              <Button variant="ghost" asChild className="text-base">
                <a href="/dashboard">Dashboard</a>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <LoginDialog>
                <Button variant="ghost" className="text-base px-4">
                  Sign in
                </Button>
              </LoginDialog>
              <LoginDialog>
                <Button className="text-base px-5 py-2 h-auto" style={{ backgroundColor: "var(--green)", color: "#000", border: "none" }}>
                  Get started
                </Button>
              </LoginDialog>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
