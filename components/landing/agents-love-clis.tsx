"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const tweets = [
  { src: "/andre_tweet1.png", alt: "Andrej Karpathy on CLIs and agents" },
  { src: "/garry_tweet1.png", alt: "Garry Tan on CLIs and agents" },
  { src: "/greg_tweet1.png", alt: "greg on CLIs and agents" },
]

export function AgentsLoveClis() {
  const [current, setCurrent] = useState(0)

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrent((prev) => (prev + 1) % tweets.length)
  //   }, 5000)
  //   return () => clearInterval(timer)
  // }, [])

  const go = (dir: -1 | 1) =>
    setCurrent((c) => (c + dir + tweets.length) % tweets.length)

  return (
    <section className="px-6 py-20 border-t border-border/40">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          {/* <h2 className="text-2xl md:text-3xl font-medium tracking-tight"> */}
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight">

            Agents ❤️ CLIs
          </h2>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="relative w-full overflow-hidden rounded-2xl border border-[#2f3336] bg-black">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {tweets.map((t) => (
                <div key={t.src} className="relative w-full shrink-0">
                  <Image
                    src={t.src}
                    alt={t.alt}
                    width={1200}
                    height={800}
                    className="w-full h-auto object-contain"
                    priority={false}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            aria-label="Previous tweet"
            onClick={() => go(-1)}
            className="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 border border-[#2f3336] text-white/80 hover:text-white hover:bg-black transition flex items-center justify-center"
          >
            ‹
          </button>
          <button
            aria-label="Next tweet"
            onClick={() => go(1)}
            className="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/70 border border-[#2f3336] text-white/80 hover:text-white hover:bg-black transition flex items-center justify-center"
          >
            ›
          </button>
        </div>

        <div className="flex gap-1.5 justify-center">
          {tweets.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to tweet ${i + 1}`}
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
