'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  title: string
  prompt_question: string
  slug: string
  created_at: string
  expires_at: string
}

interface Testimonial {
  id: string
  campaign_id: string
  client_name: string
  client_email: string
  video_url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'reviews'>('reviews')
  const [errorMessage, setErrorMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: campData, error: campErr } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })

      if (campErr) throw campErr

      const { data: testData, error: testErr } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })

      if (testErr) throw testErr

      setCampaigns(campData || [])
      setTestimonials(testData || [])
    } catch (err: unknown) {
      const errorObj = err as Error
      setErrorMessage(errorObj.message || 'Failed to fetch dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  // Fix: Instant state update after database mutation
  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      // Update local state immediately so UI refreshes without needing manual reload
      setTestimonials(prev =>
        prev.map(t => (t.id === id ? { ...t, status: newStatus } : t))
      )
    } catch (err: unknown) {
      const errorObj = err as Error
      alert('Failed to update status: ' + errorObj.message)
    }
  }

  const isExpired = (expiresAt: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold tracking-wider uppercase mb-2">
              <span>Enterprise Admin Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Review Management</h1>
          </div>

          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'reviews' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Testimonial Reviews ({testimonials.length})
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Campaigns ({campaigns.length})
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl">
            {errorMessage}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((review) => {
                const campaign = campaigns.find(c => c.id === review.campaign_id)
                return (
                  <div key={review.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between p-5 space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-white text-sm">{review.client_name}</h3>
                          <p className="text-slate-400 text-xs">{review.client_email}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          review.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          review.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {review.status}
                        </span>
                      </div>

                      {campaign && (
                        <p className="text-xs text-indigo-400 font-medium">Campaign: {campaign.title}</p>
                      )}

                      <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
                        <video src={review.video_url} controls playsInline className="w-full h-full object-cover" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                        className="py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'rejected')}
                        className="py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-all"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                )
              })}
              {testimonials.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-500 text-sm">
                  No client reviews submitted yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Campaigns Tab with Blur for Expired & Timelines */}
        {activeTab === 'campaigns' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => {
              const expired = isExpired(camp.expires_at)
              return (
                <div 
                  key={camp.id} 
                  className={`relative bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 transition-all ${
                    expired ? 'opacity-75' : ''
                  }`}
                >
                  {/* Expired Blur Overlay badge */}
                  {expired && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10 pointer-events-none">
                      <span className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold tracking-widest uppercase shadow-lg">
                        Expired Campaign
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-white">{camp.title}</h3>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                      /{camp.slug}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 italic bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    &ldquo;{camp.prompt_question}&rdquo;
                  </p>

                  {/* Timeline Details */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="block text-[10px] text-slate-500 uppercase">Created Date</span>
                      <span className="text-slate-200">{formatDate(camp.created_at)}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="block text-[10px] text-slate-500 uppercase">Expiry Date</span>
                      <span className={expired ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {formatDate(camp.expires_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {campaigns.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 text-sm">
                No campaigns created yet.
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}