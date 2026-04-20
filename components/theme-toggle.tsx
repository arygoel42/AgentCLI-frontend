"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  variant?: "icon" | "full"
  collapsed?: boolean
}

export function ThemeToggle({ variant = "icon", collapsed = false }: Props) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"
  const next = isDark ? "light" : "dark"
  const label = isDark ? "Light mode" : "Dark mode"
  const Icon = isDark ? Sun : Moon

  function toggle() {
    setTheme(next)
  }

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        aria-label={label}
        title={label}
        className="flex items-center justify-center w-9 h-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        {mounted ? <Icon className="w-4 h-4" /> : <div className="w-4 h-4" />}
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center w-full rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
        collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
      )}
    >
      {mounted ? <Icon className="w-4 h-4 shrink-0" /> : <div className="w-4 h-4 shrink-0" />}
      {!collapsed && label}
    </button>
  )
}
