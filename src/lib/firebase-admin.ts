import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getFirestore } from "firebase-admin/firestore"

function getServiceAccount(): ServiceAccount {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set")
  // Support base64-encoded or raw JSON
  try {
    return JSON.parse(Buffer.from(key, "base64").toString())
  } catch {
    return JSON.parse(key)
  }
}

const app = getApps().length === 0
  ? initializeApp({ credential: cert(getServiceAccount()) })
  : getApps()[0]

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
