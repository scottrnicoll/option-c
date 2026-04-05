import { initializeApp, getApps, cert, type ServiceAccount, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

function getServiceAccount(): ServiceAccount {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY not set")
  try {
    return JSON.parse(Buffer.from(key, "base64").toString())
  } catch {
    return JSON.parse(key)
  }
}

let _app: App | null = null
function getApp(): App {
  if (!_app) {
    _app = getApps().length === 0
      ? initializeApp({ credential: cert(getServiceAccount()) })
      : getApps()[0]
  }
  return _app
}

let _auth: Auth | null = null
export function getAdminAuth(): Auth {
  if (!_auth) _auth = getAuth(getApp())
  return _auth
}

let _db: Firestore | null = null
export function getAdminDb(): Firestore {
  if (!_db) _db = getFirestore(getApp())
  return _db
}
