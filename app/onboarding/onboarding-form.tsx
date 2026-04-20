"use client"

import { useState } from "react"
import { Leaf, ArrowRight, ArrowLeft } from "lucide-react"
import { completeOnboarding } from "./actions"

type Step = 0 | 1 | 2

const ROLES = [
  { value: "engineer", label: "Engineer" },
  { value: "founder", label: "Founder" },
  { value: "pm", label: "Product Manager" },
  { value: "other", label: "Other" },
]

const USE_CASES = [
  { value: "internal", label: "Internal tools", hint: "CLIs for my team or company" },
  { value: "customer", label: "Customer-facing API", hint: "Ship a CLI to my users" },
  { value: "open_source", label: "Open source", hint: "CLI for a public API" },
  { value: "exploring", label: "Just exploring", hint: "Kicking the tires" },
]

export function OnboardingForm({ firstName }: { firstName: string | null }) {
  const [step, setStep] = useState<Step>(0)
  const [role, setRole] = useState<string | null>(null)
  const [useCase, setUseCase] = useState<string | null>(null)
  const [company, setCompany] = useState("")
  const [referralSource, setReferralSource] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const totalSteps = 3
  const canAdvance =
    (step === 0 && !!role) ||
    (step === 1 && !!useCase) ||
    step === 2

  async function handleSubmit() {
    if (!role || !useCase) return
    setSubmitting(true)
    try {
      await completeOnboarding({
        role,
        company: company.trim() || null,
        useCase,
        referralSource: referralSource.trim() || null,
      })
    } catch (err) {
      setSubmitting(false)
      console.error(err)
    }
  }

  function handleNext() {
    if (step < 2) {
      setStep((step + 1) as Step)
    } else {
      handleSubmit()
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 mb-10">
        <Leaf className="w-5 h-5" style={{ color: "var(--green)" }} />
        <span className="font-bold tracking-tight text-xl">
          pe<span style={{ color: "var(--green)" }}>t</span>l
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === step ? 28 : 8,
              backgroundColor:
                i <= step ? "var(--green)" : "var(--border)",
            }}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-background p-8">
        {step === 0 && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {firstName ? `Hey ${firstName}, ` : "Welcome! "}
              what&apos;s your role?
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              So we know how to tailor petl for you.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const active = role === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className="text-left rounded-lg border px-4 py-3 text-sm transition-colors"
                    style={{
                      borderColor: active ? "var(--green)" : "var(--border)",
                      backgroundColor: active ? "var(--green-glow)" : "transparent",
                    }}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              What are you building with petl?
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pick the option that best fits.
            </p>
            <div className="mt-6 space-y-2">
              {USE_CASES.map((u) => {
                const active = useCase === u.value
                return (
                  <button
                    key={u.value}
                    onClick={() => setUseCase(u.value)}
                    className="w-full text-left rounded-lg border px-4 py-3 transition-colors"
                    style={{
                      borderColor: active ? "var(--green)" : "var(--border)",
                      backgroundColor: active ? "var(--green-glow)" : "transparent",
                    }}
                  >
                    <div className="text-sm font-medium">{u.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{u.hint}</div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">A few last details</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Both are optional — helps us understand who&apos;s using petl.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Company or team</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                />
              </div>
              <div>
                <label className="text-sm font-medium">How&apos;d you hear about petl?</label>
                <input
                  type="text"
                  value={referralSource}
                  onChange={(e) => setReferralSource(e.target.value)}
                  placeholder="Twitter, a friend, search, …"
                  className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => step > 0 && setStep((step - 1) as Step)}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-0 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canAdvance || submitting}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            style={{ backgroundColor: "var(--green)", color: "#000" }}
          >
            {step === 2 ? (submitting ? "Finishing…" : "Finish") : "Continue"}
            {!submitting && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
