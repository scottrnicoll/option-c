export interface UserProfile {
  uid: string
  name: string
  role: "student" | "guide" | "admin"
  grade: string
  interests: string[]
  classId: string
  tokens: number
  linkedGoogleUid?: string
  createdAt: number
  lastLoginAt: number
}

export interface ClassDoc {
  name: string
  code: string
  guideUid: string
  createdAt: number
}

export interface ProgressDoc {
  status: "locked" | "available" | "in_progress" | "unlocked" | "mastered"
  unlockedAt?: number
  masteredAt?: number
  masteryWins?: number
}
