'use client'

import { useState } from 'react'
import { ClipboardList, Plus, Eye, Trash2, CheckCircle, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Button, Card, Badge, Modal, ModalHeader, ModalBody, ModalFooter, ConfirmModal } from '@/components/ui'
import { useProgramEnrollments } from '@/hooks/useInternship'
import {
  useInternshipAssessments,
  useCreateInternshipAssessment,
  useSubmitAssessmentPart2,
  useDeleteInternshipAssessment,
} from '@/hooks/useInternship'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { formatDate } from '@/lib/utils'
import type { InternshipAssessmentWithRelations, InternshipAssessmentPart2Update } from '@/services/internship.service'

// ─── Rating scale ─────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: 'Needs more training',
  2: 'Below expectations',
  3: 'Acceptable',
  4: 'Above average',
  5: 'Superior',
  6: 'Not observed',
}

const RATING_COLORS: Record<number, string> = {
  1: 'text-red-600',
  2: 'text-orange-500',
  3: 'text-yellow-600',
  4: 'text-blue-600',
  5: 'text-green-600',
  6: 'text-gray-400',
}

function RatingDisplay({ value }: { value: number | null | undefined }) {
  if (!value) return <span className="text-gray-300 text-sm">—</span>
  return (
    <span className={`text-sm font-semibold ${RATING_COLORS[value] ?? ''}`}>
      {value} — {RATING_LABELS[value]}
    </span>
  )
}

const OVERALL_LABELS: Record<string, string> = {
  outstanding:    'Outstanding',
  above_average:  'Above Average',
  satisfactory:   'Satisfactory',
  below_average:  'Below Average',
  unsatisfactory: 'Unsatisfactory',
}

const OVERALL_COLORS: Record<string, string> = {
  outstanding:    'success',
  above_average:  'default',
  satisfactory:   'warning',
  below_average:  'warning',
  unsatisfactory: 'danger',
}

// ─── Part I read-only view ────────────────────────────────────────────────────

const GENERAL_ITEMS: { key: string; label: string }[] = [
  { key: 'r_attendance',           label: 'Attendance' },
  { key: 'r_punctuality',          label: 'Punctuality' },
  { key: 'r_appropriate_dress',    label: 'Appropriate dress' },
  { key: 'r_attitude',             label: 'Attitude' },
  { key: 'r_acceptance_criticism', label: 'Acceptance of criticism' },
  { key: 'r_asks_questions',       label: 'Asks appropriate questions' },
  { key: 'r_self_motivated',       label: 'Self-motivated' },
  { key: 'r_ethical_behaviour',    label: 'Practices ethical behaviour' },
]

const JOB_ITEMS: { key: string; label: string }[] = [
  { key: 'r_job_knowledge',        label: 'Sufficient knowledge to perform tasks' },
  { key: 'r_verbal_communication', label: 'Verbal communication skills' },
  { key: 'r_written_communication',label: 'Written communication skills' },
  { key: 'r_analytical_skills',    label: 'Analytical skills' },
  { key: 'r_technical_skills',     label: 'Uses technical skills required for the position' },
  { key: 'r_meets_deadlines',      label: 'Meets deadlines' },
  { key: 'r_takes_initiative',     label: 'Takes initiative to get the job done' },
  { key: 'r_sets_priorities',      label: 'Sets priorities' },
]

function Part1ReadOnly({ a }: { a: InternshipAssessmentWithRelations }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-semibold text-gray-700"
        onClick={() => setOpen(v => !v)}
      >
        <span>Part I — Intern Self-Assessment</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <div className="p-4 space-y-5 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">1. General Workplace Performance</h4>
            <div className="space-y-1.5">
              {GENERAL_ITEMS.map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-600">{label}</span>
                  <RatingDisplay value={(a as any)[key]} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">2. Specific Job Assignment Performance</h4>
            <div className="space-y-1.5">
              {JOB_ITEMS.map(({ key, label }) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-600">{label}</span>
                  <RatingDisplay value={(a as any)[key]} />
                </div>
              ))}
            </div>
          </div>
          {a.overall_performance && (
            <div className="flex items-center gap-3 pt-1">
              <span className="text-gray-600 font-medium">Overall Performance:</span>
              <Badge variant={OVERALL_COLORS[a.overall_performance] as any}>
                {OVERALL_LABELS[a.overall_performance] ?? a.overall_performance}
              </Badge>
            </div>
          )}
          {[
            { label: 'Strengths & Weaknesses', value: a.strengths_weaknesses },
            { label: 'Most Important Achievements', value: a.important_achievements },
            { label: 'Most Difficult Elements', value: a.most_difficult },
            { label: 'Likes & Dislikes', value: a.likes_dislikes },
            { label: 'Other Comments', value: a.intern_other_comments },
          ].filter(f => f.value).map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">{label}</p>
              <p className="text-gray-700 whitespace-pre-wrap">{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Part II form ─────────────────────────────────────────────────────────────

function Part2Form({
  assessment,
  onClose,
}: {
  assessment: InternshipAssessmentWithRelations
  onClose: () => void
}) {
  const submit = useSubmitAssessmentPart2()
  const [form, setForm] = useState<InternshipAssessmentPart2Update>({
    supervisor_strengths_areas: assessment.supervisor_strengths_areas ?? '',
    supervisor_comments: assessment.supervisor_comments ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submit.mutateAsync({ id: assessment.id, data: form })
    onClose()
  }

  const isComplete = assessment.status === 'complete'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Major strengths and areas for improvement <span className="text-red-500">*</span>
        </label>
        <textarea
          name="supervisor_strengths_areas"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Describe the intern's major strengths and areas that need improvement..."
          value={form.supervisor_strengths_areas ?? ''}
          onChange={handleChange}
          disabled={isComplete}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Other comments, commendations, or recommendations
        </label>
        <textarea
          name="supervisor_comments"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Additional comments or recommendations..."
          value={form.supervisor_comments ?? ''}
          onChange={handleChange}
          disabled={isComplete}
        />
      </div>
      {!isComplete && (
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={submit.isPending}>
            {submit.isPending ? 'Saving…' : 'Complete Assessment'}
          </Button>
        </div>
      )}
    </form>
  )
}

// ─── Assessment detail modal ──────────────────────────────────────────────────

function AssessmentModal({
  assessment,
  onClose,
}: {
  assessment: InternshipAssessmentWithRelations
  onClose: () => void
}) {
  const emp = assessment.enrollment?.employee
  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'

  return (
    <Modal open onClose={onClose} size="lg">
      <ModalHeader>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Assessment — {fullName}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {assessment.enrollment?.program_type?.toUpperCase()} ·{' '}
            {assessment.enrollment?.partner_institution?.name ?? 'Independent'}
          </p>
        </div>
      </ModalHeader>
      <ModalBody className="space-y-4">
        {assessment.status === 'pending' && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            <Clock className="w-4 h-4 shrink-0" />
            Waiting for the intern to complete Part I of the assessment.
          </div>
        )}

        {/* Part I read-only */}
        {assessment.status !== 'pending' && <Part1ReadOnly a={assessment} />}

        {/* Part II */}
        <div className="border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-blue-50 text-sm font-semibold text-blue-800 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Part II — Supervisor Evaluation
            {assessment.status === 'complete' && (
              <Badge variant="success" className="ml-auto">Completed {assessment.part2_submitted_at ? formatDate(assessment.part2_submitted_at) : ''}</Badge>
            )}
          </div>
          <div className="p-4">
            <Part2Form assessment={assessment} onClose={onClose} />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InternshipAssessmentsPage() {
  const { data: assessments = [], isLoading } = useInternshipAssessments()
  const { data: enrollments = [] } = useProgramEnrollments()
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateInternshipAssessment()
  const deleteMutation = useDeleteInternshipAssessment()

  const [selectedAssessment, setSelectedAssessment] = useState<InternshipAssessmentWithRelations | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')

  // Enrollments that don't already have an assessment
  const assessedEnrollmentIds = new Set(assessments.map(a => a.enrollment_id))
  const eligibleEnrollments = enrollments.filter(e => !assessedEnrollmentIds.has(e.id))

  async function handleCreate() {
    if (!selectedEnrollmentId || !currentEmployee) return
    await createMutation.mutateAsync({
      enrollment_id: selectedEnrollmentId,
      created_by: currentEmployee.id,
    })
    setShowCreateModal(false)
    setSelectedEnrollmentId('')
  }

  function statusBadge(status: string) {
    if (status === 'complete') return <Badge variant="success">Complete</Badge>
    if (status === 'part1_complete') return <Badge variant="warning">Awaiting Part II</Badge>
    return <Badge variant="default">Pending Intern</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Intern Assessments</h1>
          <p className="text-gray-500 text-sm mt-1">IBON International Intern Assessment Form — online</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Assessment
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : assessments.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No assessments yet</p>
          <p className="text-gray-400 text-sm mt-1">Create an assessment form for an enrolled intern.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Intern</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Program</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Institution</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => {
                  const emp = a.enrollment?.employee
                  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : '—'
                  return (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{fullName}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {a.enrollment?.program_type?.replace(/_/g, ' ') ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {a.enrollment?.partner_institution?.name ?? 'Independent'}
                      </td>
                      <td className="px-4 py-3">{statusBadge(a.status)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(a.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                            title="View / Edit"
                            onClick={() => setSelectedAssessment(a)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-red-50 rounded text-red-500"
                            title="Delete"
                            onClick={() => setDeleteTarget(a.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <Modal open onClose={() => setShowCreateModal(false)}>
          <ModalHeader><h2 className="text-lg font-bold text-gray-900">New Assessment Form</h2></ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-sm text-gray-500">
              Select an enrollment to generate an assessment form. The intern will fill in Part I; you complete Part II.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment <span className="text-red-500">*</span></label>
              {eligibleEnrollments.length === 0 ? (
                <p className="text-sm text-gray-400">All active enrollments already have an assessment form.</p>
              ) : (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={selectedEnrollmentId}
                  onChange={e => setSelectedEnrollmentId(e.target.value)}
                >
                  <option value="">Select an enrollment…</option>
                  {eligibleEnrollments.map(e => {
                    const emp = (e as any).employee
                    return (
                      <option key={e.id} value={e.id}>
                        {emp ? `${emp.first_name} ${emp.last_name}` : e.employee_id} —{' '}
                        {e.program_type?.toUpperCase()} ({e.status})
                      </option>
                    )
                  })}
                </select>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={!selectedEnrollmentId || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating…' : 'Create Assessment'}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Detail / edit modal */}
      {selectedAssessment && (
        <AssessmentModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Assessment"
        message="This will permanently delete the assessment form and all responses. This cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={async () => {
          if (deleteTarget) await deleteMutation.mutateAsync(deleteTarget)
          setDeleteTarget(null)
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
