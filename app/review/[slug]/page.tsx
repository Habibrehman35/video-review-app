import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import VideoReviewClient from './VideoReviewClient'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

interface Campaign {
  id: string
  title: string
  prompt_question: string
  slug: string
  expires_at?: string | null
}

export default async function ReviewPage({ params }: PageProps) {
  const resolvedParams = await params
  const slug = resolvedParams.slug

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  // Fetch campaign including expires_at
  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, title, prompt_question, slug, expires_at')
    .eq('slug', slug)
    .single<Campaign>()

  // 1. Agar campaign database mein nahi milti (Not Found UI)
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            🔍
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">Campaign Not Found</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              The review link <code className="text-indigo-400 font-mono">/review/{slug}</code> does not exist in our database or has been removed.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            Please make sure you created this campaign in your dashboard.
          </div>
        </div>
      </div>
    )
  }

  // 2. Agar campaign expire ho chuki hai (Expired UI)
  if (campaign.expires_at) {
    const isExpired = new Date(campaign.expires_at) < new Date()
    if (isExpired) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
              ⏳
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-white tracking-tight">Campaign Expired</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                This review collection link for <strong className="text-slate-200">{campaign.title}</strong> has expired and is no longer accepting video submissions.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              Thank you for your interest. Please contact the organizer for a new link.
            </div>
          </div>
        </div>
      )
    }
  }

  // 3. Sab theek hai toh video review component render karein
  return <VideoReviewClient campaign={campaign} />
}