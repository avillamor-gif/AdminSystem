'use client'

import { useState, useMemo } from 'react'
import { ClipboardList, AlertCircle, CheckCircle2, Clock, Search, ChevronDown, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, Badge, Modal } from '@/components/ui'
import { ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useProbationaryReviews, useCompleteProbationaryReview, useUpdateProbationaryReview } from '@/hooks'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import type { ProbationaryReviewWithRelations, ProbationaryRecommendation } from '@/services'
import { formatDate } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   color: 'bg-yellow-100 text-yellow-800',  icon: <Clock className="w-3 h-3" /> },
  overdue:   { label: 'Overdue',   color: 'bg-red-100 text-red-800',        icon: <AlertCircle className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800',    icon: <CheckCircle2 className="w-3 h-3" /> },
  skipped:   { label: 'Skipped',   color: 'bg-gray-100 text-gray-600',      icon: null },
}

const REVIEW_TYPE_LABEL: Record<string, string> = {
  interim_3mo: '3-Month Interim',
  final_5mo:   '5-Month Final',
}

const RECOMMENDATION_META: Record<string, { label: string; color: string }> = {
  regularize:       { label: 'Regularize',       color: 'bg-green-100 text-green-800' },
  extend_probation: { label: 'Extend Probation', color: 'bg-blue-100 text-blue-800' },
  terminate:        { label: 'For Termination',  color: 'bg-red-100 text-red-800' },
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

// ── Complete Modal ────────────────────────────────────────────────────────────

interface CompleteModalProps {
  review: ProbationaryReviewWithRelations | null
  reviewerId: string
  onClose: () => void
}

function CompleteModal({ review, reviewerId, onClose }: CompleteModalProps) {
  const completeMutation = useCompleteProbationaryReview()
  const [recommendation, setRecommendation] = useState<ProbationaryRecommendation>('regularize')
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')

  if (!review) return null

  const empName = review.employee
    ? `${review.employee.first_name} ${review.employee.last_name}`
    : 'Employee'

  const handleSubmit = async () => {
    await completeMutation.mutateAsync({
      id: review.id,
      recommendation,
      reviewer_id: reviewerId,
      performance_score: score ? parseFloat(score) : null,
      notes: notes || null,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} size="md">
      <ModalHeader>
        Complete Probationary Review
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="font-medium text-gray-900">{empName}</div>
            <div className="text-gray-500">{REVIEW_TYPE_LABEL[review.review_type]} • Due {formatDate(review.due_date)}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation *</label>
            <select
              value={recommendation}
              onChange={e => setRecommendation(e.target.value as ProbationaryRecommendation)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="regularize">Regularize (pass probation)</option>
              <option value="extend_probation">Extend Probation</option>
              <option value="terminate">Recommend Termination</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Performance Score (1–5, optional)</label>
            <input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder="e.g. 3.5"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Feedback</label>
            <textarea
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Key observations, areas of improvement..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? 'Saving…' : 'Complete Review'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProbationaryReviewsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedReview, setSelectedReview] = useState<ProbationaryReviewWithRelations | null>(null)

  const { data: reviews = [], isLoading } = useProbationaryReviews()
  const { data: currentEmployee } = useCurrentEmployee()
  const skipMutation = useUpdateProbationaryReview()

  // Summary stats
  const stats = useMemo(() => ({
    total:     reviews.length,
    pending:   reviews.filter(r => r.status === 'pending').length,
    overdue:   reviews.filter(r => r.status === 'overdue').length,
    completed: reviews.filter(r => r.status === 'completed').length,
    dueSoon:   reviews.filter(r => r.status === 'pending' && daysUntil(r.due_date) <= 7).length,
  }), [reviews])

  const filtered = useMemo(() => {
    return reviews.filter(r => {
      const name = r.employee ? `${r.employee.first_name} ${r.employee.last_name}`.toLowerCase() : ''
      const matchSearch = !search || name.includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || r.status === statusFilter
      const matchType   = typeFilter   === 'all' || r.review_type === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [reviews, search, statusFilter, typeFilter])

  const handleSkip = async (review: ProbationaryReviewWithRelations) => {
    if (!confirm(`Mark this review as skipped for ${review.employee?.first_name} ${review.employee?.last_name}?`)) return
    await skipMutation.mutateAsync({ id: review.id, updates: { status: 'skipped' } })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Probationary Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track 3-month interim and 5-month final reviews for probationary employees (6-month probation period)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: stats.total, color: 'text-gray-900' },
          { label: 'Pending', value: stats.pending, color: 'text-yellow-700' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-700' },
          { label: 'Due in 7 Days', value: stats.dueSoon, color: 'text-orange-700' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
          <option value="skipped">Skipped</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="interim_3mo">3-Month Interim</option>
          <option value="final_5mo">5-Month Final</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center text-gray-400">Loading reviews…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {reviews.length === 0
                  ? 'No probationary reviews found. Reviews are auto-created when employees with Probationary employment type are hired.'
                  : 'No reviews match the current filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Review Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Due Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Recommendation</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(review => {
                    const emp = review.employee
                    const statusMeta = STATUS_META[review.status] || STATUS_META.pending
                    const days = daysUntil(review.due_date)
                    const isActionable = review.status === 'pending' || review.status === 'overdue'

                    return (
                      <tr
                        key={review.id}
                        className={`hover:bg-gray-50 transition-colors ${review.status === 'overdue' ? 'bg-red-50/30' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={emp?.avatar_url}
                              firstName={emp?.first_name ?? '?'}
                              lastName={emp?.last_name ?? ''}
                              size="sm"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {emp ? `${emp.first_name} ${emp.last_name}` : '—'}
                              </div>
                              {emp?.hire_date && (
                                <div className="text-xs text-gray-400">Hired {formatDate(emp.hire_date)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {REVIEW_TYPE_LABEL[review.review_type]}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-900">{formatDate(review.due_date)}</div>
                          {isActionable && (
                            <div className={`text-xs mt-0.5 ${days < 0 ? 'text-red-600' : days <= 7 ? 'text-orange-600' : 'text-gray-400'}`}>
                              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d remaining`}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.color}`}>
                            {statusMeta.icon}
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {review.recommendation ? (
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${RECOMMENDATION_META[review.recommendation]?.color}`}>
                              {RECOMMENDATION_META[review.recommendation]?.label}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {review.performance_score != null ? review.performance_score.toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isActionable ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="primary"
                                onClick={() => setSelectedReview(review)}
                                className="text-xs px-3 py-1"
                              >
                                Complete
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleSkip(review)}
                                className="text-xs px-2 py-1 text-gray-400"
                              >
                                Skip
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {review.completed_at ? formatDate(review.completed_at) : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Modal */}
      <CompleteModal
        review={selectedReview}
        reviewerId={currentEmployee?.id ?? ''}
        onClose={() => setSelectedReview(null)}
      />
    </div>
  )
}
