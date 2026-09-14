'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Testimonial {
  id: string
  campaign_id: string
  client_name: string
  client_email: string
  video_url: string
  status: 'pending' | 'approved'
  created_at: string
}

export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [status, setStatus] = useState(testimonial.status)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const toggleStatus = async () => {
    setLoading(true)
    const newStatus = status === 'approved' ? 'pending' : 'approved'

    const { error } = await supabase
      .from('testimonials')
      .update({ status: newStatus })
      .eq('id', testimonial.id)

    if (!error) {
      setStatus(newStatus)
    } else {
      console.error('Failed to update status:', error)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="aspect-video bg-black">
        <video src={testimonial.video_url} controls className="w-full h-full object-cover" />
      </div>
      
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">{testimonial.client_name}</h3>
          <p className="text-xs text-slate-500">{testimonial.client_email}</p>
          <span className="inline-block mt-2 text-[10px] text-slate-400 font-mono">
            {new Date(testimonial.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            status === 'approved' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
              : 'bg-amber-50 text-amber-700 border border-amber-100'
          }`}>
            {status.toUpperCase()}
          </span>

          <button
            onClick={toggleStatus}
            disabled={loading}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : status === 'approved' ? 'Unapprove' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}