'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Camera, QrCode, Upload, CheckCircle, AlertTriangle, Loader2, X, RotateCcw, ImagePlus } from 'lucide-react'

const MAX_SLOTS = 4

function MobileCaptureContent() {
  const searchParams = useSearchParams()
  const session     = searchParams.get('session') ?? ''
  const mode        = (searchParams.get('mode') ?? 'photo') as 'photo' | 'barcode'
  const startSlot   = parseInt(searchParams.get('slot') ?? '0', 10)

  const [currentSlot, setCurrentSlot]   = useState(startSlot)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [status, setStatus]   = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [previews, setPreviews] = useState<string[]>([])   // thumbnails of sent photos
  const [errorMsg, setErrorMsg] = useState('')
  const [barcodeValue, setBarcodeValue] = useState('')
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [useCamera, setUseCamera] = useState(false)
  const [stream, setStream]     = useState<MediaStream | null>(null)

  // Attach stream to video element after it renders
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream, useCamera])

  // Cleanup stream on unmount
  useEffect(() => () => { stream?.getTracks().forEach(t => t.stop()) }, [stream])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
      })
      setUseCamera(true)
      setStream(s)
    } catch {
      // Camera not available — nothing to do
    }
  }

  const captureFromVideo = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width  = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      uploadFile(new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setUseCamera(false)
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop())
    setStream(null)
    setUseCamera(false)
  }

  const handleGalleryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    // Upload them sequentially, filling slots from currentSlot onwards
    uploadMultiple(files)
    e.target.value = ''
  }

  const uploadMultiple = async (files: File[]) => {
    if (!session) { setErrorMsg('Invalid session.'); setStatus('error'); return }
    setStatus('uploading')
    const newPreviews: string[] = []
    let slot = currentSlot
    for (const file of files) {
      if (slot >= MAX_SLOTS) break
      // Generate local preview
      const dataUrl = await new Promise<string>(res => {
        const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(file)
      })
      newPreviews.push(dataUrl)
      // Upload
      const fd = new FormData()
      fd.append('session', session)
      fd.append('slot', String(slot))
      fd.append('file', file)
      const resp = await fetch('/api/mobile-capture/upload', { method: 'POST', body: fd })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Upload failed' }))
        setErrorMsg(err.error ?? 'Upload failed')
        setStatus('error')
        return
      }
      slot++
    }
    setPreviews(p => [...p, ...newPreviews])
    setUploadedCount(c => c + newPreviews.length)
    setCurrentSlot(slot)
    setStatus('done')
  }

  const uploadFile = async (file: File) => {
    if (!session) { setErrorMsg('Invalid session.'); setStatus('error'); return }
    setStatus('uploading')
    const dataUrl = await new Promise<string>(res => {
      const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(file)
    })
    const fd = new FormData()
    fd.append('session', session)
    fd.append('slot', String(currentSlot))
    fd.append('file', file)
    const resp = await fetch('/api/mobile-capture/upload', { method: 'POST', body: fd })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Upload failed' }))
      setErrorMsg(err.error ?? 'Upload failed')
      setStatus('error')
      return
    }
    setPreviews(p => [...p, dataUrl])
    setUploadedCount(c => c + 1)
    setCurrentSlot(s => s + 1)
    setStatus('done')
  }

  const addAnother = () => {
    setStatus('idle')
    setUseCamera(false)
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

  const slotsLeft = MAX_SLOTS - currentSlot

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#ff7e15] px-4 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-white p-1 shrink-0">
          <Image src="/ibon-icon.png" alt="IBON" width={32} height={32} className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">IBON Admin</p>
          <p className="text-white/70 text-xs">
            {mode === 'barcode' ? 'Barcode / Serial scan' : `Photo capture — ${uploadedCount} of ${MAX_SLOTS} uploaded`}
          </p>
        </div>
      </div>

      <div className="flex-1 p-5 space-y-5">

        {/* Uploading */}
        {status === 'uploading' && (
          <div className="flex flex-col items-center text-center py-12 space-y-3">
            <Loader2 className="w-12 h-12 text-[#ff7e15] animate-spin" />
            <p className="text-sm text-gray-500">Sending to desktop…</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="flex flex-col items-center text-center py-8 space-y-3">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <button
              onClick={() => { setStatus('idle'); setErrorMsg('') }}
              className="mt-2 px-5 py-2 bg-[#ff7e15] text-white rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Done */}
        {status === 'done' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mt-8" />
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'barcode' ? 'Barcode sent!' : `${uploadedCount} photo${uploadedCount > 1 ? 's' : ''} uploaded!`}
            </h2>
            {/* Thumbnails */}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {previews.map((p, i) => (
                  <img key={i} src={p} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded-xl shadow" />
                ))}
              </div>
            )}
            <p className="text-sm text-gray-500">The desktop has been updated.</p>
            {/* Add another if slots remain */}
            {mode === 'photo' && slotsLeft > 0 && (
              <button
                onClick={addAnother}
                className="w-full py-4 rounded-xl bg-[#ff7e15] text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <ImagePlus className="w-5 h-5" />
                Add Another Photo ({slotsLeft} slot{slotsLeft > 1 ? 's' : ''} left)
              </button>
            )}
            {(mode === 'barcode' || slotsLeft === 0) && (
              <p className="text-xs text-gray-400">You can close this page.</p>
            )}
          </div>
        )}

        {/* Barcode mode — idle */}
        {status === 'idle' && mode === 'barcode' && (
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#ff7e15]" />
              Scan or type barcode / serial
            </h2>
            <label className="w-full py-4 rounded-xl bg-[#fff4ec] border-2 border-[#ffc999] text-[#ff7e15] font-medium flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
              <QrCode className="w-5 h-5" />
              Open Camera to Scan
              <input type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }} />
            </label>
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
        )}

        {/* Photo mode — idle, not in camera */}
        {status === 'idle' && mode === 'photo' && !useCamera && (
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#ff7e15]" />
              {uploadedCount === 0 ? `Capture Photos (up to ${MAX_SLOTS})` : `Add More Photos (${slotsLeft} left)`}
            </h2>
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
            {/* Use label so it works reliably on all mobile browsers */}
            <label className="w-full py-4 rounded-xl bg-[#fff4ec] border-2 border-[#ffc999] text-[#ff7e15] font-medium flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer">
              <Upload className="w-5 h-5" />
              Choose from Gallery
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleGalleryFiles}
              />
            </label>
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
                style={{ maxHeight: '65vh', objectFit: 'cover' }}
              />
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
                    navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'user' } } })
                      .then(s => { setUseCamera(true); setStream(s) })
                      .catch(() => {})
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500">Tap the shutter to capture • {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} remaining</p>
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

