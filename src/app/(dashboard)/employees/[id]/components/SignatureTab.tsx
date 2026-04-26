'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { PenLine, Upload, Trash2, Download, RefreshCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { useEmployeeAttachments, useDeleteEmployeeAttachment } from '@/hooks/useEmployeeAttachments'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface SignatureTabProps {
  employee: { id: string; first_name?: string; last_name?: string; employee_id?: string }
  readOnly?: boolean
  uploadAttachment: {
    mutateAsync: (args: {
      employeeId: string
      file: File
      description?: string
      documentType?: string
      employeeName?: string
    }) => Promise<any>
    isPending: boolean
  }
}

type Mode = 'view' | 'draw' | 'upload'

export function SignatureTab({ employee, readOnly, uploadAttachment }: SignatureTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [mode, setMode] = useState<Mode>('view')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: attachments = [] } = useEmployeeAttachments(employee.id)
  const deleteAttachment = useDeleteEmployeeAttachment()

  // Find the current e-signature attachment
  const signatureAttachment = attachments.find(a => a.document_type === 'e-signature')
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!signatureAttachment?.file_path) {
      setSignatureUrl(null)
      return
    }
    const supabase = createClient()
    supabase.storage
      .from('attachments')
      .createSignedUrl(signatureAttachment.file_path, 3600)
      .then((res: { data: { signedUrl: string } | null; error: Error | null }) => {
        if (res.error) { console.error('Failed to get signed URL for signature:', res.error); return }
        setSignatureUrl(res.data?.signedUrl ?? null)
      })
  }, [signatureAttachment?.id, signatureAttachment?.file_path])

  // ── Canvas drawing ──────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDrawing(true)
  }, [])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    setHasDrawing(true)
  }, [drawing])

  const stopDrawing = useCallback(() => setDrawing(false), [])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
  }

  // ── Save drawn signature ─────────────────────────────────────────
  const saveDrawn = async () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawing) return
    setSaving(true)
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Canvas empty'))), 'image/png')
      )
      const fileName = `${employee.employee_id ?? employee.id}_esignature_${Date.now()}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // Delete old signature if exists
      if (signatureAttachment) {
        await deleteAttachment.mutateAsync({ id: signatureAttachment.id, filePath: signatureAttachment.file_path, employeeId: employee.id })
      }

      await uploadAttachment.mutateAsync({
        employeeId: employee.id,
        file,
        description: `${employee.first_name ?? ''} ${employee.last_name ?? ''} e-signature`,
        documentType: 'e-signature',
        employeeName: `${employee.first_name ?? ''} ${employee.last_name ?? ''}`,
      })

      toast.success('E-signature saved successfully')
      setMode('view')
      clearCanvas()
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save signature')
    } finally {
      setSaving(false)
    }
  }

  // ── Save uploaded image ──────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setSaving(true)
    try {
      if (signatureAttachment) {
        await deleteAttachment.mutateAsync({ id: signatureAttachment.id, filePath: signatureAttachment.file_path, employeeId: employee.id })
      }
      await uploadAttachment.mutateAsync({
        employeeId: employee.id,
        file,
        description: `${employee.first_name ?? ''} ${employee.last_name ?? ''} e-signature`,
        documentType: 'e-signature',
        employeeName: `${employee.first_name ?? ''} ${employee.last_name ?? ''}`,
      })
      toast.success('E-signature uploaded successfully')
      setMode('view')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to upload signature')
    } finally {
      setSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async () => {
    if (!signatureAttachment) return
    if (!confirm('Remove this e-signature?')) return
    await deleteAttachment.mutateAsync({ id: signatureAttachment.id, filePath: signatureAttachment.file_path, employeeId: employee.id })
    toast.success('E-signature removed')
  }

  const downloadSignature = () => {
    if (!signatureUrl) return
    const a = document.createElement('a')
    a.href = signatureUrl
    a.download = signatureAttachment?.file_name ?? 'signature.png'
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-orange/10 rounded-lg">
          <PenLine className="w-5 h-5 text-orange" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">E-Signature</h3>
          <p className="text-sm text-gray-500 mt-0.5">Employee's digital signature used on official documents</p>
        </div>
      </div>
      <div className="border-t border-gray-200" />

      {/* Current signature display */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700">Current Signature</h4>
          {!readOnly && (
            <div className="flex gap-2">
              {signatureUrl && (
                <>
                  <button
                    onClick={downloadSignature}
                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {signatureUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signatureUrl}
              alt="Employee e-signature"
              className="max-w-xs max-h-32 object-contain border border-gray-200 rounded bg-white p-3"
            />
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle className="w-3.5 h-3.5" />
              Signature on file — {signatureAttachment?.created_at
                ? new Date(signatureAttachment.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : ''}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <PenLine className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No signature on file</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button
              variant={mode === 'draw' ? 'primary' : 'secondary'}
              onClick={() => { setMode(mode === 'draw' ? 'view' : 'draw'); clearCanvas() }}
              className="flex items-center gap-2"
            >
              <PenLine className="w-4 h-4" />
              Draw Signature
            </Button>
            <Button
              variant={mode === 'upload' ? 'primary' : 'secondary'}
              onClick={() => setMode(mode === 'upload' ? 'view' : 'upload')}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Image
            </Button>
          </div>

          {/* Draw pad */}
          {mode === 'draw' && (
            <div className="border border-gray-200 rounded-xl bg-white p-4 space-y-3">
              <p className="text-xs text-gray-500">Draw your signature in the box below using your mouse or touchscreen.</p>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  className="w-full border border-dashed border-gray-300 rounded-lg bg-white cursor-crosshair touch-none"
                  style={{ maxHeight: 200 }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {/* baseline */}
                <div className="absolute bottom-10 left-8 right-8 border-b border-gray-200 pointer-events-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Clear
                </button>
                <Button
                  onClick={saveDrawn}
                  disabled={!hasDrawing || saving || uploadAttachment.isPending}
                >
                  {saving ? 'Saving...' : 'Save Signature'}
                </Button>
              </div>
            </div>
          )}

          {/* Upload option */}
          {mode === 'upload' && (
            <div className="border border-gray-200 rounded-xl bg-white p-6 space-y-3">
              <p className="text-xs text-gray-500">Upload a PNG or JPG image of the signature. Transparent background (PNG) recommended.</p>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-orange hover:bg-orange/5 transition-colors">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">Click to select image</span>
                <span className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={saving || uploadAttachment.isPending}
                />
              </label>
              {(saving || uploadAttachment.isPending) && (
                <p className="text-xs text-center text-orange animate-pulse">Uploading…</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
