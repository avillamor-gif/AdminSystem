'use client'

import { useEffect, useState } from 'react'
import { GraduationCap, Clock, Award, CheckCircle, AlertCircle, Building2, User, Calendar } from 'lucide-react'
import { Card } from '@/components/ui'
import { useCurrentEmployee } from '@/hooks'
import { useProgramEnrollments, useMarkCertificateIssued } from '@/hooks/useInternship'
import { formatDate } from '@/lib/utils'
import type { ProgramEnrollmentWithRelations } from '@/services/internship.service'

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
  const pct = e.required_hours > 0
    ? Math.min(100, Math.round((Number(e.rendered_hours) / e.required_hours) * 100))
    : 0

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
            {Number(e.rendered_hours).toFixed(1)}h / {e.required_hours}h
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
            <CheckCircle className="w-3.5 h-3.5" /> Required hours completed!
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
    </Card>
  )
}
