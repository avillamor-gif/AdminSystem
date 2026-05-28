'use client'

import { useState, useMemo } from 'react'
import {
  BookOpen, Plus, Search, ExternalLink, Edit2, Trash2,
  Newspaper, FileText, Globe, BookMarked, Megaphone,
  GraduationCap, Video, MessageSquare, X, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useCitations, useCreateCitation, useUpdateCitation, useDeleteCitation } from '@/hooks/useMonitoring'
import { usePrograms, useProjects } from '@/hooks/useMonitoring'
import type { MECitation } from '@/services/monitoring.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SOURCE_TYPE_LABELS: Record<MECitation['source_type'], string> = {
  news_article: 'News Article',
  academic_journal: 'Academic Journal',
  policy_document: 'Policy Document',
  government_report: 'Government Report',
  social_media: 'Social Media',
  book: 'Book',
  conference: 'Conference',
  website: 'Website',
  other: 'Other',
}

const WORK_TYPE_LABELS: Record<MECitation['work_type'], string> = {
  research: 'Research',
  advocacy: 'Advocacy',
  policy: 'Policy',
  program: 'Program',
  project: 'Project',
  publication: 'Publication',
  other: 'Other',
}

const SOURCE_TYPE_ICON: Record<MECitation['source_type'], React.ReactNode> = {
  news_article: <Newspaper className="w-4 h-4" />,
  academic_journal: <GraduationCap className="w-4 h-4" />,
  policy_document: <FileText className="w-4 h-4" />,
  government_report: <BookMarked className="w-4 h-4" />,
  social_media: <MessageSquare className="w-4 h-4" />,
  book: <BookOpen className="w-4 h-4" />,
  conference: <Video className="w-4 h-4" />,
  website: <Globe className="w-4 h-4" />,
  other: <Megaphone className="w-4 h-4" />,
}

const SOURCE_TYPE_COLORS: Record<MECitation['source_type'], string> = {
  news_article: 'bg-blue-50 text-blue-700 border-blue-200',
  academic_journal: 'bg-purple-50 text-purple-700 border-purple-200',
  policy_document: 'bg-amber-50 text-amber-700 border-amber-200',
  government_report: 'bg-green-50 text-green-700 border-green-200',
  social_media: 'bg-pink-50 text-pink-700 border-pink-200',
  book: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  conference: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  website: 'bg-slate-50 text-slate-700 border-slate-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
}

const WORK_TYPE_COLORS: Record<MECitation['work_type'], string> = {
  research: 'bg-violet-100 text-violet-800',
  advocacy: 'bg-orange-100 text-orange-800',
  policy: 'bg-teal-100 text-teal-800',
  program: 'bg-blue-100 text-blue-800',
  project: 'bg-cyan-100 text-cyan-800',
  publication: 'bg-pink-100 text-pink-800',
  other: 'bg-gray-100 text-gray-700',
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = (): Partial<MECitation> => ({
  title: '',
  source_name: '',
  source_type: 'news_article',
  url: '',
  publication_date: '',
  authors: '',
  program_id: null,
  project_id: null,
  work_type: 'research',
  work_title: '',
  notes: '',
  tags: [],
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CitationsPage() {
  const { data: citations = [], isLoading } = useCitations()
  const { data: programs = [] } = usePrograms()
  const { data: projects = [] } = useProjects()
  const createMutation = useCreateCitation()
  const updateMutation = useUpdateCitation()
  const deleteMutation = useDeleteCitation()

  const [search, setSearch] = useState('')
  const [filterSourceType, setFilterSourceType] = useState<string>('all')
  const [filterWorkType, setFilterWorkType] = useState<string>('all')
  const [filterProgram, setFilterProgram] = useState<string>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<MECitation | null>(null)
  const [form, setForm] = useState<Partial<MECitation>>(emptyForm())
  const [tagInput, setTagInput] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MECitation | null>(null)

  // ─── Filtered list ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return citations.filter((c) => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        c.title.toLowerCase().includes(q) ||
        c.source_name.toLowerCase().includes(q) ||
        (c.work_title ?? '').toLowerCase().includes(q) ||
        (c.authors ?? '').toLowerCase().includes(q)
      const matchesSource = filterSourceType === 'all' || c.source_type === filterSourceType
      const matchesWork = filterWorkType === 'all' || c.work_type === filterWorkType
      const matchesProgram = filterProgram === 'all' || c.program_id === filterProgram
      return matchesSearch && matchesSource && matchesWork && matchesProgram
    })
  }, [citations, search, filterSourceType, filterWorkType, filterProgram])

  // ─── Stats ───────────────────────────────────────────────────────────────
  const bySource = useMemo(() => {
    const counts: Record<string, number> = {}
    citations.forEach((c) => { counts[c.source_type] = (counts[c.source_type] ?? 0) + 1 })
    return counts
  }, [citations])

  const byWorkType = useMemo(() => {
    const counts: Record<string, number> = {}
    citations.forEach((c) => { counts[c.work_type] = (counts[c.work_type] ?? 0) + 1 })
    return counts
  }, [citations])

  // ─── Handlers ────────────────────────────────────────────────────────────
  function openCreate() {
    setSelected(null)
    setForm(emptyForm())
    setTagInput('')
    setModalOpen(true)
  }

  function openEdit(c: MECitation) {
    setSelected(c)
    setForm({ ...c })
    setTagInput('')
    setModalOpen(true)
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (!t) return
    const existing = form.tags ?? []
    if (!existing.includes(t)) setForm((f) => ({ ...f, tags: [...(f.tags ?? []), t] }))
    setTagInput('')
  }

  function removeTag(t: string) {
    setForm((f) => ({ ...f, tags: (f.tags ?? []).filter((x) => x !== t) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      publication_date: form.publication_date || null,
      url: form.url || null,
      authors: form.authors || null,
      work_title: form.work_title || null,
      notes: form.notes || null,
      program_id: form.program_id || null,
      project_id: form.project_id || null,
      tags: form.tags?.length ? form.tags : null,
      added_by: null,
    } as Omit<MECitation, 'id' | 'created_at' | 'updated_at' | 'program' | 'project' | 'added_by_emp'>

    if (selected) {
      await updateMutation.mutateAsync({ id: selected.id, data: payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setModalOpen(false)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Citation Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track every time your research, advocacy, policy work, or programs are cited externally.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Citation
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Total Citations" value={citations.length} color="bg-cyan-600" />
        <SummaryCard label="News / Media" value={bySource['news_article'] ?? 0} color="bg-blue-600" />
        <SummaryCard label="Academic" value={bySource['academic_journal'] ?? 0} color="bg-purple-600" />
        <SummaryCard label="Policy Docs" value={bySource['policy_document'] ?? 0} color="bg-amber-600" />
      </div>

      {/* Work-type breakdown */}
      {citations.length > 0 && (
        <div className="bg-white border rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Citations by Work Type</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byWorkType).sort((a, b) => b[1] - a[1]).map(([wt, count]) => (
              <span key={wt} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${WORK_TYPE_COLORS[wt as MECitation['work_type']]}`}>
                {WORK_TYPE_LABELS[wt as MECitation['work_type']]}
                <span className="ml-1 font-bold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search title, source, authors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterSourceType} onChange={(e) => setFilterSourceType(e.target.value)} className="w-44">
          <option value="all">All Source Types</option>
          {(Object.keys(SOURCE_TYPE_LABELS) as MECitation['source_type'][]).map((k) => (
            <option key={k} value={k}>{SOURCE_TYPE_LABELS[k]}</option>
          ))}
        </Select>
        <Select value={filterWorkType} onChange={(e) => setFilterWorkType(e.target.value)} className="w-40">
          <option value="all">All Work Types</option>
          {(Object.keys(WORK_TYPE_LABELS) as MECitation['work_type'][]).map((k) => (
            <option key={k} value={k}>{WORK_TYPE_LABELS[k]}</option>
          ))}
        </Select>
        <Select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="w-44">
          <option value="all">All Programs</option>
          {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      {/* Citation list */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading citations…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>{citations.length === 0 ? 'No citations logged yet. Add the first one!' : 'No citations match your filters.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CitationCard
              key={c.id}
              citation={c}
              onEdit={() => openEdit(c)}
              onDelete={() => setDeleteTarget(c)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <form onSubmit={handleSubmit}>
          <ModalHeader onClose={() => setModalOpen(false)}>
            {selected ? 'Edit Citation' : 'Add Citation'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* What was cited */}
              <fieldset className="border rounded-lg p-4 space-y-3">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                  Your Work Being Cited
                </legend>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Citation Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    required
                    placeholder="e.g. 'Youth Unemployment Study cited in Senate hearing'"
                    value={form.title ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
                    <Select
                      value={form.work_type ?? 'research'}
                      onChange={(e) => setForm((f) => ({ ...f, work_type: e.target.value as MECitation['work_type'] }))}
                    >
                      {(Object.keys(WORK_TYPE_LABELS) as MECitation['work_type'][]).map((k) => (
                        <option key={k} value={k}>{WORK_TYPE_LABELS[k]}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Work Title</label>
                    <Input
                      placeholder="Exact title of the cited work"
                      value={form.work_title ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, work_title: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linked Program</label>
                    <Select
                      value={form.program_id ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, program_id: e.target.value || null }))}
                    >
                      <option value="">— None —</option>
                      {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linked Project</label>
                    <Select
                      value={form.project_id ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value || null }))}
                    >
                      <option value="">— None —</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                  </div>
                </div>
              </fieldset>

              {/* The source that cited you */}
              <fieldset className="border rounded-lg p-4 space-y-3">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                  The Source That Cited You
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g. 'Philippine Daily Inquirer'"
                      value={form.source_name ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, source_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
                    <Select
                      value={form.source_type ?? 'news_article'}
                      onChange={(e) => setForm((f) => ({ ...f, source_type: e.target.value as MECitation['source_type'] }))}
                    >
                      {(Object.keys(SOURCE_TYPE_LABELS) as MECitation['source_type'][]).map((k) => (
                        <option key={k} value={k}>{SOURCE_TYPE_LABELS[k]}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publication Date</label>
                    <Input
                      type="date"
                      value={form.publication_date ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, publication_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Author(s)</label>
                    <Input
                      placeholder="Author names"
                      value={form.authors ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={form.url ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  />
                </div>
              </fieldset>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag (press Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                  />
                  <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
                </div>
                {(form.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(form.tags ?? []).map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 bg-cyan-100 text-cyan-800 text-xs px-2 py-0.5 rounded-full">
                        <Tag className="w-3 h-3" />{t}
                        <button type="button" onClick={() => removeTag(t)} className="ml-0.5 hover:text-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Context, significance, or other notes…"
                  value={form.notes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? 'Saving…' : selected ? 'Save Changes' : 'Add Citation'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Citation"
        message={`Remove "${deleteTarget?.title}" from the citation tracker? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`${color} rounded-xl p-4 text-white`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80 mt-0.5">{label}</p>
    </div>
  )
}

function CitationCard({
  citation: c,
  onEdit,
  onDelete,
}: {
  citation: MECitation
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className={`bg-white border rounded-xl p-4 hover:shadow-sm transition-shadow`}>
      <div className="flex items-start gap-4">
        {/* Source type icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center ${SOURCE_TYPE_COLORS[c.source_type]}`}>
          {SOURCE_TYPE_ICON[c.source_type]}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start gap-2">
            <h3 className="text-sm font-semibold text-gray-900 flex-1">{c.title}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${SOURCE_TYPE_COLORS[c.source_type]}`}>
              {SOURCE_TYPE_ICON[c.source_type]}
              {SOURCE_TYPE_LABELS[c.source_type]}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${WORK_TYPE_COLORS[c.work_type]}`}>
              {WORK_TYPE_LABELS[c.work_type]}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{c.source_name}</span>
            {c.publication_date && <span>{formatDate(c.publication_date)}</span>}
            {c.authors && <span>By {c.authors}</span>}
            {c.program?.name && (
              <span className="text-cyan-700">📁 {c.program.name}</span>
            )}
            {c.project?.name && (
              <span className="text-cyan-600">📂 {c.project.name}</span>
            )}
          </div>

          {c.work_title && (
            <p className="mt-1 text-xs text-gray-500 italic">Cited work: "{c.work_title}"</p>
          )}

          {c.notes && (
            <p className="mt-1 text-xs text-gray-600 line-clamp-2">{c.notes}</p>
          )}

          {(c.tags ?? []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {(c.tags ?? []).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                  <Tag className="w-2.5 h-2.5" />{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {c.url && (
            <a href={c.url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-cyan-600 rounded hover:bg-cyan-50 transition-colors"
              title="Open source URL">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
            title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
