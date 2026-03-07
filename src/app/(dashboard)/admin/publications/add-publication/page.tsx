'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ImageIcon, Loader2, PlusCircle, Upload, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'
import { useCreatePublicationRequest, useUpdatePublicationRequest, usePublicationRequest } from '@/hooks/usePublications'
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

  const [printingPresses, setPrintingPresses] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('printing_presses')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data }) => {
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
    category: 'book',
    publication_year: String(new Date().getFullYear()),
    description: '',
    quantity_available: 0,
    total_printed: 0,
    price_per_copy: 0,
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
    const pressEntry = pressMatch ? (printingPresses.find(p => p.name === pressMatch[1])?.id ?? '') : ''
    const additionalNotes = notes
      .split('\n')
      .filter((l: string) => !l.startsWith('Author:') && !l.startsWith('Year:') && !l.startsWith('Total Printed:') && !l.startsWith('Printing Press:'))
      .join('\n').trim()

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

  async function uploadToStorage(file: File, path: string): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('publications')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw new Error(`Upload failed: ${error.message}`)
    const { data: urlData } = supabase.storage.from('publications').getPublicUrl(data.path)
    return urlData.publicUrl
  }

  async function uploadCoverImage(dataUrl: string, basePath: string): Promise<string> {
    // Convert the canvas data URL to a Blob and upload as JPEG
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
    return uploadToStorage(file, `${basePath}/cover.jpg`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Title is required'); return }

    // Pack extra fields into notes since DB doesn't have dedicated columns
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
        pdf_url = await uploadToStorage(selectedFile, `${basePath}/document.pdf`)
        if (coverPreview) {
          cover_url = await uploadCoverImage(coverPreview, basePath)
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
      purpose: form.description || form.title,
      quantity: form.quantity_available || undefined,
      estimated_cost: form.price_per_copy > 0 ? form.price_per_copy : undefined,
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
              <Input
                required
                value={form.category}
                onChange={e => set('category', e.target.value)}
                placeholder="e.g., Newsletter, Magazine, Book"
              />
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
