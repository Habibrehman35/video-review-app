import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-800 bg-gray-950 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-900/50 lg:p-4">
          Video Testimonial SaaS
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-black via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
          >
            Sign In / Dashboard &rarr;
          </Link>
        </div>
      </div>

      <div className="relative flex flex-col items-center justify-center text-center my-auto py-12">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
          Collect Video Testimonials with Ease
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 mb-8">
          Empower your customers to share their feedback via video. Boost trust, increase conversions, and showcase social proof effortlessly.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-500 transition shadow-lg shadow-blue-500/30"
          >
            Get Started
          </Link>
        </div>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-3 lg:text-left gap-8">
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-2xl font-semibold mb-2">1. Create Space</h2>
          <p className="text-gray-400 text-sm">Set up your dedicated page to collect video reviews from your happy clients in minutes.</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-2xl font-semibold mb-2">2. Collect Videos</h2>
          <p className="text-gray-400 text-sm">Share a simple link with your customers. No downloads or complex setup required for them.</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
          <h2 className="text-2xl font-semibold mb-2">3. Embed & Grow</h2>
          <p className="text-gray-400 text-sm">Display testimonials beautifully on your website to supercharge your brand credibility.</p>
        </div>
      </div>
    </main>
  )
}