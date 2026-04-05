"use client"

import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default function GuideDashboard() {
  const { profile, signOut } = useAuth()

  if (!profile) return null

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Guide Dashboard</h1>
            <p className="text-zinc-400 text-sm">Welcome, {profile.name}</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>Sign Out</Button>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-400">Dashboard coming soon. Your class will appear here.</p>
        </div>
      </div>
    </div>
  )
}
