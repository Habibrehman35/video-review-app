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
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(60) // 60s for professional reviews
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('')

  const mediaStreamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const videoBlobRef = useRef<Blob | null>(null)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
  const supabase = createClient()

  // Enumerate available media devices
  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setAudioDevices(devices.filter(d => d.kind === 'audioinput'))
        setVideoDevices(devices.filter(d => d.kind === 'videoinput'))
      } catch (err) {
        console.error('Error fetching devices:', err)
      }
    }
    getDevices()
  }, [])

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim() || !clientEmail.trim()) {
      setErrorMessage('Please fill in both name and email fields.')
      return
    }
    setErrorMessage('')
    setStep('camera')
  }

  // Camera & Mic Initialization with selected devices
  useEffect(() => {
    if (step !== 'camera' && step !== 'recording') return

    const initCamera = async () => {
      try {
        setErrorMessage('')

        if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
          throw new Error('Your browser does not support camera recording or permissions are blocked.')
        }

        // Stop existing tracks if switching devices
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop())
        }

        const constraints: MediaStreamConstraints = {
          video: selectedVideoDevice 
            ? { deviceId: { exact: selectedVideoDevice }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: selectedAudioDevice 
            ? { deviceId: { exact: selectedAudioDevice } }
            : true,
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        mediaStreamRef.current = stream

        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream
        }
      } catch (err: unknown) {
        const errorObj = err as Error
        console.error('Camera initialization failed:', errorObj)
        setErrorMessage(errorObj.message || 'Camera and microphone access is required. Please verify permissions.')
      }
    }

    initCamera()

    return () => {}
  }, [step, selectedAudioDevice, selectedVideoDevice])

  useEffect(() => {
    if (videoPreviewRef.current && mediaStreamRef.current) {
      videoPreviewRef.current.srcObject = mediaStreamRef.current
    }
  }, [step])

  // Helper function to find supported mimeType across different browsers (fixes VP9 unsupported codec errors)
  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return ''
  }

  const startRecording = () => {
    const stream = mediaStreamRef.current
    if (!stream || !stream.active) {
      setErrorMessage('Camera stream not ready. Please try again.')
      setStep('camera')
      return
    }

    const chunks: Blob[] = []

    try {
      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : {}

      const recorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      recorder.onerror = (event: Event) => {
        console.error('MediaRecorder error event:', event)
        setErrorMessage('Recording error occurred. Please try again.')
        setStep('camera')
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' })
        if (blob.size < 100) {
          setErrorMessage('Recording failed or was empty. Please check your mic/cam.')
          setStep('camera')
          return
        }
        videoBlobRef.current = blob
        setVideoUrl(URL.createObjectURL(blob))
        setStep('preview')
      }

      recorder.start(250)
      setStep('recording')
      setTimeLeft(60)
      setErrorMessage('')

      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: unknown) {
      const errorObj = err as Error
      setErrorMessage('Could not initialize media recorder: ' + errorObj.message)
      setStep('camera')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const handleUpload = async () => {
    const blob = videoBlobRef.current
    if (!blob) return
    setStep('uploading')
    setErrorMessage('')

    try {
      const fileExt = blob.type.includes('mp4') ? 'mp4' : 'webm'
      const fileName = `${campaign.id}/${Date.now()}-${clientName.replace(/\s+/g, '_')}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(fileName, blob, {
          contentType: blob.type || 'video/webm',
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

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
        mediaStreamRef.current = null
      }

      setStep('success')
    } catch (err: unknown) {
      const errorObj = err as Error
      setErrorMessage(errorObj.message || 'Failed to upload video securely.')
      setStep('preview')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-10 space-y-8 backdrop-blur-xl">
        
        {/* Enterprise Header & Step Indicator */}
        <div className="space-y-4 text-center border-b border-slate-800 pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold tracking-wider uppercase">
            <span>Secure Video Review Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{campaign.title}</h1>
          <blockquote className="text-slate-300 text-sm sm:text-base bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 italic leading-relaxed">
            &ldquo;{campaign.prompt_question}&rdquo;
          </blockquote>
        </div>

        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center space-x-3">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Details Form */}
        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Your Full Name</label>
              <input
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm placeholder:text-slate-600 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Business / Professional Email</label>
              <input
                type="email"
                required
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="e.g. sarah@enterprise.com"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm placeholder:text-slate-600 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/25 text-sm"
            >
              Proceed to Camera Setup →
            </button>
          </form>
        )}

        {/* Step 2: Camera Permissions & Device Settings */}
        {step === 'camera' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-emerald-400 font-mono flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Camera Ready</span>
              </div>
            </div>

            {/* Device Switchers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Camera Source</label>
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Default Camera</option>
                  {videoDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Microphone Source</label>
                <select
                  value={selectedAudioDevice}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Default Microphone</option>
                  {audioDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 5)}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={startRecording}
              className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-red-600/25 text-sm flex items-center justify-center space-x-2.5"
            >
              <span className="w-3.5 h-3.5 bg-white rounded-full animate-pulse shadow-sm"></span>
              <span>Start Recording (60s Max)</span>
            </button>
          </div>
        )}

        {/* Step 3: Active Recording State */}
        {step === 'recording' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-red-500/40">
              <video ref={videoPreviewRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
              <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-mono flex items-center space-x-2 border border-red-500/30">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
                <span>0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
              </div>
            </div>
            <button
              onClick={stopRecording}
              className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl transition-all shadow-lg text-sm border border-slate-700"
            >
              Stop & Review Recording
            </button>
          </div>
        )}

        {/* Step 4: Preview Video */}
        {step === 'preview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
              {videoUrl && (
                <video src={videoUrl} controls playsInline className="w-full h-full object-cover" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  videoBlobRef.current = null
                  setVideoUrl(null)
                  setStep('camera')
                }}
                className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-xs border border-slate-700"
              >
                🔄 Re-record Video
              </button>
              <button
                onClick={handleUpload}
                className="py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all text-xs shadow-lg shadow-indigo-600/25"
              >
                ✓ Submit Secure Review
              </button>
            </div>
          </div>
        )}

        {/* Uploading State */}
        {step === 'uploading' && (
          <div className="py-16 text-center space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-300 font-medium text-sm">Encrypting & uploading your video securely...</p>
          </div>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="py-16 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto text-3xl font-bold shadow-xl shadow-emerald-500/5">
              ✓
            </div>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Review Submitted Successfully!</h2>
              <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                Thank you for your valuable feedback. Your review has been securely transmitted to the organizer.
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}