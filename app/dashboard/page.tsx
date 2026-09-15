'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function EnterpriseDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'analytics' | 'audit' | 'team'>('overview')
  const [selectedEnterprise, setSelectedEnterprise] = useState('Barrett Hodgson Global')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [projects, setProjects] = useState([
    { id: 'PRJ-801', name: 'Q3 Product Launch Promo.mp4', enterprise: 'Barrett Hodgson Global', status: 'In Review', size: '1.4 GB', updated: '10 mins ago', author: 'Habib Rehman' },
    { id: 'PRJ-802', name: 'Machinery Automated QA.mp4', enterprise: 'Salim Winding Tech', status: 'Changes Requested', size: '850 MB', updated: '3 hours ago', author: 'Ali Khan' },
    { id: 'PRJ-803', name: 'FBR E-Invoicing API Sync Walkthrough', enterprise: 'Barrett Hodgson Global', status: 'Approved', size: '2.1 GB', updated: '1 day ago', author: 'System Bot' },
    { id: 'PRJ-804', name: 'Active Balancer Hardware Stress Test', enterprise: 'Salim Winding Tech', status: 'Pending Review', size: '420 MB', updated: '2 days ago', author: 'Zubair Ahmed' },
  ])

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName) return
    const newProj = {
      id: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      name: newProjectName,
      enterprise: selectedEnterprise,
      status: 'Pending Review',
      size: '1.1 GB',
      updated: 'Just now',
      author: user?.email?.split('@')[0] || 'Admin',
    }
    setProjects([newProj, ...projects])
    setNewProjectName('')
    setIsModalOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-indigo-400 flex flex-col items-center justify-center font-mono text-sm tracking-widest space-y-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        INITIALIZING SECURE ENTERPRISE NODE...
      </div>
    )
  }

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedEnterprise === 'All Enterprises' || p.enterprise === selectedEnterprise)
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Enterprise Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25">
              VR
            </div>
            <div>
              <span className="font-bold tracking-tight text-base text-white block leading-none">VideoReview Core</span>
              <span className="text-[10px] text-indigo-400 font-mono">ENTERPRISE v4.2</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 bg-slate-950 border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Node:</span>
            <select 
              value={selectedEnterprise} 
              onChange={(e) => setSelectedEnterprise(e.target.value)}
              className="bg-transparent text-indigo-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All Enterprises">🌐 All Enterprises (Global)</option>
              <option value="Barrett Hodgson Global">🏢 Barrett Hodgson Global</option>
              <option value="Salim Winding Tech">🏭 Salim Winding Tech</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-medium text-slate-200">{user?.email}</p>
            <div className="flex items-center justify-end space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider">SECURE SESSION</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-xl transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Secondary Tab Navigation Bar */}
      <div className="bg-slate-900/40 border-b border-slate-800/60 px-6">
        <div className="max-w-7xl mx-auto flex space-x-8 overflow-x-auto text-xs font-medium">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            📊 Command Overview
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'projects' ? 'border-indigo-500 text-indigo-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            🎬 Video Review Assets ({projects.length})
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'analytics' ? 'border-indigo-500 text-indigo-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            📈 Pipeline Analytics
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'audit' ? 'border-indigo-500 text-indigo-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            🛡️ Security & Audit Logs
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`py-3.5 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'team' ? 'border-indigo-500 text-indigo-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            👥 Enterprise Team
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-950/70 via-slate-9il to-slate-900 border border-indigo-500/20 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="text-[10px] font-mono font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    Enterprise Node Online
                  </span>
                  <h1 className="text-2xl md:text-3xl font-bold text-white mt-3">
                    Welcome back, Habib Shah 👋
                  </h1>
                  <p className="text-slate-400 text-xs md:text-sm mt-1.5 max-w-xl">
                    Live monitoring active video pipelines, FBR e-invoicing integrations, and AWS S3 storage streams for <strong className="text-slate-200">{selectedEnterprise}</strong>.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
                  >
                    <span>+ New Review Project</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Active Review Pipelines</p>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-3xl font-bold text-white">24</h3>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">+12%</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Sync rate 99.8% stable</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Pending Feedback Blocks</p>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-3xl font-bold text-white">7</h3>
                  <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded">Action Req</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Requires reviewer input</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">Cloud Storage Bandwidth</p>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-3xl font-bold text-white">142.8 GB</h3>
                  <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">45% Tier</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">AWS S3 Frankfurt region</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-medium text-slate-400">FBR E-Invoicing Status</p>
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-3xl font-bold text-emerald-400">Synced</h3>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">Secure</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Connected via Thobson API</p>
              </div>
            </div>

            {/* Recent Table Preview */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Recent Video Assets</h2>
                  <p className="text-xs text-slate-400">Showing recent uploads for current node.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  View All →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Asset ID</th>
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Enterprise Unit</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {projects.slice(0, 3).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-indigo-400">{p.id}</td>
                        <td className="py-3.5 px-4 font-medium text-white">{p.name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{p.enterprise}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            p.status === 'In Review' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{p.size}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button onClick={() => alert(`Opening asset inspector for ${p.id}`)} className="text-indigo-400 hover:underline font-semibold">Inspect</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Video Review Management</h2>
                <p className="text-xs text-slate-400">Manage, track, and collaborate on enterprise media files.</p>
              </div>
              <div className="flex items-center space-x-3">
                <input 
                  type="text" 
                  placeholder="Search assets..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-64"
                />
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg transition-all"
                >
                  + Upload Asset
                </button>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Asset ID</th>
                      <th className="py-3 px-4">Project / File Name</th>
                      <th className="py-3 px-4">Enterprise Unit</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4">Last Updated</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-indigo-400">{p.id}</td>
                        <td className="py-3.5 px-4 font-medium text-white">{p.name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{p.enterprise}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            p.status === 'In Review' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{p.author}</td>
                        <td className="py-3.5 px-4 text-slate-400">{p.updated}</td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button onClick={() => alert(`Reviewing ${p.id}`)} className="text-indigo-400 hover:underline">Open</button>
                          <button onClick={() => setProjects(projects.filter(item => item.id !== p.id))} className="text-rose-400 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">Pipeline Telemetry & Analytics</h2>
              <p className="text-xs text-slate-400">Detailed performance logs and reviewer response metrics.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Review Turnaround Times (Hours)</h3>
                <div className="h-48 bg-slate-950/50 rounded-xl border border-slate-800 flex items-end justify-between p-4">
                  {[40, 65, 30, 85, 50, 90, 75].map((h, i) => (
                    <div key={i} className="w-8 bg-indigo-600/80 hover:bg-indigo-500 rounded-t-lg transition-all relative group" style={{ height: `${h}%` }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 font-mono">{h}h</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 text-center">Average turnaround time improved by 14% this week.</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Storage Allocation Breakdown</h3>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Raw 4K Footage</span>
                      <span className="text-indigo-400 font-mono">92.4 GB (65%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[65%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Compressed Review Proxies</span>
                      <span className="text-violet-400 font-mono">35.2 GB (25%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-violet-500 h-full w-[25%]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">System Logs & Metadata</span>
                      <span className="text-emerald-400 font-mono">15.2 GB (10%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[10%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white">Security & Audit Trails</h2>
              <p className="text-xs text-slate-400">Cryptographic event logging and Fortinet security tokens.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-800 text-slate-400">
                <span>TIMESTAMP (UTC)</span>
                <span>EVENT ACTION</span>
                <span>IP ORIGIN</span>
                <span>STATUS</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-300">2026-09-15 05:09:05</span>
                <span className="text-indigo-300">SUPABASE_AUTH_TOKEN_VERIFIED</span>
                <span className="text-slate-400">175.107.x.x</span>
                <span className="text-emerald-400 font-semibold">SUCCESS</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                <span className="text-slate-300">2026-09-15 04:22:10</span>
                <span className="text-indigo-300">FBR_E_INVOICE_SYNC</span>
                <span className="text-slate-400">103.255.x.x</span>
                <span className="text-emerald-400 font-semibold">COMMITTED</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-300">2026-09-15 02:15:00</span>
                <span className="text-indigo-300">FORTINET_FIREWALL_HANDSHAKE</span>
                <span className="text-slate-400">LOCALHOST</span>
                <span className="text-emerald-400 font-semibold">SECURED</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TEAM */}
        {activeTab === 'team' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Enterprise Team Members</h2>
                <p className="text-xs text-slate-400">Manage permissions and access control lists.</p>
              </div>
              <button onClick={() => alert('Invite modal triggered')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl">
                + Invite Member
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-xs">
                      HR
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Habib Rehman</p>
                      <p className="text-[11px] text-slate-400">habib.rehman@barretthodgson.com</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] rounded-lg font-semibold">Owner / SuperAdmin</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 text-xs">
                      SW
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">Salim Winding Lead</p>
                      <p className="text-[11px] text-slate-400">admin@salimwinding.com</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] rounded-lg font-semibold">Enterprise Reviewer</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* CREATE PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fadeIn">
            <h3 className="text-lg font-bold text-white">Create New Review Project</h3>
            <p className="text-xs text-slate-400">Initialize a fresh video asset pipeline for {selectedEnterprise}.</p>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project / Video Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q4 Marketing Campaign.mp4" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
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
                  Initialize Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}