"use client"

import Image from "next/image"
import { useState } from "react"

const tweets = [
  { src: "/greg_tweet1.png", alt: "greg on CLIs and agents" },
  { src: "/andre_tweet1.png", alt: "Andrej Karpathy on CLIs and agents" },
  { src: "/garry_tweet1.png", alt: "Garry Tan on CLIs and agents" },
]

export function AgentsLoveClis() {
  const [current, setCurrent] = useState(0)

  const go = (dir: -1 | 1) =>
    setCurrent((c) => (c + dir + tweets.length) % tweets.length)

  const prev = (current - 1 + tweets.length) % tweets.length
  const next = (current + 1) % tweets.length

  return (
    <section className="py-20 border-t border-border/40 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 space-y-12">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight">
            Agents think in CLIs.
          </h2>
        </div>
      </div>

      {/* full-width carousel */}
      <div className="relative mt-12 flex items-center justify-center" style={{ perspective: "1200px" }}>

        {/* prev */}
        <button
          onClick={() => go(-1)}
          aria-label="Previous tweet"
          className="absolute left-[max(0px,calc(50%-480px))] z-20 w-9 h-9 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition flex items-center justify-center text-lg"
        >
          ‹
        </button>

        {/* side — prev */}
        <div
          className="absolute left-[max(0px,calc(50%-440px))] w-[340px] cursor-pointer select-none transition-opacity duration-300 hover:opacity-40"
          style={{ opacity: 0.25 }}
          onClick={() => go(-1)}
          aria-hidden
        >
          <div className="rounded-2xl border border-[#2f3336] bg-black overflow-hidden">
            <div className="relative w-full aspect-[1204/314]">
              <Image
                src={tweets[prev].src}
                alt=""
                fill
                sizes="340px"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* center — active */}
        <div className="relative z-10 w-full max-w-[640px] mx-auto shrink-0 px-6 md:px-0">
          <div className="rounded-2xl border border-[#2f3336] bg-black overflow-hidden shadow-2xl shadow-black/60">
            <div className="relative w-full aspect-[1204/314]">
              <Image
                src={tweets[current].src}
                alt={tweets[current].alt}
                fill
                sizes="640px"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* side — next */}
        <div
          className="absolute right-[max(0px,calc(50%-440px))] w-[340px] cursor-pointer select-none transition-opacity duration-300 hover:opacity-40"
          style={{ opacity: 0.25 }}
          onClick={() => go(1)}
          aria-hidden
        >
          <div className="rounded-2xl border border-[#2f3336] bg-black overflow-hidden">
            <div className="relative w-full aspect-[1204/314]">
              <Image
                src={tweets[next].src}
                alt=""
                fill
                sizes="340px"
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* next */}
        <button
          onClick={() => go(1)}
          aria-label="Next tweet"
          className="absolute right-[max(0px,calc(50%-480px))] z-20 w-9 h-9 rounded-full bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/90 transition flex items-center justify-center text-lg"
        >
          ›
        </button>
      </div>

      {/* dots */}
      <div className="flex gap-1.5 justify-center mt-8">
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
    </section>
  )
}
