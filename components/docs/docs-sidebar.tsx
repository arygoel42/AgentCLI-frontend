"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export const sections = [
  {
    title: "Getting Started",
    items: [
      { id: "quickstart", label: "Quickstart" },
      { id: "concepts", label: "Core Concepts" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { id: "authentication", label: "Authentication" },
      { id: "clis", label: "CLIs" },
      { id: "versions", label: "Versions" },
      { id: "metrics", label: "Metrics" },
    ],
  },
  {
    title: "Telemetry",
    items: [
      { id: "telemetry-overview", label: "How It Works" },
      { id: "privacy", label: "Privacy Model" },
      { id: "event-schema", label: "Event Schema" },
    ],
  },
]

const HEADER_HEIGHT = 56 // px — matches the h-14 header

export function DocsSidebar() {
  const [active, setActive] = useState("quickstart")

  useEffect(() => {
    const allItems = sections.flatMap(s => s.items)

    function onScroll() {
      // Find the last section whose top is above the midpoint of the viewport
      const midpoint = window.scrollY + window.innerHeight * 0.3

      let current = allItems[0].id
      for (const item of allItems) {
        const el = document.getElementById(item.id)
        if (!el) continue
        if (el.offsetTop - HEADER_HEIGHT <= midpoint) {
          current = item.id
        }
      }
      setActive(current)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll() // set initial active on mount
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT - 16
    window.scrollTo({ top, behavior: "smooth" })
  }

  return (
    <aside className="w-52 shrink-0 sticky top-16 self-start hidden lg:block">
      <nav className="space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map(item => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollTo(item.id)}
                    className={cn(
                      "text-sm w-full text-left px-2 py-1 rounded transition-colors",
                      active === item.id
                        ? "text-foreground font-medium bg-muted"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
