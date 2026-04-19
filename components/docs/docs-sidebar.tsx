"use client"

import { useEffect, useRef, useState } from "react"
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

const allIds = sections.flatMap(s => s.items.map(i => i.id))

export function DocsSidebar() {
  const [active, setActive] = useState("quickstart")
  // Track which sections are currently visible
  const visibleRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleRef.current.add(entry.target.id)
          } else {
            visibleRef.current.delete(entry.target.id)
          }
        })
        // Pick the topmost visible section in document order
        const topmost = allIds.find(id => visibleRef.current.has(id))
        if (topmost) setActive(topmost)
      },
      {
        // Trigger when section enters the top 30% of the viewport
        rootMargin: "-56px 0px -60% 0px",
        threshold: 0,
      }
    )

    allIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <aside className="w-52 shrink-0 sticky top-[72px] self-start hidden lg:block max-h-[calc(100vh-88px)] overflow-y-auto">
      <nav className="space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map(item => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={cn(
                      "block text-sm w-full text-left px-2 py-1 rounded transition-colors",
                      active === item.id
                        ? "text-foreground font-medium bg-muted"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
