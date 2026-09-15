'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function checkUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        setUser(user)
      } catch (err) {
        console.error('Auth error:', err)
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-mono text-sm">
        Loading Dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-10 space-y-6">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl space-y-4">
        <h1 className="text-2xl font-bold text-white">Dashboard Command Center</h1>
        <p className="text-slate-300 text-sm">
          Successfully logged in as: <span className="font-mono text-indigo-400">{user?.email}</span>
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/login')
          }}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}