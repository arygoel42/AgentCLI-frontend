"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { FolderOpen, Settings, LogOut, KeyRound, Leaf, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/dashboard", label: "Projects", icon: FolderOpen },
  { href: "/dashboard/api-key", label: "API Key", icon: KeyRound },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const STORAGE_KEY = "petl.sidebar.collapsed"

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "1") setCollapsed(true)
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
  }

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border bg-background flex flex-col h-screen sticky top-0 transition-[width] duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <Link
        href="/"
        className={cn(
          "border-b border-border flex items-center hover:bg-muted/40 transition-colors",
          collapsed ? "px-0 py-5 justify-center" : "px-4 py-5 gap-2"
        )}
      >
        <Leaf className="w-4 h-4 shrink-0" style={{ color: "var(--green)" }} />
        {!collapsed && (
          <span className="font-bold tracking-tight text-lg">
            pe<span style={{ color: "var(--green)" }}>t</span>l
          </span>
        )}
      </Link>

      <nav className={cn("flex-1 py-4 space-y-1", collapsed ? "px-2" : "px-2")}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-md text-sm transition-colors",
                collapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
                active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              style={active ? { color: "var(--green)" } : undefined}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={active ? { color: "var(--green)" } : undefined}
              />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      {/* green accent line above sign out */}
      <div className="mx-3 h-px" style={{ background: "linear-gradient(to right, var(--green-border), transparent)" }} />
      <div className="px-2 py-2 space-y-1">
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex items-center w-full rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4 shrink-0" />
          ) : (
            <PanelLeftClose className="w-4 h-4 shrink-0" />
          )}
          {!collapsed && "Collapse"}
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex items-center w-full rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
      </div>
    </aside>
  )
}
