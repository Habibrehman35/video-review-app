import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import CampaignCreator from '../components/CampaignCreator'
import CopyLinkButton from '../components/CopyLinkButton'
import DashboardClientFeed from '@/app/components/DashboardClientFeed'

export const dynamic = 'force-dynamic'

interface Campaign {
  id: string
  title: string
  prompt_question: string
  slug: string
  expires_at?: string | null
  created_at: string
}

interface Testimonial {
  id: string
  campaign_id: string
  client_name: string
  client_email: string
  video_url: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  campaigns?: {
    title: string
  }
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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch campaigns safely
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const campaignList: Campaign[] = campaigns || []
  const campaignIds = campaignList.map((c) => c.id)

  // Fetch testimonials safely with try/catch and fallback select to prevent 500 errors
  let testimonials: Testimonial[] = []
  if (campaignIds.length > 0) {
    try {
      const { data: tData, error: tError } = await supabase
        .from('testimonials')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('created_at', { ascending: false })

      if (!tError && tData) {
        testimonials = tData as Testimonial[]
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err)
    }
  }

  const totalCampaigns = campaignList.length
  const totalTestimonials = testimonials.length
  const approvedCount = testimonials.filter(t => t.status === 'approved').length
  const pendingCount = testimonials.filter(t => t.status === 'pending').length
  const approvalRate = totalTestimonials > 0 ? Math.round((approvedCount / totalTestimonials) * 100) : 0

  const hostUrl = process.env.NEXT_PUBLIC_SITE_URL 
    || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return 'Never'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-black text-white shadow-lg shadow-indigo-500/25 text-lg tracking-wider">
              VT
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">VideoTestimonial</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full tracking-wider">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Secure Workspace</p>
            </div>
          </div>

          <div className="flex items-center space-x-5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{user.email}</p>
              <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] text-emerald-400 font-mono font-medium">System Online</span>
              </div>
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
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all shadow-sm hover:shadow"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-10 space-y-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900/90 p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-1.5 relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Command Center</h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Monitor review pipelines, manage secure video assets, and orchestrate customer feedback funnels with enterprise tooling.
            </p>
          </div>
          <div className="relative z-10">
            <CampaignCreator />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-md space-y-3 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Campaigns</p>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-black text-white">{totalCampaigns}</span>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg font-medium border border-indigo-500/10">Active</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-md space-y-3 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reviews</p>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-black text-white">{totalTestimonials}</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg font-medium border border-emerald-500/10">Collected</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-md space-y-3 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Published Rate</p>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-black text-emerald-400">{approvalRate}%</span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg font-medium border border-emerald-500/10">{approvedCount} Live</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl backdrop-blur-md space-y-3 shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Queue</p>
            <div className="flex items-baseline justify-between">
              <span className="text-4xl font-black text-amber-400">{pendingCount}</span>
              <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg font-medium border border-amber-500/10">Review Req.</span>
            </div>
          </div>
        </div>

        {/* Active Campaigns Section */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-3">
              <span>Active Review Campaigns</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold border border-slate-700">{campaignList.length}</span>
            </h2>
          </div>

          {campaignList.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800/80 p-10 rounded-2xl text-center text-slate-400 text-sm">
              No active campaigns found. Create your first campaign above to generate a high-converting client review link.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaignList.map((camp) => {
                const reviewUrl = `${hostUrl}/review/${camp.slug}`
                let isExpired = false
                try {
                  isExpired = camp.expires_at ? new Date(camp.expires_at).getTime() < Date.now() : false
                } catch {
                  isExpired = false
                }

                return (
                  <div 
                    key={camp.id} 
                    className={`relative bg-slate-900/90 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-5 shadow-xl transition-all group ${
                      isExpired ? 'opacity-80' : ''
                    }`}
                  >
                    {isExpired && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10 pointer-events-none">
                        <span className="px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-bold tracking-widest uppercase shadow-lg">
                          Expired Campaign
                        </span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors truncate">{camp.title}</h3>
                        
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
                          await supabaseServer.from('testimonials').delete().eq('campaign_id', camp.id)
                          await supabaseServer.from('campaigns').delete().eq('id', camp.id)
                          revalidatePath('/dashboard')
                        }}>
                          <button
                            type="submit"
                            title="Delete Campaign"
                            onClick={(e) => {
                              if (!confirm('Are you sure you want to delete this campaign and its submissions?')) {
                                e.preventDefault()
                              }
                            }}
                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-xs"
                          >
                            🗑️
                          </button>
                        </form>
                      </div>

                      <p className="text-xs text-slate-200 font-normal italic line-clamp-2 leading-relaxed">&ldquo;{camp.prompt_question}&rdquo;</p>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <span className="block text-[9px] text-slate-500 uppercase">Created</span>
                          <span className="text-slate-300">{formatDate(camp.created_at)}</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                          <span className="block text-[9px] text-slate-500 uppercase">Expires</span>
                          <span className={isExpired ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                            {camp.expires_at ? formatDate(camp.expires_at) : 'No Expiry'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs gap-2">
                      <span className="text-slate-300 font-mono truncate max-w-[190px] bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 select-all">
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

        {/* Client Submissions Feed */}
        <div className="space-y-5 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-3">
              <span>Client Submissions Feed</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold border border-slate-700">{testimonials.length}</span>
            </h2>
          </div>
          <DashboardClientFeed 
            initialTestimonials={testimonials} 
            onStateChange={() => {
              revalidatePath('/dashboard')
            }} 
          />
        </div>

      </main>
    </div>
  )
}