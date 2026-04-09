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
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  linkWithRedirect,
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
const CODE_WORDS = [
  "STAR", "MOON", "SUN", "CAT", "DOG", "OWL", "FOX", "BEE",
  "BEAR", "LION", "WOLF", "DEER", "FROG", "DUCK", "HAWK", "SEAL",
  "FISH", "CRAB", "WAVE", "ROCK", "TREE", "LEAF", "RAIN", "SNOW",
  "FIRE", "WIND", "LAVA", "MINT", "PLUM", "KIWI", "LIME", "PEAR",
]

// Generate a unique personal code like "STAR-742". Collision probability per
// attempt is ~1/32000, so a couple of retries is enough.
async function generateUniquePersonalCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]
    const digits = String(Math.floor(Math.random() * 1000)).padStart(3, "0")
    const code = `${word}-${digits}`
    const existing = await getDocs(
      query(collection(db, "users"), where("personalCode", "==", code))
    )
    if (existing.empty) return code
  }
  // Fallback: add a trailing random char to break any remaining collision
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]
  const digits = String(Math.floor(Math.random() * 10000)).padStart(4, "0")
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

  // Handle Google redirect result on page load
  useEffect(() => {
    getRedirectResult(auth).catch((err) => { console.error("[Auth] Redirect error:", err) })
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

    // 3. Delete the old user doc so lookups by personalCode stay unique.
    //    (We could also delete progress/{oldUid} but it costs reads; leave it.)
    try {
      await deleteDoc(doc(db, "users", oldUid))
    } catch (err) {
      console.warn("[auth] old user delete failed:", err)
    }
  }, [])

  const signInLearner = useCallback(async (classCode: string, name: string) => {
    // 1. Sign in anonymously first (needed for Firestore access)
    let currentUser = auth.currentUser
    if (!currentUser) {
      const cred = await signInAnonymously(auth)
      currentUser = cred.user
    }

    // 2. Find the class by code
    const classQuery = query(
      collection(db, "classes"),
      where("code", "==", classCode.toUpperCase())
    )
    const classSnap = await getDocs(classQuery)
    if (classSnap.empty) throw new Error("Class not found. Check your code.")
    const classDoc = classSnap.docs[0]
    const classId = classDoc.id

    // 3. Check if this student already exists in this class
    const studentsQuery = query(
      collection(db, "users"),
      where("classId", "==", classId),
      where("name", "==", name.trim())
    )
    const studentSnap = await getDocs(studentsQuery)

    if (!studentSnap.empty) {
      // Returning student signing in via class-code + name path.
      // Migrate their data to the new anonymous uid and preserve personalCode.
      const existingDoc = studentSnap.docs[0]
      const existingData = existingDoc.data() as UserProfile
      const oldUid = existingData.uid
      // Make sure they have a personal code (back-fill for pre-existing users)
      const personalCode = existingData.personalCode ?? (await generateUniquePersonalCode())
      await setDoc(doc(db, "users", currentUser.uid), {
        ...existingData,
        uid: currentUser.uid,
        personalCode,
        lastLoginAt: Date.now(),
      })
      await migrateStudentData(oldUid, currentUser.uid)
    } else {
      // Brand-new student — generate a personal code and save the profile
      const personalCode = await generateUniquePersonalCode()
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        name: name.trim(),
        role: "student",
        grade: "",
        interests: [],
        classId,
        tokens: 0,
        personalCode,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      } satisfies UserProfile)
    }

    // Reload profile
    await loadProfile(currentUser.uid)
  }, [loadProfile, migrateStudentData])

  // Returning-student login: look up by personal code + name, then migrate
  // their data to a new anonymous uid.
  const signInReturning = useCallback(async (name: string, personalCode: string) => {
    // 1. Sign in anonymously FIRST so the Firestore queries below run as
    //    an authenticated user. Without this, the users-by-personalCode
    //    query is rejected by Firestore rules with "Missing or
    //    insufficient permissions."
    let currentUser = auth.currentUser
    if (!currentUser) {
      const cred = await signInAnonymously(auth)
      currentUser = cred.user
    }

    // 2. Find the existing student by personal code
    const normalizedCode = personalCode.trim().toUpperCase()
    const codeQuery = query(
      collection(db, "users"),
      where("personalCode", "==", normalizedCode)
    )
    const codeSnap = await getDocs(codeQuery)
    if (codeSnap.empty) {
      throw new Error("We don't know that code. Check the code or use your class code instead.")
    }
    const existingDoc = codeSnap.docs[0]
    const existingData = existingDoc.data() as UserProfile

    // 3. Second factor: name must match (case-insensitive, trimmed)
    if (existingData.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      throw new Error("That code doesn't match the name. Try again.")
    }

    // 4. Copy the profile to the new uid and migrate data
    const oldUid = existingData.uid
    await setDoc(doc(db, "users", currentUser.uid), {
      ...existingData,
      uid: currentUser.uid,
      lastLoginAt: Date.now(),
    })
    await migrateStudentData(oldUid, currentUser.uid)

    // 5. Reload profile
    await loadProfile(currentUser.uid)
  }, [loadProfile, migrateStudentData])

  const signInGuide = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await loadProfile(cred.user.uid)
  }, [loadProfile])

  const signInGuideWithGoogle = useCallback(async () => {
    await signInWithRedirect(auth, googleProvider)
  }, [])

  const linkGoogleAccount = useCallback(async () => {
    if (!user) throw new Error("Must be signed in to link accounts.")
    await linkWithRedirect(user, googleProvider)
  }, [user])

  const handleSignOut = useCallback(async () => {
    await firebaseSignOut(auth)
    setProfile(null)
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
    await updateDoc(userRef, { tokens: increment(delta) })
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
