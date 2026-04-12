"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useAuth } from "@/lib/auth"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import posthog from "posthog-js"

interface OnboardingData {
  name: string
  grade: string
  interests: string[]
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void
}

const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8", "HS"]
const INTERESTS = [
  "Games",
  "Sports",
  "Art",
  "Music",
  "Science",
  "Building",
  "Animals",
  "Food",
  "Cooking",
  "Space",
]

function StepWrapper({
  children,
  visible,
}: {
  children: React.ReactNode
  visible: boolean
}) {
  return (
    <div
      className={`transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none absolute inset-0"
      }`}
    >
      {children}
    </div>
  )
}

function WelcomeChoiceStep({
  onNew,
  onReturning,
}: {
  onNew: () => void
  onReturning: () => void
}) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-center gap-8 md:gap-16 max-w-4xl w-full px-6">
      {/* Left: sign-in options */}
      <div className="flex flex-col items-center gap-6 flex-1 w-full min-w-[360px]">
        <Logo size={56} className="text-blue-400" />
        <h1 className="text-3xl font-bold text-white text-center">Welcome to Diagonally</h1>
        <p className="text-zinc-400 text-sm text-center">
          Are you new here, or coming back?
        </p>
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onNew}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-5 py-4 text-base font-semibold transition-colors text-left"
          >
            I&apos;m new — I have a class code
            <p className="text-xs text-blue-200 font-normal mt-0.5">
              Your teacher gave you a class code to join
            </p>
          </button>
          <button
            onClick={onReturning}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl px-5 py-4 text-base font-semibold transition-colors border border-zinc-700 text-left"
          >
            I&apos;m coming back — I have my personal code
            <p className="text-xs text-zinc-400 font-normal mt-0.5">
              The code you saved last time (like STAR-742)
            </p>
          </button>
        </div>
        <a
          href="/guide/login"
          className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors mt-2"
        >
          I&apos;m a guide →
        </a>
      </div>

      {/* Right: how it works */}
      <div className="flex-1 w-full min-w-[320px] bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">How Diagonally works</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-lg leading-tight">🌌</span>
            <p className="text-sm text-zinc-400"><span className="text-zinc-200 font-medium">Explore the galaxy.</span> Math domains are planets. Each skill is a moon orbiting its planet.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg leading-tight">🎮</span>
            <p className="text-sm text-zinc-400"><span className="text-zinc-200 font-medium">Build a game.</span> Pick a skill, design a game with AI, and the AI builds it for you.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg leading-tight">✅</span>
            <p className="text-sm text-zinc-400"><span className="text-zinc-200 font-medium">Get it reviewed.</span> Your guide plays your game and approves it. You earn tokens.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg leading-tight">🏆</span>
            <p className="text-sm text-zinc-400"><span className="text-zinc-200 font-medium">Master the skill.</span> Play other learners&apos; games to prove you&apos;ve got it. Climb the ranking.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReturningStep({
  name,
  code,
  onNameChange,
  onCodeChange,
  onSubmit,
  onBack,
  loading,
  error,
}: {
  name: string
  code: string
  onNameChange: (v: string) => void
  onCodeChange: (v: string) => void
  onSubmit: () => void
  onBack: () => void
  loading: boolean
  error: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-3xl font-bold text-white text-center">Welcome back!</h1>
      <p className="text-zinc-400 text-sm text-center">
        Enter your name and personal code.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim() && code.trim() && !loading) onSubmit()
        }}
        className="w-full flex flex-col gap-3"
      >
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Your name"
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          disabled={loading}
        />
        <input
          type="text"
          value={code}
          onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
          placeholder="STAR-742"
          className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white text-center tracking-widest font-mono placeholder:text-zinc-500 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          disabled={loading}
          maxLength={12}
        />
        <Button type="submit" size="lg" className="w-full" disabled={!name.trim() || !code.trim() || loading}>
          {loading ? "Signing you in..." : "Continue →"}
        </Button>
      </form>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <button
        onClick={onBack}
        className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
      >
        ← Back
      </button>
    </div>
  )
}

function CodeRevealStep({
  name,
  code,
  onContinue,
}: {
  name: string
  code: string
  onContinue: () => void
}) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-col items-center gap-5">
      <h1 className="text-2xl font-bold text-white text-center">
        You&apos;re in, {name}!
      </h1>
      <div className="w-full bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 text-center">
        <p className="text-amber-300 text-sm font-medium mb-2">
          📌 Save this — it&apos;s your personal code
        </p>
        <p className="text-4xl font-mono font-bold text-white tracking-widest my-3">
          {code}
        </p>
        <p className="text-zinc-400 text-xs leading-relaxed">
          Next time you come back, sign in with your name + this code so your progress is waiting for you.
        </p>
        <button
          onClick={handleCopy}
          className="mt-3 text-xs text-amber-300 hover:text-amber-200 underline"
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <Button onClick={onContinue} size="lg" className="w-full text-base">
        Got it, let&apos;s go →
      </Button>
    </div>
  )
}

function ClassCodeStep({
  value,
  onChange,
  onNext,
  error,
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  error: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-white text-center">
        Enter your class code
      </h1>
      <p className="text-zinc-400 text-sm text-center">
        Your teacher will give you this code to join the class.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onNext()
        }}
        className="w-full flex gap-3"
      >
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="e.g. MATH7B"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white text-center tracking-widest font-mono placeholder:text-zinc-500 placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          maxLength={10}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 10h10M11 6l4 4-4 4" />
          </svg>
        </button>
      </form>
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <a
        href="/guide/login"
        className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors mt-2"
      >
        I&apos;m a guide →
      </a>
    </div>
  )
}

function NameStep({
  value,
  onChange,
  onNext,
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-white text-center">
        What should we call you?
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (value.trim()) onNext()
        }}
        className="w-full flex gap-3"
      >
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your name..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-lg text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 10h10M11 6l4 4-4 4" />
          </svg>
        </button>
      </form>
    </div>
  )
}

function IntroStep({
  name,
  onNext,
}: {
  name: string
  onNext: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-white text-center">
        Hey {name}, here&apos;s how this works.
      </h1>
      <p className="text-zinc-300 text-base text-center -mt-2">
        You&apos;re going to master math by building games.
      </p>
      <div className="w-full flex flex-col gap-2">
        {[
          "Explore math domains on your galaxy map",
          "Design a game for a concept you want to master",
          "Other learners play and rate your game",
          "Get approved → earn tokens → unlock more",
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 px-2 py-1">
            <span className="text-blue-400 font-bold text-sm mt-0.5 shrink-0">{i + 1}.</span>
            <span className="text-zinc-300 text-sm leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
      <p className="text-zinc-500 text-sm text-center">Master a concept. Light up your galaxy.</p>
      <Button onClick={onNext} size="lg" className="w-full text-base">
        Let&apos;s go &rarr;
      </Button>
    </div>
  )
}

function GradeStep({
  name,
  onSelect,
}: {
  name: string
  onSelect: (grade: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (grade: string) => {
    setSelected(grade)
    setTimeout(() => onSelect(grade), 200)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-white text-center">
        Nice, {name}! What grade are you in?
      </h1>
      <div className="grid grid-cols-5 gap-3 w-full">
        {GRADES.map((grade) => (
          <button
            key={grade}
            onClick={() => handleSelect(grade)}
            className={`rounded-xl py-3 text-lg font-semibold transition-all duration-200 ${
              selected === grade
                ? "bg-blue-500 text-white scale-95"
                : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-700"
            }`}
          >
            {grade}
          </button>
        ))}
      </div>
    </div>
  )
}

function InterestsStep({
  selected,
  onToggle,
  onAddCustom,
  onNext,
}: {
  selected: string[]
  onToggle: (interest: string) => void
  onAddCustom: (interests: string[]) => void
  onNext: () => void
}) {
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState("")

  const handleCustomSubmit = () => {
    if (!customText.trim()) return
    // Parse by commas, "and", or just whitespace-separated phrases
    const parsed = customText
      .split(/[,\n]+/)
      .map(s => s.replace(/^\s*(and|&)\s*/i, "").trim())
      .filter(s => s.length > 0 && s.length < 30)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    if (parsed.length > 0) {
      onAddCustom(parsed)
      setCustomText("")
      setShowCustom(false)
    }
  }

  // Separate preset vs custom interests for display
  const customSelected = selected.filter(s => !INTERESTS.includes(s))

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-white text-center">
        What are you into? Pick a few.
      </h1>
      <p className="text-zinc-400 text-sm text-center -mt-3">
        We&apos;ll use this to give you examples and explanations related to what you actually care about.
      </p>
      <div className="flex flex-wrap justify-center gap-2 w-full">
        {INTERESTS.map((interest) => {
          const isSelected = selected.includes(interest)
          return (
            <button
              key={interest}
              onClick={() => onToggle(interest)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-300 border"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-200"
              }`}
            >
              {interest}
            </button>
          )
        })}
        {customSelected.map((interest) => (
          <button
            key={interest}
            onClick={() => onToggle(interest)}
            className="rounded-full px-4 py-2 text-sm font-medium bg-blue-500/20 border-blue-500/50 text-blue-300 border transition-all duration-200"
          >
            {interest} ×
          </button>
        ))}
        {!showCustom && (
          <button
            onClick={() => setShowCustom(true)}
            className="rounded-full px-4 py-2 text-sm font-medium border border-dashed border-zinc-600 text-zinc-400 hover:text-zinc-200 hover:border-zinc-400 transition-all duration-200"
          >
            + Other...
          </button>
        )}
      </div>
      {showCustom && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleCustomSubmit() }}
          className="w-full flex gap-2"
        >
          <input
            autoFocus
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="skateboarding, Roblox, dinosaurs..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            type="submit"
            disabled={!customText.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:opacity-30 text-white rounded-xl px-4 py-2.5 text-sm transition-colors"
          >
            Add
          </button>
        </form>
      )}
      <Button
        onClick={onNext}
        size="lg"
        className="w-full"
        disabled={selected.length === 0}
      >
        Continue &rarr;
      </Button>
    </div>
  )
}

function WelcomeStep({
  name,
  conceptCount,
  onGo,
}: {
  name: string
  conceptCount: number
  onGo: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h1 className="text-3xl font-bold text-white">
        Let&apos;s go, {name}!
      </h1>
      <p className="text-zinc-300 leading-relaxed">
        You&apos;re about to explore{" "}
        <span className="text-white font-semibold">{conceptCount}</span> math
        concepts. The glowing ones are ready for you — pick one, learn it, then
        design a game to prove you get it.
      </p>
      <Button onClick={onGo} size="lg" className="w-full text-base">
        Let&apos;s go &rarr;
      </Button>
    </div>
  )
}

export type { OnboardingData }

type Step =
  | "welcome"        // new vs returning picker
  | "classCode"      // new student: class code
  | "name"           // new student: name entry
  | "codeReveal"     // new student: show their fresh personal code
  | "returning"      // returning student: name + personal code
  | "grade"          // grade
  | "intro"          // how-it-works intro

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, profile, activeProfile, impersonating, signInLearner, signInReturning } = useAuth()

  // When impersonating or returning from a partial sign-in, skip steps
  // that are already filled in.
  const source = impersonating ?? activeProfile
  const initialStep: Step = source
    ? (!source.grade ? "grade" : "welcome")
    : "welcome"
  const [step, setStep] = useState<Step>(initialStep)
  const [classCode, setClassCode] = useState("")
  const [returningCode, setReturningCode] = useState("")
  const [newPersonalCode, setNewPersonalCode] = useState("")
  const [data, setData] = useState<OnboardingData>({
    name: (impersonating ?? activeProfile)?.name || "",
    grade: (impersonating ?? activeProfile)?.grade || "",
    interests: (impersonating ?? activeProfile)?.interests || [],
  })
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

  const toggleInterest = (interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleNameNext = async () => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await signInLearner(classCode, data.name)
      // Fetch the freshly-generated personal code from Firestore
      // (signInLearner just wrote it to users/{uid})
      const currentUid = auth.currentUser?.uid
      if (currentUid) {
        const userSnap = await getDoc(doc(db, "users", currentUid))
        if (userSnap.exists()) {
          const code = (userSnap.data() as { personalCode?: string }).personalCode
          if (code) setNewPersonalCode(code)
        }
      }
      posthog.capture("onboarding_step_reached", { step: "codeReveal" })
      setStep("codeReveal")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not join class. Try again."
      setAuthError(msg)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleReturningSubmit = async () => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      await signInReturning(data.name, returningCode)
      // Returning students already have grade + interests — go straight to galaxy
      // via onComplete with their existing data
      const signedInUid = auth.currentUser?.uid
      if (signedInUid) {
        const userSnap = await getDoc(doc(db, "users", signedInUid))
        if (userSnap.exists()) {
          const d = userSnap.data() as { grade: string; interests: string[]; name: string }
          onComplete({ name: d.name, grade: d.grade, interests: d.interests ?? [] })
          return
        }
      }
      // Fallback if the doc read fails
      onComplete(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not sign you in."
      setAuthError(msg)
    } finally {
      setAuthLoading(false)
    }
  }

  // Called when the new learner finishes the intro step. Persists the
  // grade selection to Firestore (the interests field is left empty —
  // no longer collected during onboarding) and jumps into the galaxy.
  const handleIntroComplete = async () => {
    const targetUid = impersonating?.uid ?? user?.uid
    if (targetUid) {
      try {
        await updateDoc(doc(db, "users", targetUid), {
          grade: data.grade,
        })
      } catch {
        // Silent fail — profile will be updated on next login
      }
    }
    posthog.capture("onboarding_completed", { grade: data.grade })
    onComplete(data)
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center">
      <div className="max-w-md w-full px-6 relative">
        {/* Welcome: new vs returning */}
        <StepWrapper visible={step === "welcome"}>
          <WelcomeChoiceStep
            onNew={() => { posthog.capture("onboarding_started"); posthog.capture("onboarding_step_reached", { step: "classCode" }); setStep("classCode") }}
            onReturning={() => { posthog.capture("onboarding_step_reached", { step: "returning" }); setStep("returning") }}
          />
        </StepWrapper>

        {/* New student: Class Code */}
        <StepWrapper visible={step === "classCode"}>
          <ClassCodeStep
            value={classCode}
            onChange={setClassCode}
            onNext={() => { posthog.capture("onboarding_step_reached", { step: "name" }); setStep("name") }}
            error={null}
          />
        </StepWrapper>

        {/* New student: Name + auth */}
        <StepWrapper visible={step === "name"}>
          {authLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-300 text-sm">Joining class...</p>
            </div>
          ) : (
            <>
              <NameStep
                value={data.name}
                onChange={(name) => setData((prev) => ({ ...prev, name }))}
                onNext={handleNameNext}
              />
              {authError && (
                <p className="text-red-400 text-sm text-center mt-4">{authError}</p>
              )}
            </>
          )}
        </StepWrapper>

        {/* New student: Show their personal code */}
        <StepWrapper visible={step === "codeReveal"}>
          <CodeRevealStep
            name={data.name}
            code={newPersonalCode}
            onContinue={() => { posthog.capture("onboarding_step_reached", { step: "grade" }); setStep("grade") }}
          />
        </StepWrapper>

        {/* Returning student: Name + code */}
        <StepWrapper visible={step === "returning"}>
          <ReturningStep
            name={data.name}
            code={returningCode}
            onNameChange={(name) => setData((prev) => ({ ...prev, name }))}
            onCodeChange={setReturningCode}
            onSubmit={handleReturningSubmit}
            onBack={() => { setStep("welcome"); setAuthError(null) }}
            loading={authLoading}
            error={authError}
          />
        </StepWrapper>

        {/* Grade */}
        <StepWrapper visible={step === "grade"}>
          <GradeStep
            name={data.name}
            onSelect={(grade) => {
              setData((prev) => ({ ...prev, grade }))
              posthog.capture("onboarding_step_reached", { step: "intro" })
              setStep("intro")
            }}
          />
        </StepWrapper>

        {/* Intro — last step before the galaxy. The old "interests
            picker" step was removed because asking kids to declare
            their interests up-front constrained their imagination
            instead of expanding it. */}
        <StepWrapper visible={step === "intro"}>
          <IntroStep name={data.name} onNext={handleIntroComplete} />
        </StepWrapper>
      </div>
    </div>
  )
}
