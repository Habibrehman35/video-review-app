export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `https://${process.env.NEXT_PUBLIC_SITE_URL}`
  }
  // Fallback for Vercel automatic deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return 'http://localhost:3000'
}