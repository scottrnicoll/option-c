"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

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
          "Explore math concepts on your galaxy map",
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

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user, profile, activeProfile, impersonating, signInStudent } = useAuth()

  // When impersonating, skip class code (step 0) and name (step 1) — demo student already has those
  const source = impersonating ?? activeProfile
  const initialStep = source
    ? (!source.grade ? 2 : source.interests.length === 0 ? 4 : 0)
    : 0
  const [step, setStep] = useState(initialStep)
  const [classCode, setClassCode] = useState("")
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
      await signInStudent(classCode, data.name)
      setStep(2) // advance to grade
    } catch (err: any) {
      setAuthError(err.message || "Could not join class. Try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleInterestsComplete = async () => {
    const targetUid = impersonating?.uid ?? user?.uid
    if (targetUid) {
      try {
        await updateDoc(doc(db, "users", targetUid), {
          grade: data.grade,
          interests: data.interests,
        })
      } catch {
        // Silent fail — profile will be updated on next login
      }
    }
    onComplete(data)
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center">
      <div className="max-w-md w-full px-6 relative">
        {/* Step 0: Class Code */}
        <StepWrapper visible={step === 0}>
          <ClassCodeStep
            value={classCode}
            onChange={setClassCode}
            onNext={() => setStep(1)}
            error={null}
          />
        </StepWrapper>

        {/* Step 1: Name + auth */}
        <StepWrapper visible={step === 1}>
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

        {/* Step 2: Grade */}
        <StepWrapper visible={step === 2}>
          <GradeStep
            name={data.name}
            onSelect={(grade) => {
              setData((prev) => ({ ...prev, grade }))
              setStep(3)
            }}
          />
        </StepWrapper>

        {/* Step 3: Intro */}
        <StepWrapper visible={step === 3}>
          <IntroStep name={data.name} onNext={() => setStep(4)} />
        </StepWrapper>

        {/* Step 4: Interests */}
        <StepWrapper visible={step === 4}>
          <InterestsStep
            selected={data.interests}
            onToggle={toggleInterest}
            onAddCustom={(newInterests) => {
              setData((prev) => ({
                ...prev,
                interests: [...prev.interests, ...newInterests.filter(i => !prev.interests.includes(i))],
              }))
            }}
            onNext={handleInterestsComplete}
          />
        </StepWrapper>
      </div>
    </div>
  )
}
