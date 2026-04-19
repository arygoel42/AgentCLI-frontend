"use client"

function CoinbaseLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <circle cx="12" cy="12" r="12" fill="#0052FF" />
      <path d="M18.7 5.3 A9.5 9.5 0 1 0 18.7 18.7" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function NotionLogo() {
  return (
    <svg viewBox="0 0 100 100" className="w-6 h-6" fill="none">
      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#fff"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000"/>
    </svg>
  )
}

function AmazonLogo() {
  return (
    <div className="flex flex-col items-center gap-[3px]">
      <span className="text-white font-bold leading-none tracking-tight" style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "18px" }}>
        amazon
      </span>
      <svg viewBox="0 0 72 10" className="w-[68px] h-[9px]" fill="none">
        <path d="M4 5 Q36 14 68 5" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M62 2.5 L68 5 L62 7.5" stroke="#FF9900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 272 92" className="w-16 h-6" fill="none">
      <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
      <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
      <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
      <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
      <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
      <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
    </svg>
  )
}

function MercorLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none">
        <circle cx="10" cy="10" r="9" stroke="#818cf8" strokeWidth="2" fill="none" />
        <circle cx="10" cy="10" r="3.5" fill="#818cf8" />
      </svg>
      <span className="font-semibold leading-none tracking-tight text-white/90" style={{ fontFamily: "system-ui, sans-serif", fontSize: "17px" }}>
        mercor
      </span>
    </div>
  )
}

const companyLogos = [
  { name: "Coinbase", Logo: CoinbaseLogo },
  { name: "Notion", Logo: NotionLogo },
  { name: "Amazon", Logo: AmazonLogo },
  { name: "Google", Logo: GoogleLogo },
  { name: "Mercor", Logo: MercorLogo },
]

// Duplicate enough times that the seam never shows at any viewport width
const COPIES = 4
const track = Array.from({ length: COPIES }, () => companyLogos).flat()

export function SocialProof() {
  return (
    <section className="w-full bg-[#0a0a0a] border-y border-white/10 py-8">
      <div className="flex flex-col items-center gap-6">
        <p className="text-neutral-500 text-xs tracking-widest uppercase">
          Built by engineers at
        </p>

        {/* Mask fades the edges so the loop looks seamless */}
        <div
          className="w-full overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)" }}
        >
          <div
            className="flex w-max"
            style={{ animation: "marquee 28s linear infinite" }}
          >
            {track.map((company, i) => (
              <div
                key={`${company.name}-${i}`}
                className="flex items-center justify-center px-10 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <company.Logo />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-${100 / COPIES}%); }
        }
      `}</style>
    </section>
  )
}
