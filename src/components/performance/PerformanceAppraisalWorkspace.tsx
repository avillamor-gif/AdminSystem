'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download, FilePlus2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import { Button, Card, Input, Select, Badge } from '@/components/ui'
import {
  useMyPerformanceAppraisals,
  useSavePerformanceAppraisalDraft,
  useSubmitPerformanceAppraisal,
} from '@/hooks'
import type { PerformanceAppraisalRecord } from '@/services'

type PeriodCovered = 'midyear' | 'yearend'
type AppraisalStatus = 'draft' | 'pending_review' | 'in_review' | 'returned' | 'completed'

type ObjectiveRow = {
  objective: string
  status: string
  comments: string
}

type PlanRow = {
  objective: string
  criteria: string
}

type SavedAppraisal = {
  id: string
  createdAt: string
  updatedAt: string
  status: AppraisalStatus
  periodCovered: PeriodCovered
  appraiseeName: string
  filename: string
  form: AppraisalFormState
  returnComment?: string
}

type AppraisalFormState = {
  appraiseeName: string
  appraiserName: string
  department: string
  position: string
  timeInPresentPosition: string
  lengthOfService: string
  periodCovered: PeriodCovered
  appraisalDate: string
  discussionPoints: string[]
  objectives: ObjectiveRow[]
  workRatings: Record<string, string>
  problemsFaced: string
  supervisorFeedback: string
  overallRating: string
  recommendation: string
  trainingDevelopmentAims: string
  trainingSupport: string
  performancePlan: PlanRow[]
  managementActionSummary: string
  confidentialityNotes: string
  appraiserSignature: string
  appraiserSignedDate: string
  appraiseeSignature: string
  appraiseeSignedDate: string
}

const DRAFT_STORAGE_KEY = 'performance-appraisal-draft-v1'

const DISCUSSION_PROMPTS = [
  'What do you consider to be your most important achievements of the past year?',
  'What do you like and dislike about working for this organisation?',
  'What elements of your job interest you the most, and least?',
  'What elements of your job do you find most manageable, and most difficult?',
  'What action could be taken to improve your performance in your current position by you and your supervisor?',
  'What kind of work or job would you like to be doing in one/two/five years time?',
  'Other issues you would like to raise that affect your performance.',
]

const WORK_RATING_AREAS = [
  'Communication skills (written and oral)',
  'Decision making ability and problem-solving skills',
  'Time management (meeting deadlines/commitments)',
  'Planning, budgeting and forecasting',
  'Organizational ability (reporting and administration)',
  'Analytical skill',
  'IT/equipment/machinery skills',
  'Creativity',
  'Delegation skills, team-working, and developing others',
  'Energy, determination and work-rate',
  'Leadership and integrity',
  'Adaptability, flexibility, and mobility; steadiness under pressure',
  'Work attitude and ethics',
  'Staff relations',
  'Compliance with institutional policies and procedures',
]

const emptyObjective = (): ObjectiveRow => ({ objective: '', status: 'on_track', comments: '' })
const emptyPlan = (): PlanRow => ({ objective: '', criteria: '' })

const defaultFormState = (initialAppraiseeName: string): AppraisalFormState => ({
  appraiseeName: initialAppraiseeName,
  appraiserName: '',
  department: '',
  position: '',
  timeInPresentPosition: '',
  lengthOfService: '',
  periodCovered: 'midyear',
  appraisalDate: new Date().toISOString().slice(0, 10),
  discussionPoints: Array(DISCUSSION_PROMPTS.length).fill(''),
  objectives: [emptyObjective(), emptyObjective(), emptyObjective()],
  workRatings: {},
  problemsFaced: '',
  supervisorFeedback: '',
  overallRating: 'good',
  recommendation: '',
  trainingDevelopmentAims: '',
  trainingSupport: '',
  performancePlan: [emptyPlan(), emptyPlan(), emptyPlan()],
  managementActionSummary: '',
  confidentialityNotes: '',
  appraiserSignature: '',
  appraiserSignedDate: '',
  appraiseeSignature: initialAppraiseeName,
  appraiseeSignedDate: '',
})

const statusLabelMap: Record<AppraisalStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  in_review: 'In Review',
  returned: 'Returned',
  completed: 'Completed',
}

const statusVariantMap: Record<AppraisalStatus, 'default' | 'warning' | 'success' | 'info' | 'danger'> = {
  draft: 'default',
  pending_review: 'warning',
  in_review: 'info',
  returned: 'danger',
  completed: 'success',
}

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const textAreaClassName = 'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500'

interface PerformanceAppraisalWorkspaceProps {
  initialAppraiseeName?: string
}

export default function PerformanceAppraisalWorkspace({ initialAppraiseeName = '' }: PerformanceAppraisalWorkspaceProps) {
  const [form, setForm] = useState<AppraisalFormState>(() => defaultFormState(initialAppraiseeName))
  const [activeFormId, setActiveFormId] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const { data: savedRecords = [] } = useMyPerformanceAppraisals()
  const saveDraftMutation = useSavePerformanceAppraisalDraft()
  const submitMutation = useSubmitPerformanceAppraisal()

  useEffect(() => {
    const storedDraft = safeJsonParse<AppraisalFormState | null>(localStorage.getItem(DRAFT_STORAGE_KEY), null)

    if (storedDraft) {
      setForm(storedDraft)
    } else {
      setForm(defaultFormState(initialAppraiseeName))
    }
  }, [initialAppraiseeName])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))
      setLastSavedAt(new Date().toISOString())
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [form])

  const mapRecordToSaved = (record: PerformanceAppraisalRecord): SavedAppraisal => {
    const parsedForm = (record.form_data ?? {}) as Partial<AppraisalFormState>
    const resolvedAppraiserName = record.appraiser
      ? `${record.appraiser.first_name || ''} ${record.appraiser.last_name || ''}`.trim()
      : ''
    const mergedForm: AppraisalFormState = {
      ...defaultFormState(initialAppraiseeName),
      ...parsedForm,
      appraiserName: parsedForm.appraiserName || resolvedAppraiserName,
    }

    return {
      id: record.id,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      status: record.status,
      periodCovered: record.period_covered,
      appraiseeName: mergedForm.appraiseeName,
      filename: record.filename,
      form: mergedForm,
      returnComment: typeof record.form_data?.admin_return_comment === 'string' ? record.form_data.admin_return_comment : undefined,
    }
  }

  const listPreview = useMemo(() => {
    return savedRecords.map(mapRecordToSaved).map((entry) => ({
      ...entry,
      periodLabel: entry.periodCovered === 'midyear' ? 'Midyear (January to June)' : 'Yearend (January to December)',
      displayDate: new Date(entry.updatedAt).toLocaleDateString(),
    }))
  }, [savedRecords, initialAppraiseeName])

  const saveAsDraft = async () => {
    try {
      const reviewYear = Number((form.appraisalDate || '').slice(0, 4)) || new Date().getFullYear()
      const saved = await saveDraftMutation.mutateAsync({
        id: activeFormId ?? undefined,
        periodCovered: form.periodCovered,
        reviewYear,
        formData: form,
      })
      setActiveFormId(saved.id)
    } catch {
      // Error toast is handled in the mutation hook.
    }
  }

  const submitForReview = async () => {
    if (!form.appraiseeName) {
      toast.error('Please complete appraisee name before submitting')
      return
    }

    try {
      const reviewYear = Number((form.appraisalDate || '').slice(0, 4)) || new Date().getFullYear()
      const submitted = await submitMutation.mutateAsync({
        id: activeFormId ?? undefined,
        periodCovered: form.periodCovered,
        reviewYear,
        formData: form,
      })
      setActiveFormId(submitted.id)
    } catch {
      // Error toast is handled in the mutation hook.
    }
  }

  const clearForNew = () => {
    const fresh = defaultFormState(initialAppraiseeName)
    setForm(fresh)
    setActiveFormId(null)
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(fresh))
    toast.success('Started a new appraisal form')
  }

  const loadEntry = (entry: SavedAppraisal) => {
    setForm(entry.form)
    setActiveFormId(entry.id)
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(entry.form))
    if (entry.returnComment) {
      toast(`Admin note: ${entry.returnComment}`)
    }
    toast.success(`Loaded ${entry.filename}`)
  }

  const downloadEntry = (entry: SavedAppraisal) => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const left = 40
    const pageWidth = doc.internal.pageSize.getWidth()
    const maxWidth = pageWidth - left * 2
    let y = 40

    const ensureSpace = (needed = 22) => {
      if (y + needed > 800) {
        doc.addPage()
        y = 40
      }
    }

    const addLine = (text: string, size = 10, bold = false) => {
      ensureSpace(18)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setFontSize(size)
      const lines = doc.splitTextToSize(text || '-', maxWidth)
      doc.text(lines, left, y)
      y += lines.length * (size + 3)
    }

    const addGap = (amount = 8) => {
      y += amount
    }

    addLine('IBON International - Performance Appraisal Form', 14, true)
    addLine(`Filename: ${entry.filename}`, 10)
    addLine(`Status: ${statusLabelMap[entry.status]}`, 10)
    addLine(`Period: ${entry.form.periodCovered === 'yearend' ? 'Yearend' : 'Midyear'}`, 10)
    addLine(`Appraisal Date: ${entry.form.appraisalDate || '-'}`, 10)
    if (entry.returnComment) addLine(`Admin Return Comment: ${entry.returnComment}`, 10)
    addGap()

    addLine('Basic Information', 12, true)
    addLine(`Appraisee: ${entry.form.appraiseeName}`)
    addLine(`Appraiser: ${entry.form.appraiserName}`)
    addLine(`Department: ${entry.form.department}`)
    addLine(`Position: ${entry.form.position}`)
    addLine(`Time in Present Position: ${entry.form.timeInPresentPosition}`)
    addLine(`Length of Service: ${entry.form.lengthOfService}`)
    addGap()

    addLine('Part I: Discussion Points', 12, true)
    DISCUSSION_PROMPTS.forEach((prompt, idx) => {
      addLine(`${idx + 1}. ${prompt}`, 10, true)
      addLine(entry.form.discussionPoints[idx] || '-')
    })
    addGap()

    addLine('Part II: Performance Assessment', 12, true)
    entry.form.objectives.forEach((objective, idx) => {
      addLine(`Objective ${idx + 1}: ${objective.objective || '-'}`)
      addLine(`Status: ${objective.status || '-'}`)
      addLine(`Comments: ${objective.comments || '-'}`)
      addGap(4)
    })

    addLine('Overall Rating and Recommendation', 12, true)
    addLine(`Overall Rating: ${entry.form.overallRating}`)
    addLine(`Recommendation: ${entry.form.recommendation || '-'}`)
    addGap()

    addLine('Signatures', 12, true)
    addLine(`Appraiser: ${entry.form.appraiserSignature || '-'} (${entry.form.appraiserSignedDate || '-'})`)
    addLine(`Appraisee: ${entry.form.appraiseeSignature || '-'} (${entry.form.appraiseeSignedDate || '-'})`)

    doc.save(`${entry.filename}.pdf`)
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Performance Appraisal Form</h2>
            <p className="text-sm text-gray-500 mt-1">Online form based on your standard appraisal template with draft and autosave support.</p>
            <p className="text-xs text-gray-400 mt-1">{lastSavedAt ? `Auto-saved at ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Autosave starts as you type'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={clearForNew}>
              <FilePlus2 className="w-4 h-4" />
              New Form
            </Button>
            <Button variant="outline" size="sm" onClick={saveAsDraft}>
              <Save className="w-4 h-4" />
              Save as Draft
            </Button>
            <Button size="sm" onClick={submitForReview}>Submit for Review</Button>
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-5">
        <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name of Appraisee" value={form.appraiseeName} onChange={(e) => setForm((prev) => ({ ...prev, appraiseeName: e.target.value }))} />
          <Input
            label="Name of Appraiser"
            value={form.appraiserName}
            readOnly
            placeholder="Auto-assigned from your manager"
            helpText="This field is auto-assigned to your manager. HR/Admin can override if needed."
          />
          <Input label="Department" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} />
          <Input label="Position" value={form.position} onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))} />
          <Input label="Time in Present Position" value={form.timeInPresentPosition} onChange={(e) => setForm((prev) => ({ ...prev, timeInPresentPosition: e.target.value }))} />
          <Input label="Length of Service" value={form.lengthOfService} onChange={(e) => setForm((prev) => ({ ...prev, lengthOfService: e.target.value }))} />
          <Select
            label="Period Covered"
            value={form.periodCovered}
            onChange={(e) => setForm((prev) => ({ ...prev, periodCovered: e.target.value as PeriodCovered }))}
            options={[
              { value: 'midyear', label: 'Midyear (January to June)' },
              { value: 'yearend', label: 'Yearend (January to December)' },
            ]}
          />
          <Input
            label="Appraisal Date"
            type="date"
            value={form.appraisalDate}
            onChange={(e) => setForm((prev) => ({ ...prev, appraisalDate: e.target.value }))}
          />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part I: Discussion Points</h3>
        <p className="text-sm text-gray-500">To be completed by staff before discussion with the appraiser.</p>
        {DISCUSSION_PROMPTS.map((prompt, idx) => (
          <div key={prompt} className="space-y-1">
            <p className="text-sm text-gray-700">{idx + 1}. {prompt}</p>
            <textarea
              rows={3}
              className={textAreaClassName}
              value={form.discussionPoints[idx] || ''}
              onChange={(e) =>
                setForm((prev) => {
                  const next = [...prev.discussionPoints]
                  next[idx] = e.target.value
                  return { ...prev, discussionPoints: next }
                })
              }
            />
          </div>
        ))}
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part II: Performance Assessment</h3>
        <p className="text-sm text-gray-500">List objectives for the period and indicate status with comments.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Objective</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {form.objectives.map((item, index) => (
                <tr key={`objective-${index}`}>
                  <td className="p-2">
                    <Input
                      value={item.objective}
                      placeholder={`Objective ${index + 1}`}
                      onChange={(e) =>
                        setForm((prev) => {
                          const objectives = [...prev.objectives]
                          objectives[index] = { ...objectives[index], objective: e.target.value }
                          return { ...prev, objectives }
                        })
                      }
                    />
                  </td>
                  <td className="p-2 min-w-[180px]">
                    <Select
                      value={item.status}
                      onChange={(e) =>
                        setForm((prev) => {
                          const objectives = [...prev.objectives]
                          objectives[index] = { ...objectives[index], status: e.target.value }
                          return { ...prev, objectives }
                        })
                      }
                      options={[
                        { value: 'on_track', label: 'On Track' },
                        { value: 'delayed', label: 'Delayed' },
                        { value: 'achieved', label: 'Achieved' },
                        { value: 'partly_achieved', label: 'Partly Achieved' },
                        { value: 'not_achieved', label: 'Not Achieved' },
                      ]}
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.comments}
                      placeholder="Comments"
                      onChange={(e) =>
                        setForm((prev) => {
                          const objectives = [...prev.objectives]
                          objectives[index] = { ...objectives[index], comments: e.target.value }
                          return { ...prev, objectives }
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part II (continued): Work Areas Rating</h3>
        <p className="text-sm text-gray-500">Rate each area: Poor, Satisfactory, Good, or Excellent.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {WORK_RATING_AREAS.map((area) => (
            <div key={area} className="grid grid-cols-[1fr_180px] gap-3 items-center">
              <p className="text-sm text-gray-700">{area}</p>
              <Select
                value={form.workRatings[area] || 'good'}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    workRatings: { ...prev.workRatings, [area]: e.target.value },
                  }))
                }
                options={[
                  { value: 'poor', label: 'Poor' },
                  { value: 'satisfactory', label: 'Satisfactory' },
                  { value: 'good', label: 'Good' },
                  { value: 'excellent', label: 'Excellent' },
                ]}
              />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Problems faced and how they were resolved</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.problemsFaced}
              onChange={(e) => setForm((prev) => ({ ...prev, problemsFaced: e.target.value }))}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Feedback on supervisor role</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.supervisorFeedback}
              onChange={(e) => setForm((prev) => ({ ...prev, supervisorFeedback: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Overall Rating</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Overall Rating"
            value={form.overallRating}
            onChange={(e) => setForm((prev) => ({ ...prev, overallRating: e.target.value }))}
            options={[
              { value: 'poor', label: 'Poor' },
              { value: 'satisfactory', label: 'Satisfactory' },
              { value: 'good', label: 'Good' },
              { value: 'excellent', label: 'Excellent' },
            ]}
          />
          <Input label="Recommendation" value={form.recommendation} onChange={(e) => setForm((prev) => ({ ...prev, recommendation: e.target.value }))} />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part IV: Training and Staff Development</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Agreed development aims</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.trainingDevelopmentAims}
              onChange={(e) => setForm((prev) => ({ ...prev, trainingDevelopmentAims: e.target.value }))}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Training and development support to be provided</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.trainingSupport}
              onChange={(e) => setForm((prev) => ({ ...prev, trainingSupport: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part V: Performance Plan</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Objective</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">Criteria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {form.performancePlan.map((item, index) => (
                <tr key={`plan-${index}`}>
                  <td className="p-2">
                    <Input
                      value={item.objective}
                      onChange={(e) =>
                        setForm((prev) => {
                          const performancePlan = [...prev.performancePlan]
                          performancePlan[index] = { ...performancePlan[index], objective: e.target.value }
                          return { ...prev, performancePlan }
                        })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={item.criteria}
                      onChange={(e) =>
                        setForm((prev) => {
                          const performancePlan = [...prev.performancePlan]
                          performancePlan[index] = { ...performancePlan[index], criteria: e.target.value }
                          return { ...prev, performancePlan }
                        })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Part VI: Management Action</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Grade, recommendation, summary</p>
            <textarea
              rows={4}
              className={textAreaClassName}
              value={form.managementActionSummary}
              onChange={(e) => setForm((prev) => ({ ...prev, managementActionSummary: e.target.value }))}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Notes on copies, confidentiality, accessibility</p>
            <textarea
              rows={3}
              className={textAreaClassName}
              value={form.confidentialityNotes}
              onChange={(e) => setForm((prev) => ({ ...prev, confidentialityNotes: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h3 className="text-base font-semibold text-gray-900">Signatures</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Signed by Appraiser" value={form.appraiserSignature} onChange={(e) => setForm((prev) => ({ ...prev, appraiserSignature: e.target.value }))} />
          <Input label="Date" type="date" value={form.appraiserSignedDate} onChange={(e) => setForm((prev) => ({ ...prev, appraiserSignedDate: e.target.value }))} />
          <Input label="Signed by Appraisee" value={form.appraiseeSignature} onChange={(e) => setForm((prev) => ({ ...prev, appraiseeSignature: e.target.value }))} />
          <Input label="Date" type="date" value={form.appraiseeSignedDate} onChange={(e) => setForm((prev) => ({ ...prev, appraiseeSignedDate: e.target.value }))} />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Listing of Staff Performance Assessment</h3>
            <p className="text-sm text-gray-500 mt-1">Filename: [SURNAME]_[YEAR]_[MIDYEAR/YEAREND]</p>
          </div>
          <Badge variant="info">{listPreview.length} Saved</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Filename</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period Covered</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {listPreview.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">No appraisal forms saved yet.</td>
                </tr>
              ) : (
                listPreview.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-800">{entry.filename}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{entry.periodLabel}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{entry.displayDate}</td>
                    <td className="px-5 py-3">
                      <div className="space-y-1">
                        <Badge variant={statusVariantMap[entry.status]}>{statusLabelMap[entry.status]}</Badge>
                        {entry.status === 'returned' && entry.returnComment ? (
                          <p className="text-xs text-red-600">{entry.returnComment}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => loadEntry(entry)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => loadEntry(entry)}>View</Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadEntry(entry)}>
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
