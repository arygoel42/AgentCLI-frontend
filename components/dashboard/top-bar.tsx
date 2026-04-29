"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { signOut } from "next-auth/react"
import { Flower, Moon, Sun, User, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ProviderInfo = {
  name: string | null
  email: string
  created_at: string
}

export function TopBar({ provider }: { provider: ProviderInfo }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === "dark"

  const initial = (provider.name ?? provider.email).slice(0, 1).toUpperCase()

  return (
    <>
      <header className="h-14 shrink-0 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Flower className="w-4 h-4" style={{ color: "var(--green)" }} />
          <span className="font-bold tracking-tight text-lg">
            pe<span style={{ color: "var(--green)" }}>t</span>l
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Account menu"
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: "var(--green-glow)", color: "var(--green)" }}
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {provider.name && (
                  <span className="text-sm font-medium truncate">{provider.name}</span>
                )}
                <span className="text-xs text-muted-foreground truncate">{provider.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setAccountOpen(true)}>
              <User className="w-4 h-4" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setTheme(isDark ? "light" : "dark") }}>
              {mounted && isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {mounted && isDark ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account</DialogTitle>
            <DialogDescription>Your petl account details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm pt-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Name</span>
              <span>{provider.name ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email</span>
              <span className="truncate ml-4">{provider.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Member since</span>
              <span>
                {new Date(provider.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
