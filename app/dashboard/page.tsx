'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function EnterpriseDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'review' | 'cameras' | 'team'>('overview')
  const [selectedEnterprise, setSelectedEnterprise] = useState('Barrett Hodgson Global')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Campaign & Video Review State
  const [campaignName, setCampaignName] = useState('')
  const [campaignObjective, setCampaignObjective] = useState('Product Launch Promo')
  const [campaigns, setCampaigns] = useState([
    { id: 'CMP-501', name: 'Q3 Global Pharma Awareness', enterprise: 'Barrett Hodgson Global', status: 'Active Review', format: '1080p 60fps', progress: '80%', updated: '5 mins ago' },
    { id: 'CMP-502', name: 'Automated Winding Line Showcase', enterprise: 'Salim Winding Tech', status: 'Pending Generation', format: '4K Master', progress: '30%', updated: '2 hours ago' },
  ])

  const [reviewAssets, setReviewAssets] = useState([
    { id: 'PRJ-801', title: 'Q3 Product Launch Promo.mp4', enterprise: 'Barrett Hodgson Global', status: 'In Review', size: '1.4 GB', author: 'Habib Rehman' },
    { id: 'PRJ-802', title: 'Machinery Automated QA.mp4', enterprise: 'Salim Winding Tech', status: 'Changes Requested', size: '850 MB', author: 'Ali Khan' },
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

  const handleGenerateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignName) return
    const newCamp = {
      id: `CMP-${Math.floor(100 + Math.random() * 900)}`,
      name: campaignName,
      enterprise: selectedEnterprise,
      status: 'Generating AI Stream',
      format: '4K Ultra HD',
      progress: '10%',
      updated: 'Just now',
    }
    setCampaigns([newCamp, ...campaigns])
    setCampaignName('')
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-indigo-400 flex items-center justify-center font-mono text-xs tracking-widest">
        INITIALIZING ENTERPRISE CAMPAIGN NODE...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
              VR
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">VideoReview Enterprise</span>
              <span className="text-[10px] text-indigo-400 font-mono">SECURE HTTPS NODE</span>
            </div>
          </div>
          
          <select 
            value={selectedEnterprise} 
            onChange={(e) => setSelectedEnterprise(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="Barrett Hodgson Global">🏢 Barrett Hodgson Global</option>
            <option value="Salim Winding Tech">🏭 Salim Winding Tech</option>
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

      {/* Tabs Navigation */}
      <div className="bg-slate-900/40 border-b border-slate-800 px-6 flex space-x-6 text-xs overflow-x-auto">
        <button onClick={() => setActiveTab('overview')} className={`py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}>
          📊 Overview
        </button>
        <button onClick={() => setActiveTab('campaigns')} className={`py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === 'campaigns' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}>
          🚀 Video Campaigns & Generator
        </button>
        <button onClick={() => setActiveTab('review')} className={`py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === 'review' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}>
          🎬 Asset Review Pipeline ({reviewAssets.length})
        </button>
        <button onClick={() => setActiveTab('cameras')} className={`py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === 'cameras' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}>
          📷 Live Security Cameras
        </button>
        <button onClick={() => setActiveTab('team')} className={`py-3 border-b-2 font-medium whitespace-nowrap ${activeTab === 'team' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}>
          👥 Team Access
        </button>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400">Active Campaigns</p>
                <h3 className="text-2xl font-bold text-white mt-1">12</h3>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400">Review Pipelines</p>
                <h3 className="text-2xl font-bold text-indigo-400 mt-1">24</h3>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400">SSL Node Status</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">Encrypted</h3>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                <p className="text-xs text-slate-400">Storage Bandwidth</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">142.8 GB</h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white">Recent Activity for {selectedEnterprise}</h2>
              <p className="text-xs text-slate-400">All campaign sync operations with FBR and AWS S3 storage are operating normally.</p>
            </div>
          </div>
        )}

        {/* TAB 2: VIDEO CAMPAIGNS & GENERATOR */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Video Campaign Generator & Management</h2>
                <p className="text-xs text-slate-400">Create and dispatch automated video campaigns for enterprise products.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
              >
                + Generate New Campaign
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map(camp => (
                <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{camp.id}</span>
                      <h3 className="text-sm font-bold text-white mt-1.5">{camp.name}</h3>
                    </div>
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{camp.status}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex justify-between pt-2 border-t border-slate-800">
                    <span>Format: {camp.format}</span>
                    <span>Progress: {camp.progress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ASSET REVIEW PIPELINE */}
        {activeTab === 'review' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">Video Review & Approval Pipeline</h2>
            <div className="space-y-3">
              {reviewAssets.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="font-medium text-white block">{p.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Enterprise: {p.enterprise} • Size: {p.size}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-indigo-400 font-medium px-2.5 py-1 bg-indigo-500/10 rounded-lg">{p.status}</span>
                    <button onClick={() => alert(`Reviewing asset ${p.id}`)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg">Inspect</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CAMERAS */}
        {activeTab === 'cameras' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">Live Surveillance Feed (Aosu / V380 Integration)</h2>
            <p className="text-xs text-slate-400">Encrypted HTTPS streams required for WebRTC camera integration.</p>
            <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-xs text-slate-500 font-mono">
              [ SECURE CAMERA FEED CONNECTED OVER HTTPS ]
            </div>
          </div>
        )}

        {/* TAB 5: TEAM */}
        {activeTab === 'team' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">Enterprise Team & Permissions</h2>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-white font-medium">{user?.email}</span>
              <span className="text-emerald-400">SuperAdmin (Active)</span>
            </div>
          </div>
        )}

      </main>

      {/* GENERATE CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Generate Video Campaign</h3>
            <p className="text-xs text-slate-400">Configure parameters for automated rendering under {selectedEnterprise}.</p>
            
            <form onSubmit={handleGenerateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Campaign Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q4 Global Product Walkthrough" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Campaign Objective</label>
                <select 
                  value={campaignObjective}
                  onChange={(e) => setCampaignObjective(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Product Launch Promo">Product Launch Promo</option>
                  <option value="Automated QA Showcase">Automated QA Showcase</option>
                  <option value="FBR E-Invoicing Walkthrough">FBR E-Invoicing Walkthrough</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg"
                >
                  Start Generation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}