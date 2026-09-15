'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

interface Campaign {
  id: string
  title: string
  slug: string
  expires_at?: string | null
  created_at?: string
}

interface Submission {
  id: string
  campaign_id: string
  client_name?: string
  client_email?: string
  duration?: string
  video_url: string
  created_at: string
  campaigns?: {
    title: string
  }
}

export default function TestimonialDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'submissions'>('campaigns')
  
  // Real Database States
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [campaignTitle, setCampaignTitle] = useState('')
  const [promptQuestion, setPromptQuestion] = useState('How was your overall experience working with our team?')
  const [expiryDate, setExpiryDate] = useState('')
  const [baseUrl, setBaseUrl] = useState('')

  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }

    let isMounted = true

    async function loadDashboardData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/login')
          return
        }
        if (isMounted) setUser(user)

        // 1. Fetch Campaigns from Supabase for this user
        const { data: campaignData, error: campError } = await supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!campError && campaignData && isMounted) {
          setCampaigns(campaignData)

          // 2. Fetch Submissions securely tied to this user's campaigns
          const campaignIds = campaignData.map(c => c.id)

          if (campaignIds.length > 0) {
            const { data: subData, error: subError } = await supabase
              .from('submissions')
              .select('*')
              .in('campaign_id', campaignIds)
              .order('created_at', { ascending: false })

            if (!subError && subData && isMounted) {
              const formattedSubmissions = subData.map(sub => {
                const matchedCamp = campaignData.find(c => c.id === sub.campaign_id)
                return {
                  ...sub,
                  campaigns: { title: matchedCamp?.title || 'Review Campaign' }
                }
              })
              setSubmissions(formattedSubmissions)
            }
          } else {
            setSubmissions([])
          }
        }

      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboardData()

    return () => { 
      isMounted = false 
    }
  }, [router, supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Real Database Campaign Creation
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignTitle || !user) return

    setIsSubmitting(true)
    try {
      const baseSlug = campaignTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      const uniqueSlug = `${baseSlug || 'campaign'}-${Math.random().toString(36).substring(2, 7)}`
      const expires_at = expiryDate ? new Date(expiryDate).toISOString() : null

      const { data: newCampaign, error: insertError } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          title: campaignTitle,
          prompt_question: promptQuestion,
          slug: uniqueSlug,
          expires_at: expires_at
        })
        .select()
        .single()

      if (insertError) {
        alert(`Failed to create campaign: ${insertError.message}`)
        return
      }

      if (newCampaign) {
        setCampaigns([newCampaign, ...campaigns])
        setCampaignTitle('')
        setPromptQuestion('How was your overall experience working with our team?')
        setExpiryDate('')
        setIsModalOpen(false)
      }
    } catch (err: any) {
      console.error('Creation error:', err)
      alert('An unexpected error occurred while creating the campaign.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) {
      alert(`Delete failed: ${error.message}`)
      return
    }

    setCampaigns(campaigns.filter(c => c.id !== id))
  }

  const handleCopyLink = (slug: string) => {
    const fullLink = `${baseUrl}/review/${slug}`
    navigator.clipboard.writeText(fullLink)
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
            <span className="text-[10px] text-indigo-400 font-mono">LIVE DATABASE CONNECTED</span>
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
        
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-white">Video Testimonial Campaigns</h2>
                <p className="text-xs text-slate-400">Manage your active review funnels stored securely in Supabase.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
              >
                + Create New Campaign
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <p className="text-sm text-slate-300 font-semibold">No campaigns found.</p>
                <p className="text-xs text-slate-500">Click &quot;Create New Campaign&quot; to generate your first review link.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(camp => {
                  const reviewLink = `${baseUrl}/review/${camp.slug}`
                  const isExpired = camp.expires_at ? new Date(camp.expires_at) < new Date() : false

                  return (
                    <div key={camp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${isExpired ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'}`}>
                            {isExpired ? 'Expired' : 'Active'}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Expires: {camp.expires_at ? new Date(camp.expires_at).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{camp.title}</h3>
                        <p className="text-xs text-indigo-400 font-mono break-all">{reviewLink}</p>
                      </div>

                      <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                        <button 
                          onClick={() => handleCopyLink(camp.slug)}
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
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white">Recorded Client Video Submissions</h2>
              <p className="text-xs text-slate-400">Review video testimonials sent by clients through your campaign links.</p>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <p className="text-sm text-slate-300 font-semibold">No video submissions yet.</p>
                <p className="text-xs text-slate-500">When clients record and submit reviews, they will appear here instantly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map(sub => (
                  <div key={sub.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-indigo-400">{sub.campaigns?.title || 'Review Campaign'}</span>
                      <h3 className="text-sm font-bold text-white">
                        {sub.client_name || 'Anonymous Client'} 
                        {sub.client_email && <span className="text-xs text-slate-400 font-normal"> ({sub.client_email})</span>}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Submitted: {new Date(sub.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <a 
                        href={sub.video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all"
                      >
                        ▶ Watch Video
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* CREATE CAMPAIGN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create Testimonial Campaign</h3>
            <p className="text-xs text-slate-400">Generate a live recording link connected directly to your database.</p>
            
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Prompt Question for Clients</label>
                <textarea 
                  rows={2}
                  value={promptQuestion}
                  onChange={(e) => setPromptQuestion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Link Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Generate Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}