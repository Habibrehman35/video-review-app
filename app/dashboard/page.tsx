import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CampaignCreator from '../components/CampaignCreator'
import TestimonialCard from '../components/TestimonialCard'
import CopyLinkButton from '../components/CopyLinkButton'

interface Campaign {
  id: string
  title: string
  prompt_question: string
  slug: string
  created_at: string
}

interface Testimonial {
  id: string
  campaign_id: string
  client_name: string
  client_email: string
  video_url: string
  status: 'pending' | 'approved'
  created_at: string
}

export default async function DashboardPage() {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const campaignList: Campaign[] = campaigns || []
  const campaignIds = campaignList.map((c) => c.id)

  // Fetch testimonials
  let testimonials: Testimonial[] = []
  if (campaignIds.length > 0) {
    const { data: tData } = await supabase
      .from('testimonials')
      .select('*')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false })
    testimonials = tData || []
  }

  // Metrics calculations
  const totalCampaigns = campaignList.length
  const totalTestimonials = testimonials.length
  const approvedCount = testimonials.filter(t => t.status === 'approved').length
  const pendingCount = testimonials.filter(t => t.status === 'pending').length

  const hostUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      
      {/* Enterprise Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              VT
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white">VideoTestimonial</span>
              <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                ENTERPRISE
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-slate-300">{user.email}</p>
              <p className="text-[10px] text-emerald-400 font-mono">● System Online</p>
            </div>
            <form action={async () => {
              'use server'
              const cookieStore = await cookies()
              const supabaseServer = createServerClient(
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
              await supabaseServer.auth.signOut()
              redirect('/login')
            }}>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-8">
        
        {/* Welcome Banner & Action */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Command Center</h1>
            <p className="text-sm text-slate-400 mt-1">Monitor review funnels, manage video assets, and orchestrate campaigns.</p>
          </div>
          <CampaignCreator />
        </div>

        {/* Analytics Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-sm space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Campaigns</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{totalCampaigns}</span>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Active</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-sm space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Reviews</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{totalTestimonials}</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Collected</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-sm space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Approved Reviews</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-400">{approvedCount}</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Published</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-sm space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Review</p>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-400">{pendingCount}</span>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Queue</span>
            </div>
          </div>
        </div>

        {/* Active Campaigns Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Active Review Campaigns</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">{campaignList.length}</span>
            </h2>
          </div>

          {campaignList.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 p-8 rounded-2xl text-center text-slate-400 text-sm">
              No active campaigns found. Create your first campaign above to generate a client review link.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaignList.map((camp) => {
                const reviewUrl = `${hostUrl}/review/${camp.slug}`
                return (
                  <div key={camp.id} className="bg-slate-800/70 border border-slate-700/80 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-md hover:border-slate-600 transition-all">
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-white text-base truncate">{camp.title}</h3>
                      <p className="text-xs text-slate-400 italic line-clamp-2">&ldquo;{camp.prompt_question}&rdquo;</p>
                    </div>
                    <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono truncate max-w-[170px] bg-slate-900/60 px-2 py-1 rounded border border-slate-800">
                        {reviewUrl}
                      </span>
                      <CopyLinkButton url={reviewUrl} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Testimonials Management Grid */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Client Submissions Feed</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">{testimonials.length}</span>
            </h2>
          </div>

          {testimonials.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 p-12 rounded-2xl text-center text-slate-400 text-sm space-y-2">
              <p className="font-medium text-slate-300">No video submissions received yet.</p>
              <p className="text-xs text-slate-500">Share your campaign links with clients to begin collecting video testimonials.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl overflow-hidden shadow-lg">
                  <TestimonialCard testimonial={t} />
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}