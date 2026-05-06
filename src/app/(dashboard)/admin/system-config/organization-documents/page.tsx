'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, Trash2, Download, FolderOpen, Search, Plus, X } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { ConfirmModal } from '@/components/ui'
import { useOrgDocuments, useCreateOrgDocument, useDeleteOrgDocument } from '@/hooks/useOrgDocuments'
import { orgDocumentService, DOCUMENT_CATEGORIES, type OrgDocument } from '@/services/orgDocument.service'
import toast from 'react-hot-toast'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string | null) {
  if (!type) return '📄'
  if (type.includes('pdf')) return '📕'
  if (type.includes('word') || type.includes('document')) return '📘'
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return '📗'
  if (type.includes('image')) return '🖼️'
  if (type.includes('zip') || type.includes('rar')) return '🗜️'
  return '📄'
}

const CATEGORY_COLORS: Record<string, string> = {
  'Manual of Operations':       'bg-blue-100 text-blue-700',
  'Government Permit':          'bg-green-100 text-green-700',
  'Certificate / Accreditation':'bg-purple-100 text-purple-700',
  'Legal Document':             'bg-red-100 text-red-700',
  'Financial Report':           'bg-yellow-100 text-yellow-700',
  'Memorandum / Policy':        'bg-orange-100 text-orange-700',
  'Partnership Agreement':      'bg-teal-100 text-teal-700',
  'General':                    'bg-gray-100 text-gray-600',
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose }: { onClose: () => void }) {
  const createMutation = useCreateOrgDocument()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile]         = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', category: DOCUMENT_CATEGORIES[0] })

  const handleFile = (f: File) => {
    setFile(f)
    if (!form.name) setForm(prev => ({ ...prev, name: f.name.replace(/\.[^.]+$/, '') }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    if (!form.name.trim()) return toast.error('Document name is required')

    setUploading(true)
    try {
      const { path, url } = await orgDocumentService.uploadFile(file)
      await createMutation.mutateAsync({
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        category:    form.category,
        file_url:    path,           // store path; signed URL generated on download
        file_name:   file.name,
        file_size:   file.size,
        file_type:   file.type,
      })
      onClose()
    } catch (err) {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Upload Organization Document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              file ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
            }`}
          >
            {file ? (
              <div className="space-y-1">
                <p className="text-2xl">{fileIcon(file.type)}</p>
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-sm text-gray-500">Drag & drop a file here, or <span className="text-orange-500 font-medium">browse</span></p>
                <p className="text-xs text-gray-400">PDF, Word, Excel, images, ZIP — max 50 MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="e.g. SEC Registration 2025"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Brief description of the document"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            <Button type="submit" disabled={uploading || createMutation.isPending}>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading…' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Document Row ─────────────────────────────────────────────────────────────
function DocumentRow({ doc, onDelete }: { doc: OrgDocument; onDelete: (doc: OrgDocument) => void }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const url = await orgDocumentService.getSignedUrl(doc.file_url)
      window.open(url, '_blank')
    } catch {
      toast.error('Could not generate download link')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="text-2xl flex-shrink-0">{fileIcon(doc.file_type)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
        {doc.description && <p className="text-xs text-gray-500 truncate mt-0.5">{doc.description}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[doc.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {doc.category}
          </span>
          {doc.file_name && <span className="text-xs text-gray-400">{doc.file_name}</span>}
          <span className="text-xs text-gray-400">{formatBytes(doc.file_size)}</span>
          <span className="text-xs text-gray-400">
            {new Date(doc.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(doc)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrgDocumentsPage() {
  const { data: documents = [], isLoading } = useOrgDocuments()
  const deleteMutation = useDeleteOrgDocument()

  const [showUpload, setShowUpload]           = useState(false)
  const [search, setSearch]                   = useState('')
  const [filterCategory, setFilterCategory]   = useState('All')
  const [toDelete, setToDelete]               = useState<OrgDocument | null>(null)

  const filtered = documents.filter(doc => {
    const matchesSearch = !search || doc.name.toLowerCase().includes(search.toLowerCase()) || doc.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCat    = filterCategory === 'All' || doc.category === filterCategory
    return matchesSearch && matchesCat
  })

  const grouped = filtered.reduce<Record<string, OrgDocument[]>>((acc, doc) => {
    acc[doc.category] = acc[doc.category] ?? []
    acc[doc.category].push(doc)
    return acc
  }, {})

  const handleDelete = async () => {
    if (!toDelete) return
    await deleteMutation.mutateAsync({ id: toDelete.id, filePath: toDelete.file_url })
    setToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Documents</h1>
          <p className="text-gray-600 mt-1">Permits, manuals, certificates, and official documents</p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="All">All Categories</option>
            {DOCUMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No documents found</p>
          <p className="text-gray-400 text-sm mt-1">
            {documents.length === 0 ? 'Upload your first organization document to get started.' : 'Try adjusting your search or filter.'}
          </p>
        </Card>
      ) : filterCategory !== 'All' ? (
        <Card className="p-4 space-y-3">
          {filtered.map(doc => <DocumentRow key={doc.id} doc={doc} onDelete={setToDelete} />)}
        </Card>
      ) : (
        Object.entries(grouped).map(([cat, docs]) => (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600'}`}>
                {cat}
              </span>
              <span className="text-xs text-gray-400">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
            </div>
            <Card className="p-4 space-y-3">
              {docs.map(doc => <DocumentRow key={doc.id} doc={doc} onDelete={setToDelete} />)}
            </Card>
          </div>
        ))
      )}

      {/* Summary */}
      {documents.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          {documents.length} document{documents.length !== 1 ? 's' : ''} total
        </p>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {toDelete && (
        <ConfirmModal
          isOpen
          title="Delete Document"
          message={`Are you sure you want to delete "${toDelete.name}"? This will permanently remove the file.`}
          confirmText="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
