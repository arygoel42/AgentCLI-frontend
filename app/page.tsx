import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { AgentsLoveClis } from "@/components/landing/agents-love-clis"
import { Demo } from "@/components/landing/demo"
import { Features } from "@/components/landing/features"
import { Faq } from "@/components/landing/faq"
import { FooterCta } from "@/components/landing/footer-cta"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative">
      <Navbar />
      <Hero />
      <AgentsLoveClis />
      <Demo />
      <Features />
      <Faq />
      <FooterCta />
    </main>
  )
}
