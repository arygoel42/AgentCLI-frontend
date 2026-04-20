const companyLogos = [
  { name: "Coinbase", src: "/logos/coinbase.svg" },
  { name: "Notion", src: "/logos/notion.svg" },
  { name: "Amazon", src: "/logos/amazon.svg" },
  { name: "Google", src: "/logos/google.svg" },
  { name: "Mercor", src: "/logos/mercor.svg" },
]

export function SocialProof() {
  return (
    <section className="w-full bg-muted/30 border-y border-border py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-8">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          Built by engineers from
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 md:gap-x-16">
          {companyLogos.map((company) => (
            <img
              key={company.name}
              src={company.src}
              alt={company.name}
              className="h-8 md:h-9 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
