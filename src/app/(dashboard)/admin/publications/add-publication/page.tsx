'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ImageIcon, Loader2, PlusCircle, Upload, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'
import { useCreatePublicationRequest, useUpdatePublicationRequest, usePublicationRequest, usePublicationCategories } from '@/hooks/usePublications'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const PUBLICATION_YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i + 5))

export default function AddPublicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const createMutation = useCreatePublicationRequest()
  const updateMutation = useUpdatePublicationRequest()
  const { data: existing } = usePublicationRequest(editId ?? '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: pubCategories = [] } = usePublicationCategories(true)
  const [printingPresses, setPrintingPresses] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('printing_presses')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data }: { data: any }) => {
        if (data) setPrintingPresses(data)
      })
  }, [])

  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    category: '',
    publication_year: String(new Date().getFullYear()),
    description: '',
    quantity_available: 0,
    total_printed: 0,
    price_per_copy: 0,
    est_weight_kg: '',
    dim_length: '',
    dim_width: '',
    dim_height: '',
    printing_press: '',
    additional_notes: '',
  })

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }))

  // Populate form when editing an existing record
  useEffect(() => {
    if (!existing) return
    const notes = existing.notes ?? ''
    const authorMatch = notes.match(/^Author: (.+)$/m)
    const yearMatch = notes.match(/^Year: (.+)$/m)
    const totalMatch = notes.match(/^Total Printed: (.+)$/m)
    const pressMatch = notes.match(/^Printing Press: (.+)$/m)
    const weightMatch = notes.match(/^Est. Weight \(kg\): (.+)$/m)
    const dimMatch = notes.match(/^Dimensions \(LxWxH\): (.+)$/m)
    const pressEntry = pressMatch ? (printingPresses.find(p => p.name === pressMatch[1])?.id ?? '') : ''
    const [dimL = '', dimW = '', dimH = ''] = dimMatch ? dimMatch[1].split('x').map((s: string) => s.trim()) : []
    const additionalNotes = notes
      .split('\n')
      .filter((l: string) => !l.startsWith('Author:') && !l.startsWith('Year:') && !l.startsWith('Total Printed:') && !l.startsWith('Printing Press:') && !l.startsWith('Est. Weight') && !l.startsWith('Dimensions'))
      .join('\n').trim()

    // Weight and dimensions: prefer dedicated columns, fall back to notes
    const weightKg = (existing as any).est_weight_kg != null
      ? String((existing as any).est_weight_kg)
      : (weightMatch?.[1] ?? '')
    const lenCm  = (existing as any).dim_length_cm != null ? String((existing as any).dim_length_cm) : dimL
    const widCm  = (existing as any).dim_width_cm  != null ? String((existing as any).dim_width_cm)  : dimW
    const hiCm   = (existing as any).dim_height_cm != null ? String((existing as any).dim_height_cm) : dimH

    setForm({
      title: existing.publication_title ?? '',
      author: authorMatch?.[1] ?? '',
      isbn: existing.isbn ?? '',
      publisher: existing.publisher ?? '',
      category: existing.publication_type ?? 'book',
      publication_year: yearMatch?.[1] ?? String(new Date().getFullYear()),
      description: existing.purpose ?? '',
      quantity_available: existing.quantity ?? 0,
      total_printed: totalMatch ? Number(totalMatch[1]) : 0,
      price_per_copy: existing.estimated_cost ?? 0,
      est_weight_kg: weightKg,
      dim_length: lenCm,
      dim_width: widCm,
      dim_height: hiCm,
      printing_press: pressEntry,
      additional_notes: additionalNotes,
    })
    // Restore cover preview from existing record
    if ((existing as any).cover_url) {
      setCoverPreview((existing as any).cover_url)
    }
  }, [existing])

  // Load pdfjs from CDN to avoid webpack ESM bundling issues
  function loadPdfjsFromCDN(): Promise<any> {
    return new Promise((resolve, reject) => {
      const w = window as any
      if (w.pdfjsLib) { resolve(w.pdfjsLib); return }
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        w.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve(w.pdfjsLib)
      }
      script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'))
      document.head.appendChild(script)
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setCoverPreview(null)
    setIsGeneratingPreview(true)

    try {
      const pdfjsLib = await loadPdfjsFromCDN()

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)

      // Render at low resolution — thumbnail only, much faster
      const viewport = page.getViewport({ scale: 0.5 })
      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport }).promise

      // Use JPEG at 80% quality — smaller file, faster upload
      setCoverPreview(canvas.toDataURL('image/jpeg', 0.8))
    } catch (err) {
      console.error('PDF preview error:', err)
      toast.error('Could not generate cover preview')
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  async function uploadToStorage(file: File, path: string, driveOptions?: { title: string; isCover?: boolean }): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('publications')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw new Error(`Upload failed: ${error.message}`)
    const { data: urlData } = supabase.storage.from('publications').getPublicUrl(data.path)
    const publicUrl = urlData.publicUrl

    // Mirror to Google Drive (fire-and-forget)
    if (driveOptions) {
      fetch('/api/google/drive/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'publication',
          fileUrl: publicUrl,
          fileName: driveOptions.isCover ? 'cover.jpg' : file.name,
          mimeType: file.type,
          publicationTitle: driveOptions.title,
        }),
      }).catch(err => console.warn('[Drive Sync] publication mirror failed:', err))
    }

    return publicUrl
  }

  async function uploadCoverImage(dataUrl: string, basePath: string, publicationTitle?: string): Promise<string> {
    // Convert the canvas data URL to a Blob and upload as JPEG
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
    return uploadToStorage(file, `${basePath}/cover.jpg`, publicationTitle ? { title: publicationTitle, isCover: true } : undefined)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }

    // Pack extra fields into notes since DB doesn't have dedicated columns for these
    const dimParts = [form.dim_length, form.dim_width, form.dim_height].map(s => s.trim())
    const notesLines = [
      form.author ? `Author: ${form.author}` : null,
      form.publication_year ? `Year: ${form.publication_year}` : null,
      `Total Printed: ${form.total_printed}`,
      form.printing_press ? `Printing Press: ${printingPresses.find(p => p.id === form.printing_press)?.name ?? form.printing_press}` : null,
      form.additional_notes || null,
    ].filter(Boolean).join('\n')

    let pdf_url: string | undefined
    let cover_url: string | undefined

    // Upload PDF and cover if a file was selected
    if (selectedFile) {
      setIsUploading(true)
      try {
        const basePath = `publications/${Date.now()}`
        pdf_url = await uploadToStorage(selectedFile, `${basePath}/document.pdf`, { title: form.title })
        if (coverPreview) {
          cover_url = await uploadCoverImage(coverPreview, basePath, form.title)
        }
      } catch (err: any) {
        toast.error(err.message ?? 'File upload failed')
        setIsUploading(false)
        return
      } finally {
        setIsUploading(false)
      }
    }

    const payload: any = {
      publication_id: editId ?? `PUB-${Date.now()}`,
      publication_title: form.title,
      publication_type: form.category,
      request_type: 'catalogue',
      publisher: form.publisher || undefined,
      isbn: form.isbn || undefined,
      purpose: form.description || '',
      quantity: form.quantity_available || undefined,
      estimated_cost: form.price_per_copy > 0 ? form.price_per_copy : undefined,
      est_weight_kg: form.est_weight_kg ? parseFloat(form.est_weight_kg) : null,
      dim_length_cm: form.dim_length ? parseFloat(form.dim_length) : null,
      dim_width_cm: form.dim_width ? parseFloat(form.dim_width) : null,
      dim_height_cm: form.dim_height ? parseFloat(form.dim_height) : null,
      notes: notesLines || undefined,
      status: 'approved',
      ...(pdf_url && { pdf_url }),
      ...(cover_url && { cover_url }),
    }

    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, updates: payload })
        toast.success('Publication updated successfully')
      } else {
        await createMutation.mutateAsync(payload)
        toast.success('Publication saved successfully')
      }
      router.push('/admin/publications/publication-library')
    } catch {
      toast.error('Failed to save publication')
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending || isUploading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editId ? 'Edit Publication' : 'Add New Publication'}
          </h1>
          <p className="text-gray-600 mt-1">
            {editId ? 'Update publication details' : 'Add a new publication to the library'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit as any}
            disabled={isSaving}
          >
            {isUploading ? 'Uploading...' : (createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editId ? 'Save Changes' : 'Save Publication'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <Input required value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <Input value={form.author} onChange={e => set('author', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISBN</label>
              <Input value={form.isbn} onChange={e => set('isbn', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
              <Input value={form.publisher} onChange={e => set('publisher', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                required
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select category...</option>
                {pubCategories.map(c => (
                  <option key={c.id} value={c.name.toLowerCase()}>
                    {c.icon ? `${c.icon} ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publication Year</label>
              <Input
                type="number"
                min={1900}
                max={2099}
                value={form.publication_year}
                onChange={e => set('publication_year', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </Card>

        {/* Upload Digital Copy */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Upload Digital Copy</h2>
          <div className="flex gap-6 items-start">
            {/* Cover preview */}
            <div className="relative w-44 h-60 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center shrink-0 overflow-hidden">
              {isGeneratingPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                  <span className="text-xs text-gray-400">Generating...</span>
                </div>
              ) : coverPreview ? (
                <>
                  <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setCoverPreview(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute top-1.5 right-1.5 bg-white rounded-full p-0.5 shadow hover:bg-red-50"
                  >
                    <X className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                  <PlusCircle className="w-5 h-5 text-gray-400 mt-1.5" />
                </>
              )}
            </div>
            {/* Upload area */}
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                Upload the digital copy (PDF) that will be sent to the printing press for reprinting purposes.
                If you upload a digital copy (PDF), the cover will be automatically generated from the first page.
              </p>
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGeneratingPreview}
                >
                  Browse
                </Button>
                <span className="text-sm flex-1 truncate" title={selectedFile?.name}>
                  {isGeneratingPreview ? (
                    <span className="text-orange-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Generating cover preview...
                    </span>
                  ) : isUploading ? (
                    <span className="text-orange-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Uploading to storage...
                    </span>
                  ) : selectedFile ? (
                    <span className="text-gray-700">{selectedFile.name}</span>
                  ) : (
                    <span className="text-gray-400">No file selected</span>
                  )}
                </span>
                <Upload className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </Card>

        {/* Inventory Details */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Inventory Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available <span className="text-red-500">*</span></label>
              <Input
                type="number"
                min={0}
                required
                value={form.quantity_available}
                onChange={e => set('quantity_available', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Printed <span className="text-red-500">*</span></label>
              <Input
                type="number"
                min={0}
                required
                value={form.total_printed}
                onChange={e => set('total_printed', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Copy</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price_per_copy}
                onChange={e => set('price_per_copy', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Est. Weight (kg)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={form.est_weight_kg}
                onChange={e => set('est_weight_kg', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions (L × W × H)</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Length"
                    value={form.dim_length}
                    onChange={e => set('dim_length', e.target.value)}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 pointer-events-none">L</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Width"
                    value={form.dim_width}
                    onChange={e => set('dim_width', e.target.value)}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 pointer-events-none">W</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    placeholder="Height"
                    value={form.dim_height}
                    onChange={e => set('dim_height', e.target.value)}
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-gray-400 pointer-events-none">H</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Values in centimeters (cm)</p>
            </div>
          </div>
        </Card>

        {/* Printing Information */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Printing Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Printing Press Provider</label>
            <select
              value={form.printing_press}
              onChange={e => set('printing_press', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">-- None --</option>
              {printingPresses.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Additional Notes */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <textarea
            rows={4}
            value={form.additional_notes}
            onChange={e => set('additional_notes', e.target.value)}
            placeholder="Any additional information..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </Card>

      </form>
    </div>
  )
}
