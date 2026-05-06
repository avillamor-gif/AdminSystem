'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Camera, QrCode, Upload, CheckCircle, AlertTriangle, Loader2, X, RotateCcw } from 'lucide-react'

// ── How it works ──────────────────────────────────────────────────────────────
// 1. Desktop opens /mobile-capture?session=<token>&mode=photo|barcode
// 2. Token is stored in a Supabase Realtime channel keyed by session
// 3. Phone opens page, captures photo / scans barcode
// 4. Phone POSTs to /api/mobile-capture with {session, file} or {session, barcode}
// 5. Desktop receives the result via Realtime subscription and updates the form
// ─────────────────────────────────────────────────────────────────────────────

function MobileCaptureContent() {
  const searchParams = useSearchParams()
  const session  = searchParams.get('session') ?? ''
  const mode     = (searchParams.get('mode') ?? 'photo') as 'photo' | 'barcode'
  const slot     = parseInt(searchParams.get('slot') ?? '0', 10)  // which image slot (0-3)

  const [status, setStatus] = useState<'idle' | 'capturing' | 'uploading' | 'done' | 'error'>('idle')
  const [preview, setPreview] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState('')
  const [barcodeValue, setBarcodeValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [useCamera, setUseCamera] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // Attach stream to video element once it is rendered
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream, useCamera])

  // Start live camera stream
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
      })
      setUseCamera(true)   // render <video> first
      setStream(s)          // then the effect attaches the stream
    } catch {
      // Fall back to file input
      fileInputRef.current?.click()
    }
  }

  // Capture frame from video
  const captureFromVideo = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width  = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
      handleFile(file)
    }, 'image/jpeg', 0.92)
    // Stop stream
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setUseCamera(false)
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setUseCamera(false)
  }

  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()) }, [stream])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    if (!session) { setErrorMsg('Invalid session — please scan the QR code again.'); setStatus('error'); return }
    setStatus('uploading')
    try {
      const formData = new FormData()
      formData.append('session', session)
      formData.append('slot', String(slot))
      formData.append('file', file)
      const res = await fetch('/api/mobile-capture/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed')
      setStatus('done')
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Upload failed')
      setStatus('error')
    }
  }

  const sendBarcode = async () => {
    if (!session || !barcodeValue.trim()) return
    setStatus('uploading')
    try {
      const res = await fetch('/api/mobile-capture/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, barcode: barcodeValue.trim() })
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
      setStatus('done')
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Failed to send barcode')
      setStatus('error')
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-lg font-semibold text-gray-900">Invalid Link</h1>
          <p className="text-sm text-gray-500 mt-1">Scan the QR code on your desktop to get a valid link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#ff7e15] px-4 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-white p-1 shrink-0">
          <Image src="/ibon-icon.png" alt="IBON" width={32} height={32} className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">IBON Admin</p>
          <p className="text-white/70 text-xs">{mode === 'barcode' ? 'Barcode / Serial scan' : `Photo capture — slot ${slot + 1}`}</p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">

        {/* Done */}
        {status === 'done' && (
          <div className="flex flex-col items-center text-center py-12 space-y-3">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'barcode' ? 'Barcode sent!' : 'Photo uploaded!'}
            </h2>
            <p className="text-sm text-gray-500">You can close this page. The desktop has been updated.</p>
            {mode === 'photo' && preview && (
              <img src={preview} alt="Captured" className="w-48 h-36 object-cover rounded-xl mt-2 shadow" />
            )}
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center text-center py-8 space-y-3">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <button
              onClick={() => { setStatus('idle'); setPreview(''); setErrorMsg('') }}
              className="mt-2 px-5 py-2 bg-[#ff7e15] text-white rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Uploading */}
        {status === 'uploading' && (
          <div className="flex flex-col items-center text-center py-12 space-y-3">
            <Loader2 className="w-12 h-12 text-[#ff7e15] animate-spin" />
            <p className="text-sm text-gray-500">Sending to desktop…</p>
            {preview && (
              <img src={preview} alt="Preview" className="w-48 h-36 object-cover rounded-xl shadow opacity-60" />
            )}
          </div>
        )}

        {/* Barcode mode */}
        {status === 'idle' && mode === 'barcode' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#ff7e15]" />
                Scan or type barcode / serial
              </h2>
              {/* Native barcode scan via file capture on mobile */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl bg-[#fff4ec] border-2 border-[#ffc999] text-[#ff7e15] font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <QrCode className="w-5 h-5" />
                Open Camera to Scan
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  // We can't decode barcodes in-browser without a library, so just upload the scan image
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
              <div className="relative flex items-center gap-2">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400">or type manually</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff7e15]"
                placeholder="Serial number / barcode value…"
                value={barcodeValue}
                onChange={(e) => setBarcodeValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendBarcode()}
              />
              <button
                onClick={sendBarcode}
                disabled={!barcodeValue.trim()}
                className="w-full py-3 bg-[#ff7e15] text-white rounded-xl font-semibold disabled:opacity-50 active:scale-95 transition-all"
              >
                Send to Desktop
              </button>
            </div>
          </div>
        )}

        {/* Photo mode — idle */}
        {status === 'idle' && mode === 'photo' && !useCamera && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#ff7e15]" />
                Capture Photo — Image {slot + 1}
              </h2>
              {/* Live camera */}
              <button
                onClick={startCamera}
                className="w-full py-5 rounded-xl bg-[#ff7e15] text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Camera className="w-6 h-6" />
                Open Camera
              </button>
              <div className="relative flex items-center gap-2">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400">or choose from gallery</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-xl bg-[#fff4ec] border-2 border-[#ffc999] text-[#ff7e15] font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Upload className="w-5 h-5" />
                Choose from Gallery
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
            </div>
          </div>
        )}

        {/* Photo mode — live camera */}
        {status === 'idle' && mode === 'photo' && useCamera && (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden shadow bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full"
                style={{ maxHeight: '60vh', objectFit: 'cover' }}
              />
              {/* Overlay controls */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-6">
                <button
                  onClick={stopCamera}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={captureFromVideo}
                  className="w-16 h-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-white" />
                </button>
                <button
                  onClick={() => {
                    stopCamera()
                    navigator.mediaDevices.getUserMedia({
                      video: { facingMode: { exact: 'user' } }
                    }).then(s => {
                      setUseCamera(true)
                      setStream(s)
                    }).catch(() => {})
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500">Tap the shutter button to capture</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MobileCapturePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#ff7e15] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    }>
      <MobileCaptureContent />
    </Suspense>
  )
}
