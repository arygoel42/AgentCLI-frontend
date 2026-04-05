import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { SocialProof } from "@/components/landing/social-proof"
import { Problem } from "@/components/landing/problem"
import { Pillars } from "@/components/landing/pillars"
import { Demo } from "@/components/landing/demo"
import { Reinforcement } from "@/components/landing/reinforcement"
import { FooterCta } from "@/components/landing/footer-cta"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative">
      <Navbar />
      <Hero />
      <SocialProof />
      <Problem />
      <Pillars />
      <Demo />
      <Reinforcement />
      <FooterCta />
    </main>
  )
}
