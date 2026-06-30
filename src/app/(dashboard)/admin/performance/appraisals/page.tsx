'use client'

import { useMemo, useState } from 'react'
import { Card, Button, Badge, Select, Modal } from '@/components/ui'
import { ModalBody, ModalFooter, ModalHeader } from '@/components/ui/Modal'
import { useAdminPerformanceAppraisals, useUpdateAdminPerformanceAppraisal, useEmployees } from '@/hooks'

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'in_review', label: 'In Review' },
  { value: 'returned', label: 'Returned' },
  { value: 'completed', label: 'Completed' },
]

const periodOptions = [
  { value: 'all', label: 'All Periods' },
  { value: 'midyear', label: 'Midyear' },
  { value: 'yearend', label: 'Yearend' },
]

const statusVariantMap: Record<string, 'default' | 'warning' | 'success' | 'info' | 'danger'> = {
  draft: 'default',
  pending_review: 'warning',
  in_review: 'info',
  returned: 'danger',
  completed: 'success',
}

const statusLabelMap: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  in_review: 'In Review',
  returned: 'Returned',
  completed: 'Completed',
}

export default function AdminPerformanceAppraisalsPage() {
  const [status, setStatus] = useState('all')
  const [period, setPeriod] = useState('all')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [returningEntryId, setReturningEntryId] = useState<string | null>(null)
  const [returnComment, setReturnComment] = useState('')

  const { data: appraisals = [], isLoading } = useAdminPerformanceAppraisals({ status, period, year })
  const { data: employees = [] } = useEmployees({})
  const updateMutation = useUpdateAdminPerformanceAppraisal()

  const stats = useMemo(() => ({
    total: appraisals.length,
    pending: appraisals.filter((a) => a.status === 'pending_review').length,
    returned: appraisals.filter((a) => a.status === 'returned').length,
    completed: appraisals.filter((a) => a.status === 'completed').length,
  }), [appraisals])

  const setStatusFor = async (id: string, nextStatus: string) => {
    await updateMutation.mutateAsync({ id, updates: { status: nextStatus } })
  }

  const appraiserOptions = useMemo(
    () => [
      { value: '', label: 'Unassigned' },
      ...employees.map((employee: any) => ({
        value: employee.id,
        label: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.email || 'Unnamed',
      })),
    ],
    [employees]
  )

  const openReturnModal = (id: string) => {
    setReturningEntryId(id)
    setReturnComment('')
  }

  const submitReturnWithComment = async () => {
    if (!returningEntryId) return

    const entry = appraisals.find((item) => item.id === returningEntryId)
    if (!entry) return

    await updateMutation.mutateAsync({
      id: entry.id,
      updates: {
        status: 'returned',
        form_data: {
          ...(entry.form_data || {}),
          admin_return_comment: returnComment,
          returned_at: new Date().toISOString(),
        },
      },
    })

    setReturningEntryId(null)
    setReturnComment('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appraisal Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage submitted staff performance appraisals, update workflow status, and track completion.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Pending Review</p>
          <p className="text-2xl font-semibold text-orange">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Returned</p>
          <p className="text-2xl font-semibold text-red-600">{stats.returned}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Completed</p>
          <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={statusOptions} />
          <Select label="Period" value={period} onChange={(e) => setPeriod(e.target.value)} options={periodOptions} />
          <Select
            label="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={[
              { value: String(new Date().getFullYear() - 1), label: String(new Date().getFullYear() - 1) },
              { value: String(new Date().getFullYear()), label: String(new Date().getFullYear()) },
              { value: String(new Date().getFullYear() + 1), label: String(new Date().getFullYear() + 1) },
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Filename</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Staff</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Appraiser</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">Loading appraisals...</td>
                </tr>
              ) : appraisals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-500">No appraisal submissions found.</td>
                </tr>
              ) : (
                appraisals.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm text-gray-800">{entry.filename}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">
                      {entry.appraisee ? `${entry.appraisee.first_name} ${entry.appraisee.last_name}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{entry.period_covered === 'yearend' ? 'Yearend' : 'Midyear'}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 min-w-[220px]">
                      <Select
                        value={entry.appraiser_employee_id || ''}
                        onChange={async (e) => {
                          await updateMutation.mutateAsync({
                            id: entry.id,
                            updates: { appraiser_employee_id: e.target.value || null },
                          })
                        }}
                        options={appraiserOptions}
                      />
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{new Date(entry.updated_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="space-y-1">
                        <Badge variant={statusVariantMap[entry.status] || 'default'}>{statusLabelMap[entry.status] || entry.status}</Badge>
                        {entry.status === 'returned' && entry.form_data?.admin_return_comment ? (
                          <p className="text-xs text-red-600">{entry.form_data.admin_return_comment}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setStatusFor(entry.id, 'in_review')}>In Review</Button>
                        <Button variant="ghost" size="sm" onClick={() => openReturnModal(entry.id)}>Return</Button>
                        <Button variant="ghost" size="sm" onClick={() => setStatusFor(entry.id, 'completed')}>Complete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!returningEntryId} onClose={() => setReturningEntryId(null)} size="md" centered>
        <ModalHeader onClose={() => setReturningEntryId(null)}>Return Appraisal</ModalHeader>
        <ModalBody>
          <label className="block text-sm font-medium text-gray-700 mb-2">Reason for return</label>
          <textarea
            rows={4}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="Add clear revision notes for the staff member"
            value={returnComment}
            onChange={(e) => setReturnComment(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setReturningEntryId(null)}>Cancel</Button>
          <Button onClick={submitReturnWithComment} disabled={updateMutation.isPending}>Return with Comment</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
