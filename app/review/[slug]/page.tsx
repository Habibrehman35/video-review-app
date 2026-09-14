import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import VideoReviewClient from './VideoReviewClient'

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

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, title, prompt_question, slug')
    .eq('slug', slug)
    .single<Campaign>()

  if (error || !campaign) {
    notFound()
  }

  return <VideoReviewClient campaign={campaign} />
}