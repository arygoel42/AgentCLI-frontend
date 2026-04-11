import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { SocialProof } from "@/components/landing/social-proof"
import { Demo } from "@/components/landing/demo"
import { Features } from "@/components/landing/features"
import { Distribution } from "@/components/landing/distribution"
import { Faq } from "@/components/landing/faq"
import { FooterCta } from "@/components/landing/footer-cta"

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative">
      <Navbar />
      <Hero />
      <SocialProof />
      <Demo />
      <Features />
      <Distribution />
      <Faq />
      <FooterCta />
    </main>
  )
}
