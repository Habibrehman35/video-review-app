'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function EnterpriseDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'cameras'>('overview')
  const [selectedEnterprise, setSelectedEnterprise] = useState('Barrett Hodgson Global')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [projects, setProjects] = useState([
    { id: 'PRJ-801', name: 'Q3 Product Launch Promo.mp4', enterprise: 'Barrett Hodgson Global', status: 'In Review', size: '1.4 GB', updated: '10 mins ago' },
    { id: 'PRJ-802', name: 'Machinery Automated QA.mp4', enterprise: 'Salim Winding Tech', status: 'Changes Requested', size: '850 MB', updated: '3 hours ago' },
  ])

  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let isMounted = true
    async function checkUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          router.push('/login')
          return
        }
        if (isMounted) setUser(user)
      } catch (err) {
        console.error('Auth error:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    checkUser()
    return () => { isMounted = false }
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-indigo-400 flex items-center justify-center font-mono text-xs tracking-widest">
        CONNECTING SECURE HTTPS NODE...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
              VR
            </div>
            <span className="font-bold text-sm tracking-tight text-white">VideoReview Enterprise (Secure HTTPS)</span>
          </div>
          <select 
            value={selectedEnterprise} 
            onChange={(e) => setSelectedEnterprise(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none"
          >
            <option value="Barrett Hodgson Global">Barrett Hodgson Global</option>
            <option value="Salim Winding Tech">Salim Winding Tech</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-300 hidden sm:inline">{user?.email}</span>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-lg transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-900/40 border-b border-slate-800 px-6 flex space-x-6 text-xs">
        <button 
          onClick={() => setActiveTab('overview')} 
          className={`py-3 border-b-2 font-medium ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('projects')} 
          className={`py-3 border-b-2 font-medium ${activeTab === 'projects' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}
        >
          Review Projects
        </button>
        <button 
          onClick={() => setActiveTab('cameras')} 
          className={`py-3 border-b-2 font-medium ${activeTab === 'cameras' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}
        >
          Live Security Cameras (HTTPS)
        </button>
      </div>

      {/* Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <p className="text-xs text-slate-400">Active Pipelines</p>
              <h3 className="text-2xl font-bold text-white mt-1">24</h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <p className="text-xs text-slate-400">Security Node Status</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">SSL Active</h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
              <p className="text-xs text-slate-400">Storage Tier</p>
              <h3 className="text-2xl font-bold text-indigo-400 mt-1">142.8 GB</h3>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">Review Files</h2>
            <div className="space-y-2">
              {projects.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs">
                  <span className="font-medium text-white">{p.name}</span>
                  <span className="text-indigo-400">{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cameras' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">Live Surveillance Feed (Aosu / V380 Integration)</h2>
            <p className="text-xs text-slate-400">Encrypted HTTPS streams required for WebRTC camera integration.</p>
            <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-xs text-slate-500 font-mono">
              [ SECURE CAMERA FEED CONNECTED OVER HTTPS ]
            </div>
          </div>
        )}
      </main>
    </div>
  )
}