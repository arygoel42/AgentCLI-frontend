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
  { num: 21, code: 'Turn any API into an AI-native CLI', indent: 4 },
  { num: 22, code: '</h1>', indent: 3 },
  { num: 23, code: '<p className="text-muted-foreground">', indent: 3 },
  { num: 24, code: 'OpenAPI in → production-ready CLI out.', indent: 4 },
  { num: 25, code: '</p>', indent: 3 },
  { num: 26, code: '<Button size="lg">Generate your CLI</Button>', indent: 3 },
  { num: 27, code: '</section>', indent: 2 },
  { num: 28, code: ')', indent: 1 },
  { num: 29, code: '}', indent: 0 },
]

interface TrailPoint {
  x: number
  y: number
  timestamp: number
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null)
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
      
      setTrail(prev => [
        ...prev.slice(-30),
        { x, y, timestamp: Date.now() }
      ])
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    section.addEventListener("mousemove", handleMouseMove)
    section.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      section.removeEventListener("mousemove", handleMouseMove)
      section.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [])

  // Smooth position interpolation
  useEffect(() => {
    const animate = () => {
      setSmoothPosition(prev => ({
        x: prev.x + (position.x - prev.x) * 0.08,
        y: prev.y + (position.y - prev.y) * 0.08,
      }))
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [position])

  // Fade out old trail points
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
      className="relative min-h-[70vh] flex flex-col justify-center items-center px-6 py-24 overflow-hidden"
    >
      {/* Cursor effect layer */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ 
          opacity: isVisible ? 1 : 0, 
          transition: 'opacity 0.5s ease' 
        }}
      >
        {/* Background code layer - revealed by cursor */}
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
                <span className="w-8 text-right pr-4 text-emerald-500/40 select-none">
                  {line.num}
                </span>
                <span 
                  className="text-foreground/50"
                  style={{ paddingLeft: `${line.indent * 16}px` }}
                >
                  {line.code}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trail effect - fading circles where mouse has been */}
        {trail.map((point, i) => {
          const age = Date.now() - point.timestamp
          const opacity = Math.max(0, 1 - age / 2000) * 0.15
          const scale = 1 + (age / 2000) * 0.5
          
          return (
            <div
              key={`${point.timestamp}-${i}`}
              className="absolute rounded-full bg-foreground/10"
              style={{
                left: point.x,
                top: point.y,
                width: 100 * scale,
                height: 100 * scale,
                transform: 'translate(-50%, -50%)',
                opacity,
              }}
            />
          )
        })}

        {/* Main reveal circle glow */}
        <div
          className="absolute w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2"
          style={{
            left: smoothPosition.x,
            top: smoothPosition.y,
            background: `radial-gradient(circle, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.02) 30%, transparent 60%)`,
            transition: 'left 0.15s ease-out, top 0.15s ease-out',
          }}
        />
        
        {/* Subtle center dot */}
        <div
          className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/30"
          style={{
            left: smoothPosition.x,
            top: smoothPosition.y,
            transition: 'left 0.1s ease-out, top 0.1s ease-out',
          }}
        />
      </div>

      {/* Hero content */}
      <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-balance">
          Turn any <span style={{ color: "var(--green)" }}>API</span> into an AI-native CLI
        </h1>

        <p className="text-muted-foreground text-lg md:text-xl">
          <span style={{ color: "var(--green)", opacity: 0.9 }}>OpenAPI</span> in → production-ready CLI out.
        </p>

        <div className="pt-4">
          <Button size="lg" className="gap-2 text-base px-8" style={{ backgroundColor: "var(--green)", color: "#000", border: "none" }}>
            Generate your CLI
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
