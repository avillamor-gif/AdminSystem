'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle, XCircle, Clock, UserX,
  CalendarPlus, ClipboardList, AlertTriangle, Send, Star,
} from 'lucide-react'
import { Card, Button, Badge, Avatar } from '@/components/ui'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import {
  useTerminationRequest,
  useApproveTerminationRequest,
  useRejectTerminationRequest,
  useProcessTermination,
  useSubmitTerminationRequest,
} from '@/hooks/useTerminations'
import {
  useExitInterviewByTermination,
  useCreateExitInterview,
  useUpdateExitInterview,
  useCompleteExitInterview,
} from '@/hooks/useExitInterviews'
import { useCurrentEmployee, useEmployees } from '@/hooks/useEmployees'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-orange-100 text-orange-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-700',
  processed: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
}

const EI_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  no_show:   'bg-red-100 text-red-700',
  declined:  'bg-amber-100 text-amber-700',
}

function RatingStars({ value }: { value?: number }) {
  if (!value) return <span className="text-gray-400 text-sm">Not rated</span>
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
    </span>
  )
}

export default function TerminationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const terminationId = params.id as string

  const { data: termination, isLoading } = useTerminationRequest(terminationId)
  const { data: exitInterview } = useExitInterviewByTermination(terminationId)
  const { data: currentEmployee } = useCurrentEmployee()
  const { data: allEmployees = [] } = useEmployees({})

  const approveMutation   = useApproveTerminationRequest()
  const rejectMutation    = useRejectTerminationRequest()
  const processMutation   = useProcessTermination()
  const submitMutation    = useSubmitTerminationRequest()
  const createEI          = useCreateExitInterview()
  const updateEI          = useUpdateExitInterview()
  const completeEI        = useCompleteExitInterview()

  // UI state
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [showProcessConfirm, setShowProcessConfirm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showEIForm, setShowEIForm] = useState(false)
  const [eiForm, setEIForm] = useState({
    interview_date: '',
    interview_time: '',
    interviewer_id: '',
    interview_location: '',
    interview_method: 'in_person' as const,
  })
  // Exit interview answers form
  const [showAnswerForm, setShowAnswerForm] = useState(false)
  const [answerForm, setAnswerForm] = useState({
    reason_for_leaving: '',
    liked_most: '',
    liked_least: '',
    suggestions_for_improvement: '',
    relationship_with_manager_rating: 0,
    work_environment_rating: 0,
    compensation_rating: 0,
    career_growth_rating: 0,
    work_life_balance_rating: 0,
    overall_satisfaction_rating: 0,
    would_recommend_company: false,
    would_consider_returning: false,
    additional_comments: '',
    interviewer_notes: '',
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  if (!termination) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">Termination request not found</p>
      </div>
    )
  }

  const employee = termination.employee
  const status = termination.status ?? 'pending'
  const canSubmit  = status === 'pending'
  const canApprove = status === 'submitted' || status === 'pending'
  const canReject  = status === 'submitted' || status === 'pending' || status === 'approved'
  const canProcess = status === 'approved'
  const canScheduleEI = !!termination.id && !exitInterview
  const canCompleteEI = exitInterview && exitInterview.status === 'scheduled'

  const handleSubmit = async () => {
    if (!termination.id || !employee) return
    await submitMutation.mutateAsync({
      id: termination.id,
      employeeId: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
    })
  }

  const handleApprove = async () => {
    if (!termination.id || !currentEmployee) return
    await approveMutation.mutateAsync({ id: termination.id, approverId: currentEmployee.id })
    setShowApproveConfirm(false)
  }

  const handleReject = async () => {
    if (!termination.id || !currentEmployee || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    await rejectMutation.mutateAsync({ id: termination.id, approverId: currentEmployee.id, reason: rejectReason })
    setShowRejectConfirm(false)
    setRejectReason('')
  }

  const handleProcess = async () => {
    if (!termination.id) return
    await processMutation.mutateAsync({ id: termination.id })
    setShowProcessConfirm(false)
  }

  const handleScheduleEI = async () => {
    if (!eiForm.interview_date || !termination.id || !employee) {
      toast.error('Interview date is required')
      return
    }
    await createEI.mutateAsync({
      termination_request_id: termination.id,
      employee_id: employee.id,
      ...eiForm,
      status: 'scheduled',
    })
    setShowEIForm(false)
    setEIForm({ interview_date: '', interview_time: '', interviewer_id: '', interview_location: '', interview_method: 'in_person' })
  }

  const handleSaveAnswers = async () => {
    if (!exitInterview?.id || !employee) return
    await updateEI.mutateAsync({
      id: exitInterview.id,
      updates: answerForm,
      terminationRequestId: terminationId,
      employeeId: employee.id,
    })
    setShowAnswerForm(false)
  }

  const handleCompleteEI = async () => {
    if (!exitInterview?.id || !currentEmployee || !employee) return
    await completeEI.mutateAsync({
      id: exitInterview.id,
      completedBy: currentEmployee.id,
      terminationRequestId: terminationId,
      employeeId: employee.id,
    })
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Termination Request</h1>
            <p className="text-gray-500 text-sm mt-0.5">#{termination.request_number}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
          {status}
        </span>
      </div>

      {/* Employee */}
      {employee && (
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Avatar src={employee.avatar_url} firstName={employee.first_name} lastName={employee.last_name} size="lg" />
            <div>
              <p className="text-lg font-semibold text-gray-900">{employee.first_name} {employee.last_name}</p>
              <p className="text-sm text-gray-500">{employee.employee_id} · {employee.email}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Details + Process Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Termination Details</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Type</dt>
              <dd className="font-medium text-gray-900 capitalize">{termination.termination_type?.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt className="text-gray-500 mb-1">Reason</dt>
              <dd className="text-gray-900">{termination.termination_reason}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Proposed Last Day</dt>
              <dd className="font-medium text-gray-900">{termination.proposed_last_working_date ? new Date(termination.proposed_last_working_date).toLocaleDateString() : '—'}</dd>
            </div>
            {termination.actual_last_working_date && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Actual Last Day</dt>
                <dd className="font-medium text-gray-900">{new Date(termination.actual_last_working_date).toLocaleDateString()}</dd>
              </div>
            )}
            {termination.notice_period_days != null && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Notice Period</dt>
                <dd className="font-medium text-gray-900">{termination.notice_period_days} days</dd>
              </div>
            )}
            {termination.hr_notes && (
              <div>
                <dt className="text-gray-500 mb-1">HR Notes</dt>
                <dd className="text-gray-900 whitespace-pre-wrap">{termination.hr_notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Checklist</h3>
          <div className="space-y-3">
            {[
              { label: 'Exit Interview', done: !!exitInterview },
              { label: 'Asset Return', done: !!termination.asset_return_required },
              { label: 'Severance Applicable', done: !!termination.severance_applicable },
              { label: 'Employee Status Updated', done: status === 'processed' || status === 'completed' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                {item.done
                  ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  : <Clock className="w-5 h-5 text-gray-300 shrink-0" />}
                <span className={`text-sm ${item.done ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Actions</p>
            {canSubmit && (
              <Button className="w-full" onClick={handleSubmit} disabled={submitMutation.isPending}>
                <Send className="w-4 h-4 mr-2" />
                {submitMutation.isPending ? 'Submitting…' : 'Submit for Approval'}
              </Button>
            )}
            {canApprove && (
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowApproveConfirm(true)}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            )}
            {canReject && (
              <Button variant="secondary" className="w-full" onClick={() => setShowRejectConfirm(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            )}
            {canProcess && (
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowProcessConfirm(true)}>
                <UserX className="w-4 h-4 mr-2" />
                Process Termination
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Exit Interview Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Exit Interview</h3>
            {exitInterview && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${EI_STATUS_COLORS[exitInterview.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {exitInterview.status}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {canScheduleEI && (
              <Button size="sm" variant="secondary" onClick={() => setShowEIForm(v => !v)}>
                <CalendarPlus className="w-4 h-4 mr-1" />
                Schedule Interview
              </Button>
            )}
            {exitInterview && !showAnswerForm && (
              <Button size="sm" variant="secondary" onClick={() => {
                setAnswerForm(prev => ({ ...prev, ...(exitInterview as any) }))
                setShowAnswerForm(true)
              }}>
                <ClipboardList className="w-4 h-4 mr-1" />
                {exitInterview.reason_for_leaving ? 'Edit Answers' : 'Fill Questionnaire'}
              </Button>
            )}
            {canCompleteEI && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCompleteEI} disabled={completeEI.isPending}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Mark Completed
              </Button>
            )}
          </div>
        </div>

        {/* Schedule form */}
        {showEIForm && (
          <div className="mb-5 p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
            <p className="text-sm font-medium text-blue-900">Schedule Exit Interview</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 block mb-1">Date <span className="text-red-500">*</span></label>
                <input type="date" value={eiForm.interview_date} onChange={e => setEIForm(f => ({ ...f, interview_date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Time</label>
                <input type="time" value={eiForm.interview_time} onChange={e => setEIForm(f => ({ ...f, interview_time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Location</label>
                <input type="text" placeholder="e.g. HR Office, Zoom" value={eiForm.interview_location} onChange={e => setEIForm(f => ({ ...f, interview_location: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Method</label>
                <select value={eiForm.interview_method} onChange={e => setEIForm(f => ({ ...f, interview_method: e.target.value as any }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300">
                  <option value="in_person">In Person</option>
                  <option value="video">Video Call</option>
                  <option value="phone">Phone</option>
                  <option value="written">Written</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-600 block mb-1">Interviewer</label>
                <select value={eiForm.interviewer_id} onChange={e => setEIForm(f => ({ ...f, interviewer_id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300">
                  <option value="">Select Interviewer</option>
                  {(allEmployees as any[]).filter(e => e.status === 'active').map((e: any) => (
                    <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShowEIForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleScheduleEI} disabled={createEI.isPending}>
                {createEI.isPending ? 'Scheduling…' : 'Schedule'}
              </Button>
            </div>
          </div>
        )}

        {/* Existing exit interview info */}
        {exitInterview && !showAnswerForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-gray-500 text-xs">Date</p><p className="font-medium">{exitInterview.interview_date ? new Date(exitInterview.interview_date).toLocaleDateString() : '—'}</p></div>
              <div><p className="text-gray-500 text-xs">Time</p><p className="font-medium">{exitInterview.interview_time ?? '—'}</p></div>
              <div><p className="text-gray-500 text-xs">Method</p><p className="font-medium capitalize">{exitInterview.interview_method?.replace('_', ' ') ?? '—'}</p></div>
              <div><p className="text-gray-500 text-xs">Location</p><p className="font-medium">{exitInterview.interview_location ?? '—'}</p></div>
            </div>
            {exitInterview.reason_for_leaving && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Questionnaire Responses</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {exitInterview.reason_for_leaving && <div><p className="text-gray-500 text-xs mb-1">Reason for Leaving</p><p className="text-gray-900">{exitInterview.reason_for_leaving}</p></div>}
                  {exitInterview.liked_most && <div><p className="text-gray-500 text-xs mb-1">Liked Most</p><p className="text-gray-900">{exitInterview.liked_most}</p></div>}
                  {exitInterview.liked_least && <div><p className="text-gray-500 text-xs mb-1">Liked Least</p><p className="text-gray-900">{exitInterview.liked_least}</p></div>}
                  {exitInterview.suggestions_for_improvement && <div><p className="text-gray-500 text-xs mb-1">Suggestions</p><p className="text-gray-900">{exitInterview.suggestions_for_improvement}</p></div>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                  {[
                    { label: 'Manager Relationship', val: exitInterview.relationship_with_manager_rating },
                    { label: 'Work Environment', val: exitInterview.work_environment_rating },
                    { label: 'Compensation', val: exitInterview.compensation_rating },
                    { label: 'Career Growth', val: exitInterview.career_growth_rating },
                    { label: 'Work-Life Balance', val: exitInterview.work_life_balance_rating },
                    { label: 'Overall Satisfaction', val: exitInterview.overall_satisfaction_rating },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-gray-500 text-xs mb-1">{item.label}</p>
                      <RatingStars value={item.val} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-6 pt-2 text-sm">
                  <div><span className="text-gray-500">Would recommend: </span><span className="font-medium">{exitInterview.would_recommend_company ? 'Yes' : 'No'}</span></div>
                  <div><span className="text-gray-500">Open to return: </span><span className="font-medium">{exitInterview.would_consider_returning ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Answer form */}
        {showAnswerForm && exitInterview && (
          <div className="space-y-4 pt-2">
            <p className="text-sm font-medium text-gray-700">Exit Interview Questionnaire</p>
            {[
              { key: 'reason_for_leaving', label: 'Reason for Leaving', rows: 3 },
              { key: 'liked_most', label: 'What did you like most?', rows: 2 },
              { key: 'liked_least', label: 'What did you like least?', rows: 2 },
              { key: 'suggestions_for_improvement', label: 'Suggestions for Improvement', rows: 2 },
              { key: 'additional_comments', label: 'Additional Comments', rows: 2 },
              { key: 'interviewer_notes', label: 'Interviewer Notes', rows: 2 },
            ].map(field => (
              <div key={field.key}>
                <label className="text-xs text-gray-600 block mb-1">{field.label}</label>
                <textarea rows={field.rows} value={(answerForm as any)[field.key] ?? ''}
                  onChange={e => setAnswerForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            ))}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'relationship_with_manager_rating', label: 'Manager Relationship (1-5)' },
                { key: 'work_environment_rating', label: 'Work Environment (1-5)' },
                { key: 'compensation_rating', label: 'Compensation (1-5)' },
                { key: 'career_growth_rating', label: 'Career Growth (1-5)' },
                { key: 'work_life_balance_rating', label: 'Work-Life Balance (1-5)' },
                { key: 'overall_satisfaction_rating', label: 'Overall Satisfaction (1-5)' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-gray-600 block mb-1">{field.label}</label>
                  <select value={(answerForm as any)[field.key] ?? 0}
                    onChange={e => setAnswerForm(f => ({ ...f, [field.key]: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300">
                    <option value={0}>—</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={answerForm.would_recommend_company}
                  onChange={e => setAnswerForm(f => ({ ...f, would_recommend_company: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                Would recommend company
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={answerForm.would_consider_returning}
                  onChange={e => setAnswerForm(f => ({ ...f, would_consider_returning: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                Open to returning
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="secondary" onClick={() => setShowAnswerForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveAnswers} disabled={updateEI.isPending}>
                {updateEI.isPending ? 'Saving…' : 'Save Answers'}
              </Button>
            </div>
          </div>
        )}

        {!exitInterview && !showEIForm && (
          <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <CalendarPlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No exit interview scheduled yet</p>
          </div>
        )}
      </Card>

      {/* Approval/Rejection Info */}
      {(termination.approved_date || termination.rejection_reason) && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            {status === 'approved' || status === 'processed' ? 'Approval' : 'Rejection'} Information
          </h3>
          <dl className="space-y-2 text-sm">
            {termination.approved_date && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Date</dt>
                <dd className="font-medium">{new Date(termination.approved_date).toLocaleString()}</dd>
              </div>
            )}
            {termination.rejection_reason && (
              <div>
                <dt className="text-gray-500 mb-1">Reason</dt>
                <dd className="text-gray-900">{termination.rejection_reason}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleApprove}
        title="Approve Termination Request"
        message="Are you sure you want to approve this termination request? This will move it to the processing stage."
        confirmText="Approve"
        isLoading={approveMutation.isPending}
      />

      <ConfirmModal
        isOpen={showProcessConfirm}
        onClose={() => setShowProcessConfirm(false)}
        onConfirm={handleProcess}
        title="Process Termination"
        message="This will update the employee's status to TERMINATED and finalize the offboarding. This cannot be undone."
        confirmText="Process Termination"
        variant="danger"
        isLoading={processMutation.isPending}
      />

      {/* Reject modal with reason input */}
      {showRejectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reject Termination Request</h3>
                <p className="text-sm text-gray-500 mt-1">Please provide a reason for rejection.</p>
              </div>
            </div>
            <textarea
              rows={4}
              placeholder="Rejection reason (required)..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => { setShowRejectConfirm(false); setRejectReason('') }}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject} disabled={rejectMutation.isPending || !rejectReason.trim()}>
                {rejectMutation.isPending ? 'Rejecting…' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
