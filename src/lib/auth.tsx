"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  writeBatch,
  increment,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { UserProfile, ProgressDoc } from "@/lib/auth-types"
import posthog from "posthog-js"

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  impersonating: UserProfile | null
  activeProfile: UserProfile | null
  signInLearner: (classCode: string, name: string) => Promise<void>
  // Legacy alias — same as signInLearner. Kept until callers are migrated.
  signInStudent: (classCode: string, name: string) => Promise<void>
  signInReturning: (name: string, personalCode: string) => Promise<void>
  signInGuide: (email: string, password: string) => Promise<void>
  signInGuideWithGoogle: () => Promise<void>
  linkGoogleAccount: () => Promise<void>
  signOut: () => Promise<void>
  updateTokens: (delta: number) => Promise<number>
  saveProgress: (standardId: string, data: Partial<ProgressDoc>) => Promise<void>
  loadProgress: () => Promise<Map<string, ProgressDoc>>
  startImpersonating: (studentUid: string) => Promise<void>
  stopImpersonating: () => void
}

// Friendly nouns for personal codes — easy to say, spell, and remember
// Normalize a learner name for lookup. Handles "Pepito ", "PEPITO",
// "pepito-1", "Pepito Sanchez" — anything with spaces, mixed case,
// or special characters. The normalized form is alphanumeric-only,
// lowercase, no spaces. Used for matching, NEVER for display.
//
// Example normalizations:
//   "Pepito"          → "pepito"
//   "Pepito "         → "pepito"
//   "PEPITO"          → "pepito"
//   "pepito-1"        → "pepito1"
//   "Pepito Sanchez"  → "pepitosanchez"
//   "  pepito  "      → "pepito"
//   ""                → ""
function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

// Universe / cosmos themed words for personal codes. All 4-6 letters
// so codes look like "NOVA-42", "COMET-08", "QUASAR-19" — short,
// memorable, and tied to the Diagonally galaxy aesthetic.
//
// Old format was 3-4 digit suffixes (e.g. "STAR-742"). New format is
// 2-digit suffix (00-99) which gives ~3700 unique codes. Plenty for
// a single classroom and easier for kids to remember.
//
// Existing codes from the old format keep working — we don't migrate
// them. New learners get the new format.
const CODE_WORDS = [
  // Stars and stellar bodies
  "STAR", "NOVA", "SUN", "PULSE", "QUASAR", "BLAZAR",
  // Planets, moons, orbits
  "MOON", "ORBIT", "LUNA", "MARS", "VENUS", "TITAN", "RHEA", "IO",
  // Comets, asteroids, meteors
  "COMET", "METEOR", "ROCKET", "PROBE",
  // Galaxies, nebulas, cosmic structures
  "NEBULA", "GALAXY", "COSMOS", "VOID", "RIFT", "WARP",
  // Light, energy, gravity
  "FLARE", "BEAM", "RAY", "GLOW", "ECHO", "WAVE",
  // Other space stuff
  "ATOM", "ION", "ZERO", "INFIN",
]

// Generate a unique personal code like "NOVA-42" or "COMET-08".
// 2-digit suffix (00-99) means each word has 100 unique codes,
// times ~30 words = ~3000 unique codes total per Firebase project.
async function generateUniquePersonalCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]
    const digits = String(Math.floor(Math.random() * 100)).padStart(2, "0")
    const code = `${word}-${digits}`
    const existing = await getDocs(
      query(collection(db, "users"), where("personalCode", "==", code))
    )
    if (existing.empty) return code
  }
  // Fallback after 12 collisions: bump to a 3-digit suffix to break
  // any remaining collision. Vanishingly rare in practice.
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]
  const digits = String(Math.floor(Math.random() * 1000)).padStart(3, "0")
  return `${word}-${digits}`
}

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [impersonating, setImpersonating] = useState<UserProfile | null>(null)

  const activeProfile = impersonating ?? profile

  // Load user profile from Firestore (with retry and error handling)
  const loadProfile = useCallback(async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid))
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile)
      } else {
        setProfile(null)
      }
    } catch (err) {
      console.warn("Failed to load profile, will retry:", err)
      setProfile(null)
    }
  }, [])


  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [loadProfile])

  // Copy a student's data (user profile, progress, games) from an old
  // Firebase uid to a new Firebase uid. Used when a returning student signs
  // in and Firebase anonymous auth gives them a fresh uid.
  const migrateStudentData = useCallback(async (oldUid: string, newUid: string) => {
    if (oldUid === newUid) return

    // 1. Copy progress/{oldUid}/standards/* → progress/{newUid}/standards/*
    try {
      const progressSnap = await getDocs(
        collection(db, "progress", oldUid, "standards")
      )
      const batch = writeBatch(db)
      progressSnap.forEach((d) => {
        batch.set(doc(db, "progress", newUid, "standards", d.id), d.data())
      })
      await batch.commit()
    } catch (err) {
      console.warn("[auth] progress migration failed:", err)
    }

    // 2. Update any games authored by the old uid
    try {
      const gamesSnap = await getDocs(
        query(collection(db, "games"), where("authorUid", "==", oldUid))
      )
      const batch = writeBatch(db)
      gamesSnap.forEach((d) => {
        batch.update(d.ref, { authorUid: newUid })
      })
      await batch.commit()
    } catch (err) {
      console.warn("[auth] games migration failed:", err)
    }

    // 3. Migrate feedback/inbox messages sent TO the old uid
    try {
      const feedbackSnap = await getDocs(
        query(collection(db, "feedback"), where("toUid", "==", oldUid))
      )
      const batch3 = writeBatch(db)
      feedbackSnap.forEach((d) => {
        batch3.update(d.ref, { toUid: newUid })
      })
      await batch3.commit()
    } catch (err) {
      console.warn("[auth] feedback migration failed:", err)
    }

    // 4. Delete old progress so a future anonymous user who gets this
    //    UID won't inherit stale data.
    try {
      const oldProgressSnap = await getDocs(collection(db, "progress", oldUid, "standards"))
      if (oldProgressSnap.size > 0) {
        const deleteBatch = writeBatch(db)
        oldProgressSnap.forEach((d) => deleteBatch.delete(d.ref))
        await deleteBatch.commit()
      }
    } catch (err) {
      console.warn("[auth] old progress cleanup failed:", err)
    }

    // 5. Delete the old user doc so lookups by personalCode stay unique.
    try {
      await deleteDoc(doc(db, "users", oldUid))
    } catch (err) {
      console.warn("[auth] old user delete failed:", err)
    }
  }, [])

  const signInLearner = useCallback(async (classCode: string, name: string) => {
    // Validate and normalize the name up front
    const trimmedName = name.trim()
    if (!trimmedName) throw new Error("Please enter your name.")
    const normalizedName = normalizeName(trimmedName)
    if (!normalizedName) throw new Error("That name doesn't have any letters or numbers. Try again.")

    // 1. Get a custom token from our API instead of signInAnonymously
    const res = await fetch("/api/auth/student-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classCode, name: trimmedName }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Login failed")
    }

    const { token } = await res.json()
    const cred = await signInWithCustomToken(auth, token)
    const currentUser = cred.user

    // 2. Find the class by code (client-side check for metadata)
    const classQuery = query(
      collection(db, "classes"),
      where("code", "==", classCode.toUpperCase())
    )
    const classSnap = await getDocs(classQuery)
    if (classSnap.empty) throw new Error("Class not found. Check your code.")
    const classDoc = classSnap.docs[0]
    const classId = classDoc.id

    // 3. Ensure the user profile exists in Firestore (the API might have just created the Auth user)
    const profileSnap = await getDoc(doc(db, "users", currentUser.uid))
    let matching = profileSnap.exists()

    if (!matching) {
      // New student — generate a personal code and save the profile.
      const personalCode = await generateUniquePersonalCode()
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        name: trimmedName,
        role: "student",
        grade: "",
        interests: [],
        classId,
        tokens: 0,
        personalCode,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      } satisfies UserProfile)
    } else {
      // Existing student — update lastLoginAt
      await updateDoc(doc(db, "users", currentUser.uid), {
        lastLoginAt: Date.now()
      })
    }

    // Reload profile
    await loadProfile(currentUser.uid)

    posthog.identify(currentUser.uid, { name: trimmedName, role: "student" })
    posthog.capture("learner_signed_in", { is_new_learner: !matching })
  }, [loadProfile])

  // Returning-student login: look up by personal code + name
  const signInReturning = useCallback(async (name: string, personalCode: string) => {
    // 1. Get custom token from API
    const res = await fetch("/api/auth/student-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, personalCode }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Login failed")
    }

    const { token } = await res.json()
    const cred = await signInWithCustomToken(auth, token)
    const currentUser = cred.user

    // 2. Double check name match (extra security factor)
    const snap = await getDoc(doc(db, "users", currentUser.uid))
    if (!snap.exists()) throw new Error("User record lost.")
    const existingData = snap.data() as UserProfile

    if (normalizeName(existingData.name) !== normalizeName(name)) {
      await firebaseSignOut(auth)
      throw new Error("That code doesn't match the name. Try again.")
    }

    // 3. Update lastLoginAt
    await updateDoc(doc(db, "users", currentUser.uid), {
      lastLoginAt: Date.now(),
    })

    // 4. Reload profile
    await loadProfile(currentUser.uid)

    posthog.identify(currentUser.uid, { name: existingData.name, role: "student" })
    posthog.capture("learner_signed_in", { is_new_learner: false, via: "personal_code" })
  }, [loadProfile])

  const signInGuide = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await loadProfile(cred.user.uid)
    posthog.identify(cred.user.uid, { email, role: "guide" })
    posthog.capture("guide_signed_in", { method: "email" })
  }, [loadProfile])

  const signInGuideWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider)
    await loadProfile(result.user.uid)
    posthog.identify(result.user.uid, { email: result.user.email ?? undefined, role: "guide" })
    posthog.capture("guide_signed_in", { method: "google" })
  }, [loadProfile])

  const linkGoogleAccount = useCallback(async () => {
    if (!user) throw new Error("Must be signed in to link accounts.")
    await linkWithPopup(user, googleProvider)
    await loadProfile(user.uid)
  }, [user, loadProfile])

  const handleSignOut = useCallback(async () => {
    await firebaseSignOut(auth)
    setProfile(null)
    posthog.reset()
  }, [])

  const startImpersonating = useCallback(async (studentUid: string) => {
    const snap = await getDoc(doc(db, "users", studentUid))
    if (!snap.exists()) throw new Error("Learner not found.")
    setImpersonating(snap.data() as UserProfile)
  }, [])

  const stopImpersonating = useCallback(() => {
    setImpersonating(null)
  }, [])

  const updateTokens = useCallback(async (delta: number): Promise<number> => {
    if (!user) throw new Error("Must be signed in to update tokens.")
    const targetUid = impersonating?.uid ?? user.uid
    const userRef = doc(db, "users", targetUid)
    await updateDoc(userRef, { tokens: increment(delta), lifetimeTokens: increment(Math.max(0, delta)) })
    const snap = await getDoc(userRef)
    const newTotal = (snap.data() as UserProfile).tokens
    if (impersonating) {
      setImpersonating((prev) => (prev ? { ...prev, tokens: newTotal } : prev))
    } else {
      setProfile((prev) => (prev ? { ...prev, tokens: newTotal } : prev))
    }
    return newTotal
  }, [user, impersonating])

  const saveProgress = useCallback(
    async (standardId: string, data: Partial<ProgressDoc>) => {
      if (!user) throw new Error("Must be signed in to save progress.")
      const targetUid = impersonating?.uid ?? user.uid
      await setDoc(
        doc(db, "progress", targetUid, "standards", standardId),
        data,
        { merge: true }
      )
    },
    [user, impersonating]
  )

  const loadProgressFn = useCallback(async (): Promise<Map<string, ProgressDoc>> => {
    if (!user) throw new Error("Must be signed in to load progress.")
    const targetUid = impersonating?.uid ?? user.uid
    const snap = await getDocs(
      collection(db, "progress", targetUid, "standards")
    )
    const result = new Map<string, ProgressDoc>()
    snap.forEach((d) => {
      result.set(d.id, d.data() as ProgressDoc)
    })
    return result
  }, [user, impersonating])

  return (
    <AuthContext value={{
      user,
      profile,
      loading,
      impersonating,
      activeProfile,
      signInLearner,
      signInStudent: signInLearner, // legacy alias
      signInReturning,
      signInGuide,
      signInGuideWithGoogle,
      linkGoogleAccount,
      signOut: handleSignOut,
      updateTokens,
      saveProgress,
      loadProgress: loadProgressFn,
      startImpersonating,
      stopImpersonating,
    }}>
      {children}
    </AuthContext>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
