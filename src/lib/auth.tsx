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
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  increment,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type { UserProfile, ProgressDoc } from "@/lib/auth-types"

interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInStudent: (classCode: string, name: string) => Promise<void>
  signInGuide: (email: string, password: string) => Promise<void>
  signInGuideWithGoogle: () => Promise<void>
  linkGoogleAccount: () => Promise<void>
  signOut: () => Promise<void>
  updateTokens: (delta: number) => Promise<number>
  saveProgress: (standardId: string, data: Partial<ProgressDoc>) => Promise<void>
  loadProgress: () => Promise<Map<string, ProgressDoc>>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Load user profile from Firestore
  const loadProfile = useCallback(async (uid: string) => {
    const snap = await getDoc(doc(db, "users", uid))
    if (snap.exists()) {
      setProfile(snap.data() as UserProfile)
    } else {
      setProfile(null)
    }
  }, [])

  // Handle Google redirect result on page load
  useEffect(() => {
    getRedirectResult(auth).catch(() => {
      // No redirect result — that's fine
    })
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

  const signInStudent = useCallback(async (classCode: string, name: string) => {
    // 1. Find the class by code
    const classQuery = query(
      collection(db, "classes"),
      where("code", "==", classCode.toUpperCase())
    )
    const classSnap = await getDocs(classQuery)
    if (classSnap.empty) throw new Error("Class not found. Check your code.")
    const classDoc = classSnap.docs[0]
    const classId = classDoc.id

    // 2. Sign in anonymously (or already signed in)
    let currentUser = auth.currentUser
    if (!currentUser) {
      const cred = await signInAnonymously(auth)
      currentUser = cred.user
    }

    // 3. Check if this student already exists in this class
    const studentsQuery = query(
      collection(db, "users"),
      where("classId", "==", classId),
      where("name", "==", name.trim())
    )
    const studentSnap = await getDocs(studentsQuery)

    if (!studentSnap.empty) {
      // Returning student — update their uid to current auth uid and lastLoginAt
      const existingDoc = studentSnap.docs[0]
      const existingData = existingDoc.data()
      await setDoc(doc(db, "users", currentUser.uid), {
        ...existingData,
        uid: currentUser.uid,
        lastLoginAt: Date.now(),
      })
    } else {
      // New student
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        name: name.trim(),
        role: "student",
        grade: "",
        interests: [],
        classId,
        tokens: 0,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      } satisfies UserProfile)
    }

    // Reload profile
    await loadProfile(currentUser.uid)
  }, [loadProfile])

  const signInGuide = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await loadProfile(cred.user.uid)
  }, [loadProfile])

  const signInGuideWithGoogle = useCallback(async () => {
    // Redirect-based — page will reload after Google auth
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

  const updateTokens = useCallback(async (delta: number): Promise<number> => {
    if (!user) throw new Error("Must be signed in to update tokens.")
    const userRef = doc(db, "users", user.uid)
    await updateDoc(userRef, { tokens: increment(delta) })
    const snap = await getDoc(userRef)
    const newTotal = (snap.data() as UserProfile).tokens
    setProfile((prev) => (prev ? { ...prev, tokens: newTotal } : prev))
    return newTotal
  }, [user])

  const saveProgress = useCallback(
    async (standardId: string, data: Partial<ProgressDoc>) => {
      if (!user) throw new Error("Must be signed in to save progress.")
      await setDoc(
        doc(db, "progress", user.uid, "standards", standardId),
        data,
        { merge: true }
      )
    },
    [user]
  )

  const loadProgressFn = useCallback(async (): Promise<Map<string, ProgressDoc>> => {
    if (!user) throw new Error("Must be signed in to load progress.")
    const snap = await getDocs(
      collection(db, "progress", user.uid, "standards")
    )
    const result = new Map<string, ProgressDoc>()
    snap.forEach((d) => {
      result.set(d.id, d.data() as ProgressDoc)
    })
    return result
  }, [user])

  return (
    <AuthContext value={{
      user,
      profile,
      loading,
      signInStudent,
      signInGuide,
      signInGuideWithGoogle,
      linkGoogleAccount,
      signOut: handleSignOut,
      updateTokens,
      saveProgress,
      loadProgress: loadProgressFn,
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
