'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Campaign {
  id: string
  title: string
  prompt_question: string
  slug: string
}

type Step = 'details' | 'camera' | 'recording' | 'preview' | 'uploading' | 'success'

export default function VideoReviewClient({ campaign }: { campaign: Campaign }) {
  const [step, setStep] = useState<Step>('details')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  
  const [timeLeft, setTimeLeft] = useState(30)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const supabase = createClient()

  // Handle step 1 submission
  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !clientEmail.trim()) {
      setErrorMessage('Please fill in both fields.')
      return
    }
    setErrorMessage('')
    setStep('camera')
  }

  // Enterprise Camera Initialization with Secure Context Fallbacks
  useEffect(() => {
    let activeStream: MediaStream | null = null

    if (step === 'camera' || step === 'recording') {
      const initCamera = async () => {
        try {
          setErrorMessage('')

          // Browser Support & Secure Context Check (handles HTTP local IPs gracefully)
          if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
            throw new Error(
              window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
                ? 'Camera access requires HTTPS or localhost. Please access via localhost.'
                : 'Your browser does not support camera recording or permissions are blocked.'
            )
          }

          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true,
          })

          activeStream = stream
          setMediaStream(stream)

          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream
          }
        } catch (err: unknown) {
          const errorObj = err as Error
          console.error('Camera initialization failed:', errorObj)
          setErrorMessage(errorObj.message || 'Camera and microphone access is required. Please check your permissions.')
        }
      }

      initCamera()
    }

    return () => {
      // Cleanup streams safely on unmount or navigation
      if (activeStream && step !== 'recording') {
        activeStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [step])

  // Ensure video element receives stream whenever it renders
  useEffect(() => {
    if (videoPreviewRef.current && mediaStream) {
      videoPreviewRef.current.srcObject = mediaStream
    }
  }, [mediaStream, step])

  // Start Recording
  const startRecording = () => {
    if (!mediaStream) {
      setErrorMessage('Camera stream not ready. Please try again.')
      return
    }
    
    const chunks: Blob[] = []

    let mimeType = 'video/webm'
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
      mimeType = 'video/webm;codecs=vp8,opus'
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4'
    }

    try {
      const recorder = new MediaRecorder(mediaStream, { mimeType })
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        setVideoBlob(blob)
        setVideoUrl(URL.createObjectURL(blob))
        setStep('preview')
      }

      recorder.start(1000)
      setMediaRecorder(recorder)
      setStep('recording')
      setTimeLeft(30)

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: unknown) {
      const errorObj = err as Error
      console.error('Recorder error:', errorObj)
      setErrorMessage('Could not start media recorder: ' + errorObj.message)
    }
  }

  // Stop Recording
  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }
  }

  // Upload to Supabase Storage & Save Row
  const handleUpload = async () => {
    if (!videoBlob) return
    setStep('uploading')
    setErrorMessage('')

    try {
      const fileName = `${campaign.id}/${Date.now()}-${clientName.replace(/\s+/g, '_')}.webm`
      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(fileName, videoBlob, {
          contentType: 'video/webm',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('testimonials')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase.from('testimonials').insert({
        campaign_id: campaign.id,
        client_name: clientName,
        client_email: clientEmail,
        video_url: publicUrlData.publicUrl,
        status: 'pending',
      })

      if (dbError) throw dbError

      setStep('success')
    } catch (err: unknown) {
      const errorObj = err as Error
      console.error('Upload failed:', errorObj)
      setErrorMessage(errorObj.message || 'Failed to upload video. Please try again.')
      setStep('preview')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 sm:p-8">
        
        {/* Campaign Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
            &ldquo;{campaign.prompt_question}&rdquo;
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Step 1: Details Form */}
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Muhammad Shariq"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Email</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="shariq@example.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Continue to Record
            </button>
          </form>
        )}

        {/* Step 2: Camera Permissions & Preview */}
        {step === 'camera' && (
          <div className="space-y-4 text-center">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            </div>
            <button
              onClick={startRecording}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
              <span>Start Recording</span>
            </button>
          </div>
        )}

        {/* Step 3: Recording with Countdown */}
        {step === 'recording' && (
          <div className="space-y-4 text-center">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-mono flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                <span>0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
              </div>
            </div>
            <button
              onClick={stopRecording}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Stop Recording
            </button>
          </div>
        )}

        {/* Step 4: Preview Recorded Video */}
        {step === 'preview' && (
          <div className="space-y-4 text-center">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-inner">
              {videoUrl && (
                <video src={videoUrl} controls playsInline className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('camera')}
                className="w-1/2 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors"
              >
                Re-record
              </button>
              <button
                onClick={handleUpload}
                className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Submit Review
              </button>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {step === 'uploading' && (
          <div className="py-12 text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 font-medium">Uploading your testimonial securely...</p>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-900">Thank you for your review!</h2>
            <p className="text-slate-600 text-sm max-w-sm mx-auto">
              Your video has been successfully submitted. We deeply appreciate your feedback.
            </p>
          </div>
        )}

      </div>
    </main>
  )
}