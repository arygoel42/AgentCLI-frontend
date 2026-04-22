"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState, useRef } from "react"

const codeLines = [
  { num: 1, code: 'export default function Home() {', indent: 0 },
  { num: 2, code: 'return (', indent: 1 },
  { num: 3, code: '<main className="min-h-screen bg-background">', indent: 2 },
  { num: 4, code: '<Navbar />', indent: 3 },
  { num: 5, code: '<CursorEffect />', indent: 3 },
  { num: 6, code: '<Hero />', indent: 3 },
  { num: 7, code: '<SocialProof />', indent: 3 },
  { num: 8, code: '<Problem />', indent: 3 },
  { num: 9, code: '<Pillars />', indent: 3 },
  { num: 10, code: '<Demo />', indent: 3 },
  { num: 11, code: '<Reinforcement />', indent: 3 },
  { num: 12, code: '<FooterCta />', indent: 3 },
  { num: 13, code: '</main>', indent: 2 },
  { num: 14, code: ')', indent: 1 },
  { num: 15, code: '}', indent: 0 },
  { num: 16, code: '', indent: 0 },
  { num: 17, code: 'function Hero() {', indent: 0 },
  { num: 18, code: 'return (', indent: 1 },
  { num: 19, code: '<section className="min-h-[70vh] flex flex-col">', indent: 2 },
  { num: 20, code: '<h1 className="text-6xl font-medium">', indent: 3 },
  { num: 21, code: 'AI-native CLIs generate the future', indent: 4 },
  { num: 22, code: '</h1>', indent: 3 },
  { num: 23, code: '<p className="text-muted-foreground">', indent: 3 },
  { num: 24, code: 'OpenAPI spec in → agent-happy CLI out.', indent: 4 },
  { num: 25, code: '</p>', indent: 3 },
  { num: 26, code: '<Button size="lg">Generate your CLI</Button>', indent: 3 },
  { num: 27, code: '</section>', indent: 2 },
  { num: 28, code: ')', indent: 1 },
  { num: 29, code: '}', indent: 0 },
]

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

interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

function TweetCarousel() {
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % tweets.length)
        setIsTransitioning(false)
      }, 300)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const tweet = tweets[current]

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Main featured tweet */}
      <div
        className="rounded-2xl p-6 transition-all duration-300"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(6px)' : 'translateY(0)',
          backgroundColor: '#000',
          border: '1px solid #2f3336',
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
              <span className="font-semibold text-base" style={{ color: '#e7e9ea' }}>{tweet.name}</span>
              <span className="text-sm" style={{ color: '#71767b' }}>{tweet.handle}</span>
              <span className="text-sm" style={{ color: '#71767b' }}>· {tweet.time}</span>
            </div>
            <p className="text-sm md:text-base mt-2 leading-relaxed" style={{ color: '#e7e9ea' }}>{tweet.text}</p>
            <div className="flex items-center gap-1 mt-4 text-sm" style={{ color: '#71767b' }}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>{tweet.likes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 justify-center mt-1">
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

      {/* Stacked preview cards */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        {[
          (current + 1) % tweets.length,
          (current + 2) % tweets.length,
        ].map((idx) => {
          const t = tweets[idx]
          return (
            <div
              key={idx}
              className="rounded-xl p-3 cursor-pointer transition-colors"
              style={{ backgroundColor: '#000', border: '1px solid #2f3336' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0a0a0a')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#000')}
              onClick={() => setCurrent(idx)}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-black shrink-0"
                  style={{ backgroundColor: "var(--green)", opacity: 0.8 }}
                >
                  {t.avatar}
                </div>
                <span className="text-xs truncate" style={{ color: '#71767b' }}>{t.handle}</span>
              </div>
              <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: '#71767b' }}>{t.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
  const [generateHovered, setGenerateHovered] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [trail, setTrail] = useState<TrailPoint[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setPosition({ x, y })
      setIsVisible(true)
      setTrail(prev => [...prev.slice(-30), { x, y, timestamp: Date.now() }])
    }

    const handleMouseLeave = () => setIsVisible(false)

    section.addEventListener("mousemove", handleMouseMove)
    section.addEventListener("mouseleave", handleMouseLeave)
    return () => {
      section.removeEventListener("mousemove", handleMouseMove)
      section.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  useEffect(() => {
    const animate = () => {
      setSmoothPosition(prev => ({
        x: prev.x + (position.x - prev.x) * 0.08,
        y: prev.y + (position.y - prev.y) * 0.08,
      }))
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [position])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTrail(prev => prev.filter(p => now - p.timestamp < 2000))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[80vh] flex flex-col justify-center px-6 py-24 overflow-hidden"
    >
      {/* Cursor effect layer */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}
      >
        <div className="absolute inset-0 font-mono text-[11px] leading-relaxed p-8 select-none overflow-hidden">
          <div
            className="absolute left-8 top-8"
            style={{
              maskImage: `radial-gradient(circle 250px at ${smoothPosition.x}px ${smoothPosition.y}px, black 0%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(circle 250px at ${smoothPosition.x}px ${smoothPosition.y}px, black 0%, transparent 100%)`,
              transition: 'mask-image 0.3s ease, -webkit-mask-image 0.3s ease',
            }}
          >
            {codeLines.map((line) => (
              <div key={line.num} className="flex whitespace-pre">
                <span className="w-8 text-right pr-4 text-emerald-500/40 select-none">{line.num}</span>
                <span className="text-foreground/50" style={{ paddingLeft: `${line.indent * 16}px` }}>{line.code}</span>
              </div>
            ))}
          </div>
        </div>

        {trail.map((point, i) => {
          const age = Date.now() - point.timestamp
          const opacity = Math.max(0, 1 - age / 2000) * 0.15
          const scale = 1 + (age / 2000) * 0.5
          return (
            <div
              key={`${point.timestamp}-${i}`}
              className="absolute rounded-full bg-foreground/10"
              style={{ left: point.x, top: point.y, width: 100 * scale, height: 100 * scale, transform: 'translate(-50%, -50%)', opacity }}
            />
          )
        })}

        <div
          className="absolute w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: smoothPosition.x,
            top: smoothPosition.y,
            background: `radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 30%, transparent 60%)`,
            transition: 'left 0.15s ease-out, top 0.15s ease-out',
          }}
        />
      </div>

      {/* Split layout */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-center relative z-10 px-4">
        {/* Left: headline + CTA */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight leading-[1.15]">
              <span
                className="block transition-opacity duration-200 mb-1"
                style={{ opacity: generateHovered ? 0.25 : 1 }}
              >
                AI-native CLIs
              </span>
              <span className="block">
                <span
                  className="transition-opacity duration-200 cursor-default"
                  style={{ color: "var(--green)" }}
                  onMouseEnter={() => setGenerateHovered(true)}
                  onMouseLeave={() => setGenerateHovered(false)}
                >
                  Generate
                </span>
                <span
                  className="transition-opacity duration-200"
                  style={{ opacity: generateHovered ? 0.25 : 1 }}
                >
                  {" "}the future.
                </span>
              </span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl mt-6">
              <span style={{ color: "var(--green)", opacity: 0.9 }}>OpenAPI spec</span> in → CLI out.
            </p>
          </div>

          <div>
            <Button size="lg" className="gap-2 text-lg px-10 py-6 h-auto" style={{ backgroundColor: "var(--green)", color: "#000", border: "none" }}>
              Generate your CLI
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Right: tweet carousel */}
        <div className="w-full max-w-sm mx-auto lg:max-w-none">
          <TweetCarousel />
        </div>
      </div>

    </section>
  )
}
