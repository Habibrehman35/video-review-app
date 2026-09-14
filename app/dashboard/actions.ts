'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Enterprise Dynamic Base URL Resolver (Supports Local, Staging, and Production Vercel/Custom Domains)
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `https://${process.env.NEXT_PUBLIC_SITE_URL.replace(/^https?:\/\//, '')}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}

export async function createCampaign(formData: FormData) {
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

  // 1. Strict Enterprise Session Verification
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('Enterprise Security Error: Unauthorized request. Active session required.')
  }

  const title = (formData.get('title') as string)?.trim()
  const prompt_question = (formData.get('prompt_question') as string)?.trim()
  const expiresAtInput = (formData.get('expires_at') as string)?.trim()
  
  if (!title || !prompt_question) {
    throw new Error('Validation Error: Title and prompt question are required.')
  }

  // Parse expiry date properly if provided
  const expires_at = expiresAtInput ? new Date(expiresAtInput).toISOString() : null

  // 2. Enterprise Robust Slug Generation (Collision-resistant & sanitized)
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  const slug = `${baseSlug || 'campaign'}-${randomSuffix}`

  // 3. Secure Insertion with Record Retrieval
  const { data: newCampaign, error: insertError } = await supabase
    .from('campaigns')
    .insert({
      title,
      prompt_question,
      slug,
      user_id: user.id, // Injected securely from verified session context
      expires_at
    })
    .select()
    .single()

  if (insertError) {
    console.error('Database Insertion Failed:', insertError.message)
    throw new Error(`Failed to create campaign: ${insertError.message}`)
  }

  revalidatePath('/dashboard')

  // 4. Return Structured Enterprise Payload with Absolute Production-Ready Review URL
  const baseUrl = getBaseUrl()
  return {
    success: true,
    campaign: {
      ...newCampaign,
      review_url: `${baseUrl}/review/${newCampaign.slug}`
    }
  }
}