"use client"

import { useEffect, useState } from "react"

const tweets = [
  {
    handle: "@karpathy",
    name: "Andrej Karpathy",
    avatar: "AK",
    text: "CLIs are the universal interface. Every AI agent should speak CLI — it's composable, scriptable, and built for automation. MCP is a layer on top of what CLIs already do natively.",
    time: "2h",
    likes: "3.2K",
  },
  {
    handle: "@swyx",
    name: "swyx",
    avatar: "SW",
    text: "Hot take: CLI > MCP for 90% of agentic use cases. Why add a protocol layer when a well-designed CLI is already the perfect agent interface? stdin/stdout has been solving this since 1970.",
    time: "5h",
    likes: "1.8K",
  },
  {
    handle: "@gdb",
    name: "Greg Brockman",
    avatar: "GB",
    text: "The tools that will power the agentic era aren't new — they're CLIs. Every curl, grep, and jq call your agent makes is proof that the command line is already the native language of automation.",
    time: "1d",
    likes: "4.1K",
  },
  {
    handle: "@nathanbenaich",
    name: "Nathan Benaich",
    avatar: "NB",
    text: "AI-native CLIs are the sleeper hit of 2025. Agents can call them without handshakes, SDKs, or auth flows. Just a binary that does one thing well. This is the unix philosophy for the LLM era.",
    time: "3h",
    likes: "987",
  },
  {
    handle: "@levelsio",
    name: "Pieter Levels",
    avatar: "PL",
    text: "Built my entire AI pipeline around CLIs. No MCP, no custom protocol. Just well-documented commands the agent calls like a senior engineer would. It just works.",
    time: "6h",
    likes: "2.3K",
  },
  {
    handle: "@danluu",
    name: "Dan Luu",
    avatar: "DL",
    text: "The reason CLIs win for agentic workflows: they're self-documenting via --help, composable via pipes, and stateless by default. Every property that makes them great for humans makes them better for AI.",
    time: "12h",
    likes: "1.5K",
  },
]

export function AgentsLoveClis() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % tweets.length)
        setIsTransitioning(false)
      }, 300)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const tweet = tweets[current]

  return (
    <section className="px-6 py-20 border-t border-border/40">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <p className="text-xs tracking-widest uppercase" style={{ color: "var(--green)" }}>
            The shift
          </p>
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight">
            Agents love CLIs
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            The way builders are talking about agent tooling in 2026.
          </p>
        </div>

        {/* Featured tweet */}
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-center">
          {/* Prev preview */}
          <div className="hidden lg:block">
            <PreviewCard
              tweet={tweets[(current - 1 + tweets.length) % tweets.length]}
              onClick={() => setCurrent((current - 1 + tweets.length) % tweets.length)}
              align="left"
            />
          </div>

          {/* Main */}
          <div
            className="rounded-2xl p-6 md:p-7 transition-all duration-300 w-full max-w-xl mx-auto"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateY(6px)" : "translateY(0)",
              backgroundColor: "#000",
              border: "1px solid #2f3336",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-black"
                style={{ backgroundColor: "var(--green)" }}
              >
                {tweet.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-base" style={{ color: "#e7e9ea" }}>
                    {tweet.name}
                  </span>
                  <span className="text-sm" style={{ color: "#71767b" }}>
                    {tweet.handle}
                  </span>
                  <span className="text-sm" style={{ color: "#71767b" }}>
                    · {tweet.time}
                  </span>
                </div>
                <p className="text-base mt-2 leading-relaxed" style={{ color: "#e7e9ea" }}>
                  {tweet.text}
                </p>
                <div className="flex items-center gap-1 mt-4 text-sm" style={{ color: "#71767b" }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{tweet.likes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next preview */}
          <div className="hidden lg:block">
            <PreviewCard
              tweet={tweets[(current + 1) % tweets.length]}
              onClick={() => setCurrent((current + 1) % tweets.length)}
              align="right"
            />
          </div>
        </div>

        {/* Dots */}
        <div className="flex gap-1.5 justify-center">
          {tweets.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === current ? 16 : 6,
                height: 6,
                backgroundColor: i === current ? "var(--green)" : "var(--border)",
                opacity: i === current ? 1 : 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function PreviewCard({
  tweet,
  onClick,
  align,
}: {
  tweet: (typeof tweets)[number]
  onClick: () => void
  align: "left" | "right"
}) {
  return (
    <div
      className="rounded-xl p-4 cursor-pointer transition-all"
      style={{
        backgroundColor: "#000",
        border: "1px solid #2f3336",
        opacity: 0.55,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.55"
      }}
      onClick={onClick}
    >
      <div className={`flex items-center gap-2 mb-2 ${align === "right" ? "justify-end" : ""}`}>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black shrink-0"
          style={{ backgroundColor: "var(--green)", opacity: 0.8 }}
        >
          {tweet.avatar}
        </div>
        <span className="text-xs truncate" style={{ color: "#71767b" }}>
          {tweet.handle}
        </span>
      </div>
      <p className="text-xs line-clamp-3 leading-relaxed" style={{ color: "#71767b" }}>
        {tweet.text}
      </p>
    </div>
  )
}
