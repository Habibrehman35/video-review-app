'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function TestimonialDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'submissions'>('campaigns')
  
  // Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! Please record a short video sharing your experience with our service.')

  // Campaigns State
  const [campaigns, setCampaigns] = useState([
    { 
      id: 'cmp_01', 
      title: 'Salim Winding Tech - Client Feedback', 
      expiry: '2026-04-15', 
      link: 'https://videoreview.app/record/cmp_01', 
      submissions: 4, 
      status: 'Active' 
    },
    { 
      id: 'cmp_02', 
      title: 'Barrett Hodgson Product Review', 
      expiry: '2026-03-30', 
      link: 'https://videoreview.app/record/cmp_02', 
      submissions: 7, 
      status: 'Active' 
    },
  ])

  // Submissions State (Videos recorded by clients)
  const [submissions, setSubmissions] = useState([
    { 
      id: 'sub_101', 
      campaignTitle: 'Salim Winding Tech - Client Feedback', 
      clientName: 'Ahmed Ali', 
      clientEmail: 'ahmed@example.com', 
      duration: '01:45', 
      submittedAt: '10 mins ago',
      videoUrl: '#' 
    },
    { 
      id: 'sub_102', 
      campaignTitle: 'Barrett Hodgson Product Review', 
      clientName: 'Dr. Zeeshan', 
      clientEmail: 'zeeshan@bhg.com', 
      duration: '00:58', 
      submittedAt: '2 hours ago',
      videoUrl: '#' 
    },
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

  // Create Campaign Handler
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignTitle) return

    const uniqueId = `cmp_${Math.random().toString(36).substring(2, 7)}`
    const newCampaign = {
      id: uniqueId,
      title: campaignTitle,
      expiry: expiryDate || 'No Expiry',
      link: `https://videoreview.app/record/${uniqueId}`,
      submissions: 0,
      status: 'Active'
    }

    setCampaigns([newCampaign, ...campaigns])
    setCampaignTitle('')
    setExpiryDate('')
    setIsModalOpen(false)
  }

  // Delete Campaign Handler
  const handleDeleteCampaign = (id: string) => {
    setCampaigns(campaigns.filter(c => c.id !== id))
  }

  // Copy Link to Clipboard
  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    alert('Client recording link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-indigo-400 flex items-center justify-center font-mono text-xs tracking-widest">
        LOADING TESTIMONIAL PLATFORM...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
            VT
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">VideoTestimonial Hub</span>
            <span className="text-[10px] text-indigo-400 font-mono">SECURE HTTPS NODE</span>
          </div>
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
          onClick={() => setActiveTab('campaigns')} 
          className={`py-3 border-b-2 font-medium ${activeTab === 'campaigns' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}
        >
          📂 Campaigns & Links ({campaigns.length})
        </button>
        <button 
          onClick={() => setActiveTab('submissions')} 
          className={`py-3 border-b-2 font-medium ${activeTab === 'submissions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400'}`}
        >
          🎥 Client Video Submissions ({submissions.length})
        </button>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        
        {/* TAB 1: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Video Testimonial Campaigns</h2>
                <p className="text-xs text-slate-400">Create campaigns, set link expiry dates, and send recording links to your clients.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
              >
                + Create New Campaign
              </button>
            </div>

            <div className="space-y-3">
              {campaigns.map(camp => (
                <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{camp.status}</span>
                      <span className="text-xs text-slate-400 font-mono">Expires: {camp.expiry}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{camp.title}</h3>
                    <p className="text-xs text-indigo-400 font-mono break-all">{camp.link}</p>
                  </div>

                  <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                    <span className="text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      Submissions: <b>{camp.submissions}</b>
                    </span>
                    <button 
                      onClick={() => handleCopyLink(camp.link)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-all"
                    >
                      Copy Link
                    </button>
                    <button 
                      onClick={() => handleDeleteCampaign(camp.id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-lg transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white">Recorded Client Video Submissions</h2>
              <p className="text-xs text-slate-400">Review, playback, and download video testimonials sent by your clients.</p>
            </div>

            <div className="space-y-3">
              {submissions.map(sub => (
                <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-indigo-400">{sub.campaignTitle}</span>
                    <h3 className="text-sm font-bold text-white">{sub.clientName} <span className="text-xs text-slate-400 font-normal">({sub.clientEmail})</span></h3>
                    <p className="text-[10px] text-slate-400 font-mono">Duration: {sub.duration} • Submitted: {sub.submittedAt}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => alert(`Playing video review for ${sub.clientName}`)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
                    >
                      ▶ Watch Video
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* CREATE CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create Testimonial Campaign</h3>
            <p className="text-xs text-slate-400">Set up a new recording link with an optional expiration date for clients.</p>
            
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Campaign Title / Client Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Salim Winding Q3 Feedback" 
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Link Expiry Date</label>
                <input 
                  type="date" 
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Welcome Prompt for Client</label>
                <textarea 
                  rows={3}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
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
                  Generate Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}