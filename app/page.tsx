import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { SocialProof } from "@/components/landing/social-proof"
import { AgentsLoveClis } from "@/components/landing/agents-love-clis"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Demo } from "@/components/landing/demo"
import { Faq } from "@/components/landing/faq"
import { FooterCta } from "@/components/landing/footer-cta"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative">
      <Navbar />
      <Hero />
      <SocialProof />
      <AgentsLoveClis />
      <HowItWorks />
      <Demo />
      <Faq />
      <FooterCta />
    </main>
  )
}
