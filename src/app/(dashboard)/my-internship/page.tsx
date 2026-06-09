'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Clock, Award, CheckCircle, AlertCircle, Building2, User, Calendar, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { useCurrentEmployee } from '@/hooks'
import { useProgramEnrollments, useMarkCertificateIssued, useInternshipAssessmentByEnrollment, useSubmitAssessmentPart1 } from '@/hooks/useInternship'
import { formatDate } from '@/lib/utils'
import type { ProgramEnrollmentWithRelations, InternshipAssessmentPart1Update } from '@/services/internship.service'

function progressColor(pct: number) {
  if (pct >= 100) return 'bg-green-500'
  if (pct >= 75)  return 'bg-blue-500'
  if (pct >= 40)  return 'bg-orange-400'
  return 'bg-red-400'
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  extended:  'bg-purple-100 text-purple-800',
  pending:   'bg-yellow-100 text-yellow-800',
  dropped:   'bg-red-100 text-red-800',
}

const PROGRAM_LABELS: Record<string, string> = {
  internship:    'Internship Program',
  ojt:           'On-the-Job Training (OJT)',
  volunteer:     'Volunteer Program',
  practicum:     'Practicum Program',
  apprenticeship:'Apprenticeship Program',
}

export default function MyInternshipPage() {
  const { data: currentEmployee } = useCurrentEmployee()
  const { data: allEnrollments = [], isLoading } = useProgramEnrollments()

  // Filter to only this employee's enrollments
  const enrollments = allEnrollments.filter(
    e => e.employee_id === currentEmployee?.id
  )

  const active    = enrollments.find(e => e.status === 'active' || e.status === 'extended')
  const completed = enrollments.filter(e => e.status === 'completed')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Internship</h1>
          <p className="text-gray-600 mt-1">Your internship/volunteer enrollment details</p>
        </div>
        <Card className="p-12 text-center">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No enrollment found</p>
          <p className="text-gray-400 text-sm mt-1">Contact your HR administrator if you believe this is an error.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Internship</h1>
        <p className="text-gray-600 mt-1">Your internship/volunteer enrollment details</p>
      </div>

      {/* Active enrollment */}
      {active && <EnrollmentCard enrollment={active} isActive />}

      {/* Completed enrollments */}
      {completed.map(e => <EnrollmentCard key={e.id} enrollment={e} />)}
    </div>
  )
}

function EnrollmentCard({ enrollment: e, isActive }: { enrollment: ProgramEnrollmentWithRelations; isActive?: boolean }) {
  // Calculate expected hours based on elapsed time
  const startDate = new Date(e.start_date)
  const endDate = e.end_date ? new Date(e.end_date) : null
  const now = new Date()
  
  let pct = 0
  let expectedHours = e.required_hours
  
  if (endDate) {
    // Total duration in days
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000)
    
    // Elapsed days since start (clamped to 0 at minimum, totalDays at maximum)
    const elapsedDays = Math.max(
      0,
      Math.min(totalDays, Math.ceil((now.getTime() - startDate.getTime()) / 86_400_000))
    )
    
    if (totalDays > 0) {
      // Expected hours to date: (required_hours / total_days) * elapsed_days
      expectedHours = Math.round((e.required_hours / totalDays) * elapsedDays * 100) / 100
      
      // Progress: actual_hours vs expected_hours (with zero-division guard)
      if (expectedHours > 0) {
        pct = Math.min(100, Math.round((Number(e.rendered_hours) / expectedHours) * 100))
      } else {
        pct = 0
      }
    } else {
      pct = 0
      expectedHours = e.required_hours
    }
  } else {
    // No end date: use simple ratio
    pct = e.required_hours > 0
      ? Math.min(100, Math.round((Number(e.rendered_hours) / e.required_hours) * 100))
      : 0
  }

  const daysLeft = e.end_date
    ? Math.ceil((new Date(e.end_date).getTime() - Date.now()) / 86_400_000)
    : null

  return (
    <Card className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 rounded-xl">
            <GraduationCap className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{PROGRAM_LABELS[e.program_type] ?? e.program_type}</h2>
            {e.partner_institution && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5" />
                {e.partner_institution.name}
              </p>
            )}
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[e.status] ?? 'bg-gray-100 text-gray-700'}`}>
          {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
        </span>
      </div>

      {/* Hours progress */}
      <div>
        <div className="flex justify-between text-sm text-gray-700 mb-2">
          <span className="font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            Hours Progress
          </span>
          <span className="font-semibold">
            {Number(e.rendered_hours).toFixed(1)}h / {expectedHours.toFixed(1)}h
            <span className="text-gray-400 font-normal ml-1">({pct}%)</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${progressColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct >= 100 && (
          <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> On track or ahead of schedule!
          </p>
        )}
        {isActive && daysLeft !== null && daysLeft <= 14 && pct < 80 && (
          <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Only {daysLeft} day{daysLeft !== 1 ? 's' : ''} left — you may be at risk. Talk to your supervisor.
          </p>
        )}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Start Date</p>
          <p className="text-gray-800 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {formatDate(e.start_date)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">End Date</p>
          <p className="text-gray-800 font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {e.end_date ? formatDate(e.end_date) : 'Ongoing'}
            {isActive && daysLeft !== null && daysLeft >= 0 && (
              <span className="text-xs text-gray-400">({daysLeft}d left)</span>
            )}
          </p>
        </div>
        {e.department && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Department</p>
            <p className="text-gray-800 font-medium">{e.department.name}</p>
          </div>
        )}
        {e.supervisor && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Supervisor</p>
            <p className="text-gray-800 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              {e.supervisor.first_name} {e.supervisor.last_name}
            </p>
          </div>
        )}
        {e.school_coordinator && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">School Coordinator</p>
            <p className="text-gray-800 font-medium">{e.school_coordinator}</p>
          </div>
        )}
      </div>

      {/* Certificate */}
      <div className={`flex items-center gap-3 rounded-xl p-4 ${e.certificate_issued ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
        <Award className={`w-6 h-6 shrink-0 ${e.certificate_issued ? 'text-green-600' : 'text-gray-400'}`} />
        <div className="flex-1">
          <p className={`font-semibold text-sm ${e.certificate_issued ? 'text-green-800' : 'text-gray-600'}`}>
            {e.certificate_issued ? 'Certificate Issued' : 'Certificate Pending'}
          </p>
          {e.certificate_issued && e.certificate_issued_at && (
            <p className="text-xs text-green-600 mt-0.5">
              Issued on {formatDate(e.certificate_issued_at)}
            </p>
          )}
          {!e.certificate_issued && (
            <p className="text-xs text-gray-500 mt-0.5">
              Certificate will be issued upon completion. Contact HR for details.
            </p>
          )}
        </div>
      </div>

      {/* Notes */}
      {e.notes && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-500 uppercase tracking-wide mb-1 font-medium">Notes from HR</p>
          <p className="text-sm text-blue-800">{e.notes}</p>
        </div>
      )}

      {/* Assessment */}
      <AssessmentSection enrollmentId={e.id} />
    </Card>
  )
}

// ─── Rating scale legend ──────────────────────────────────────────────────────

const RATING_OPTIONS = [
  { value: 1, label: '1 — Needs more training' },
  { value: 2, label: '2 — Below expectations' },
  { value: 3, label: '3 — Acceptable' },
  { value: 4, label: '4 — Above average' },
  { value: 5, label: '5 — Superior' },
  { value: 6, label: '6 — Not observed' },
]

const GENERAL_ITEMS = [
  { key: 'r_attendance',           label: 'Attendance' },
  { key: 'r_punctuality',          label: 'Punctuality' },
  { key: 'r_appropriate_dress',    label: 'Appropriate dress' },
  { key: 'r_attitude',             label: 'Attitude' },
  { key: 'r_acceptance_criticism', label: 'Acceptance of criticism' },
  { key: 'r_asks_questions',       label: 'Asks appropriate questions' },
  { key: 'r_self_motivated',       label: 'Self-motivated' },
  { key: 'r_ethical_behaviour',    label: 'Practices ethical behaviour' },
]

const JOB_ITEMS = [
  { key: 'r_job_knowledge',         label: 'Sufficient knowledge to perform tasks' },
  { key: 'r_verbal_communication',  label: 'Verbal communication skills' },
  { key: 'r_written_communication', label: 'Written communication skills' },
  { key: 'r_analytical_skills',     label: 'Analytical skills – analyses problems and takes appropriate action' },
  { key: 'r_technical_skills',      label: 'Uses technical skills required for the position' },
  { key: 'r_meets_deadlines',       label: 'Meets deadlines' },
  { key: 'r_takes_initiative',      label: 'Takes initiative to get the job done, including overcoming obstacles' },
  { key: 'r_sets_priorities',       label: 'Sets priorities' },
]

const OVERALL_OPTIONS = [
  { value: 'outstanding',    label: 'Outstanding' },
  { value: 'above_average',  label: 'Above Average' },
  { value: 'satisfactory',   label: 'Satisfactory' },
  { value: 'below_average',  label: 'Below Average' },
  { value: 'unsatisfactory', label: 'Unsatisfactory' },
]

// ─── Self-service Part I form ─────────────────────────────────────────────────

function RatingGroup({ label, fieldKey, value, onChange, disabled }: {
  label: string
  fieldKey: string
  value: number | null | undefined
  onChange: (key: string, val: number) => void
  disabled?: boolean
}) {
  return (
    <div className="py-2 border-b last:border-0">
      <p className="text-sm text-gray-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {RATING_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(fieldKey, opt.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              value === opt.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {opt.value}
          </button>
        ))}
        {value && (
          <span className="text-xs text-gray-400 self-center ml-1">
            {RATING_OPTIONS.find(o => o.value === value)?.label.split('— ')[1]}
          </span>
        )}
      </div>
    </div>
  )
}

function AssessmentSection({ enrollmentId }: { enrollmentId: string }) {
  const { data: assessment, isLoading } = useInternshipAssessmentByEnrollment(enrollmentId)
  const submitPart1 = useSubmitAssessmentPart1()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Partial<InternshipAssessmentPart1Update>>({})
  const [initialized, setInitialized] = useState(false)

  // Pre-fill form from existing data
  useEffect(() => {
    if (assessment && !initialized) {
      const keys = [
        'r_attendance','r_punctuality','r_appropriate_dress','r_attitude',
        'r_acceptance_criticism','r_asks_questions','r_self_motivated','r_ethical_behaviour',
        'r_job_knowledge','r_verbal_communication','r_written_communication','r_analytical_skills',
        'r_technical_skills','r_meets_deadlines','r_takes_initiative','r_sets_priorities',
        'strengths_weaknesses','important_achievements','most_difficult','likes_dislikes',
        'overall_performance','intern_other_comments',
      ] as const
      const prefilled: Record<string, unknown> = {}
      keys.forEach(k => { prefilled[k] = (assessment as any)[k] ?? null })
      setForm(prefilled as Partial<InternshipAssessmentPart1Update>)
      setInitialized(true)
    }
  }, [assessment, initialized])

  function handleRating(key: string, val: number) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function handleText(e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!assessment) return
    await submitPart1.mutateAsync({ id: assessment.id, data: form as InternshipAssessmentPart1Update })
    setOpen(false)
  }

  if (isLoading) return null
  if (!assessment) return null // No form created by admin yet

  const alreadySubmitted = assessment.status === 'part1_complete' || assessment.status === 'complete'
  const disabled = alreadySubmitted

  return (
    <div className="border border-orange-200 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 hover:bg-orange-100 text-sm font-semibold text-orange-800"
        onClick={() => setOpen(v => !v)}
      >
        <span className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4" />
          Intern Assessment Form — Part I
          {alreadySubmitted && (
            <span className="ml-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Submitted
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="p-5 space-y-6 text-sm">
          {alreadySubmitted && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              You have already submitted Part I. Your supervisor will complete Part II.
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-3">
              Use the scale below: <strong>1</strong> Needs more training · <strong>2</strong> Below expectations ·{' '}
              <strong>3</strong> Acceptable · <strong>4</strong> Above average · <strong>5</strong> Superior ·{' '}
              <strong>6</strong> Not observed
            </p>

            <h4 className="font-semibold text-gray-800 mb-2">1. General Workplace Performance</h4>
            {GENERAL_ITEMS.map(({ key, label }) => (
              <RatingGroup key={key} label={label} fieldKey={key} value={(form as any)[key]} onChange={handleRating} disabled={disabled} />
            ))}

            <h4 className="font-semibold text-gray-800 mt-5 mb-2">2. Specific Job Assignment Performance</h4>
            {JOB_ITEMS.map(({ key, label }) => (
              <RatingGroup key={key} label={label} fieldKey={key} value={(form as any)[key]} onChange={handleRating} disabled={disabled} />
            ))}
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Self-Assessment Questions</h4>
            {[
              { name: 'strengths_weaknesses',    label: 'Based on this assessment, what are your strengths and weaknesses?' },
              { name: 'important_achievements',  label: 'What are your most important achievements during the internship?' },
              { name: 'most_difficult',          label: 'What elements of your internship do you find most difficult?' },
              { name: 'likes_dislikes',          label: 'What do you like and dislike about the organization?' },
            ].map(({ name, label }) => (
              <div key={name} className="mb-4">
                <label className="block text-sm text-gray-700 mb-1">{label}</label>
                <textarea
                  name={name}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none disabled:bg-gray-50"
                  value={(form as any)[name] ?? ''}
                  onChange={handleText}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Overall Performance Agreement</label>
            <div className="flex flex-wrap gap-3">
              {OVERALL_OPTIONS.map(opt => (
                <label key={opt.value} className={`flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <input
                    type="radio"
                    name="overall_performance"
                    value={opt.value}
                    checked={(form as any).overall_performance === opt.value}
                    onChange={handleText}
                    disabled={disabled}
                    className="text-orange-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Other comments & suggestions</label>
            <textarea
              name="intern_other_comments"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none disabled:bg-gray-50"
              value={(form as any).intern_other_comments ?? ''}
              onChange={handleText}
              disabled={disabled}
            />
          </div>

          {!disabled && (
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={submitPart1.isPending}>
                {submitPart1.isPending ? 'Submitting…' : 'Submit Part I'}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}
