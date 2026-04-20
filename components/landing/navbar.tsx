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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="w-5 h-5" style={{ color: "var(--green)" }} />
          <span className="font-bold tracking-tight text-xl">
            pe<span style={{ color: "var(--green)" }}>t</span>l
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Demo
          </a>
          <a href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            GitHub
          </a>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {status === "authenticated" ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href="/dashboard" className="text-sm">Dashboard</a>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <LoginDialog>
                <Button variant="ghost" size="sm" className="text-sm">
                  Sign in
                </Button>
              </LoginDialog>
              <LoginDialog>
                <Button size="sm" className="text-sm" style={{ backgroundColor: "var(--green)", color: "#000", border: "none" }}>
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
