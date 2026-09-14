'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Testimonial {
  id: string
  client_name: string
  client_email: string
  video_url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  campaigns?: {
    title: string
  }
}

export default function DashboardClientFeed({ 
  initialTestimonials, 
  onStateChange 
}: { 
  initialTestimonials: Testimonial[]
  onStateChange: () => void 
}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setTestimonials(initialTestimonials)
  }, [initialTestimonials])

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setLoadingId(id)
    const { error } = await supabase
      .from('testimonials')
      .update({ status: newStatus })
      .eq('id', id)

    if (!error) {
      setTestimonials(prev =>
        prev.map(t => (t.id === id ? { ...t, status: newStatus } : t))
      )
      onStateChange() // Triggers parent/server revalidation to update pending queue count
    } else {
      alert('Failed to update status: ' + error.message)
    }
    setLoadingId(null)
  }

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    setLoadingId(id)

    const { error } = await supabase.from('testimonials').delete().eq('id', id)

    if (!error) {
      setTestimonials(prev => prev.filter(t => t.id !== id))
      onStateChange()
    } else {
      alert('Failed to delete testimonial: ' + error.message)
    }
    setLoadingId(null)
  }

  if (testimonials.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
        No client submissions found yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((item) => (
        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="relative aspect-video bg-black">
            <video src={item.video_url} controls preload="metadata" className="w-full h-full object-cover" />
            <div className="absolute top-3 left-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                item.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                item.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {item.status}
              </span>
            </div>
          </div>

          <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-white font-bold text-sm tracking-tight">{item.client_name}</h3>
              <p className="text-xs text-slate-400 font-mono truncate">{item.client_email}</p>
              {item.campaigns?.title && (
                <p className="text-[11px] text-indigo-400 font-medium pt-1">Campaign: {item.campaigns.title}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-3 border-ts border-slate-800">
              {item.status !== 'approved' && (
                <button
                  disabled={loadingId === item.id}
                  onClick={() => updateStatus(item.id, 'approved')}
                  className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {loadingId === item.id ? 'Updating...' : 'Approve'}
                </button>
              )}
              {item.status !== 'rejected' && (
                <button
                  disabled={loadingId === item.id}
                  onClick={() => updateStatus(item.id, 'rejected')}
                  className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {loadingId === item.id ? 'Updating...' : 'Reject'}
                </button>
              )}
              <button
                disabled={loadingId === item.id}
                onClick={() => deleteTestimonial(item.id)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs transition-colors disabled:opacity-50"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}