'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaign } from '@/app/dashboard/actions'

const TEMPLATE_PRESETS = [
  {
    title: 'Website & UI Feedback',
    prompt: 'How did our web redesign impact your user engagement and online presence?'
  },
  {
    title: 'Product Success Story',
    prompt: 'What measurable results or ROI have you achieved since using our platform?'
  },
  {
    title: 'Client Partnership Review',
    prompt: 'How would you describe your overall experience working alongside our delivery team?'
  }
]

export default function CampaignCreator() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')

  const handlePresetSelect = (presetTitle: string, presetPrompt: string) => {
    setTitle(presetTitle)
    setPrompt(presetPrompt)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formElement = e.currentTarget
    const formData = new FormData(formElement)

    startTransition(async () => {
      try {
        await createCampaign(formData)
        
        // Modal close aur form reset karein
        setIsOpen(false)
        setTitle('')
        setPrompt('')
        formElement.reset()

        // 🔑 ASAL FIX: Next.js router cache refresh karein taake dashboard par foran campaign show ho jaye
        router.refresh()
      } catch (err: unknown) {
        const errorObj = err as Error
        setError(errorObj.message || 'Failed to create campaign')
      }
    })
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 text-sm flex items-center space-x-2 border border-indigo-400/20"
      >
        <span>+ Create Campaign</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-7 space-y-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Create Review Campaign</h2>
                <p className="text-xs text-slate-400 mt-0.5">Deploy a high-converting feedback funnel for your clients.</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick Templates</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TEMPLATE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(preset.title, preset.prompt)}
                    className="p-2.5 text-left bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 truncate">{preset.title}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{preset.prompt}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Campaign Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Website Feedback"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm placeholder:text-slate-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Prompt Question for Clients</label>
                <textarea
                  name="prompt_question"
                  required
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. How did our solution improve your operational efficiency?"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm placeholder:text-slate-600 resize-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Expiration Date & Time (Optional)</label>
                <input
                  type="datetime-local"
                  name="expires_at"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm transition-all color-scheme-dark"
                />
                <p className="text-[10px] text-slate-500 mt-1">After this time, the review submission link will automatically close.</p>
              </div>

              <div className="flex space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-xs border border-slate-700/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all text-xs disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                >
                  {isPending ? 'Deploying...' : 'Save & Generate Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}