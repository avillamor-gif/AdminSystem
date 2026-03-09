'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import {
  useLeaveRequests,
  useCreateLeaveRequest,
  useCancelLeaveRequest,
  useLeaveBalances,
  type LeaveRequest,
} from '@/hooks/useLeaveRequests'
import { useLeaveTypes } from '@/hooks/useLeaveAbsence'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { Plus, Calendar, Clock, XCircle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

const leaveRequestSchema = z.object({
  leave_type_id: z.string().min(1, 'Leave type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
})

type LeaveRequestForm = z.infer<typeof leaveRequestSchema>

export default function MyLeavePage() {
  const currentYear = new Date().getFullYear()
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: currentEmployee } = useCurrentEmployee()
  const { data: leaveRequests = [], isLoading } = useLeaveRequests({
    employee_id: currentEmployee?.id,
  })
  const { data: leaveTypes = [] } = useLeaveTypes({ is_active: true })
  const { data: balances = [] } = useLeaveBalances(currentEmployee?.id || '', currentYear)
  const createMutation = useCreateLeaveRequest()
  const cancelMutation = useCancelLeaveRequest()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema),
  })

  const startDate = watch('start_date')
  const endDate = watch('end_date')
  const selectedLeaveType = watch('leave_type_id')

  const totalDays = useMemo(() => {
    if (startDate && endDate) {
      const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1
      return days > 0 ? days : 0
    }
    return 0
  }, [startDate, endDate])

  const selectedBalance = useMemo(() => {
    return balances.find(b => b.leave_type_id === selectedLeaveType)
  }, [balances, selectedLeaveType])

  const filteredRequests = useMemo(() => {
    if (!statusFilter) return leaveRequests
    return leaveRequests.filter(req => req.status === statusFilter)
  }, [leaveRequests, statusFilter])

  const statistics = useMemo(() => {
    const pending = leaveRequests.filter(r => r.status === 'pending').length
    const approved = leaveRequests.filter(r => r.status === 'approved').length
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length
    return { total: leaveRequests.length, pending, approved, rejected }
  }, [leaveRequests])

  const handleOpenModal = () => {
    reset()
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    reset()
  }

  const onSubmit = async (data: LeaveRequestForm) => {
    if (!currentEmployee?.id) {
      return
    }

    await createMutation.mutateAsync({
      employee_id: currentEmployee.id,
      leave_type_id: data.leave_type_id,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: totalDays,
      reason: data.reason,
      status: 'pending',
    } as any)
    handleCloseModal()
  }

  const handleCancel = async (id: string) => {
    if (!currentEmployee?.id) return
    if (confirm('Are you sure you want to cancel this leave request?')) {
      await cancelMutation.mutateAsync({ id, cancelled_by: currentEmployee.id })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'rejected':
        return 'danger'
      case 'cancelled':
        return 'default'
      case 'escalated':
        return 'warning'
      default:
        return 'warning'
    }
  }

  if (!currentEmployee) {
    return <div className="p-6">Loading employee data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="text-gray-600 mt-1">Submit and manage your leave applications</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Requests</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{statistics.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statistics.approved}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{statistics.rejected}</p>
        </Card>
      </div>

      {/* Leave Balances */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Leave Balances ({currentYear})</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {balances.filter(b => (b.total_allocated ?? 0) > 0).map(balance => (
            <div key={balance.id} className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{balance.leave_type?.leave_type_name}</span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: balance.leave_type?.color_code }}
                />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Allocated:</span>
                  <span className="font-medium">{balance.total_allocated} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Used:</span>
                  <span className="font-medium">{balance.used_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending:</span>
                  <span className="font-medium">{balance.pending_days} days</span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-bold text-green-600">{balance.available_days} days</span>
                </div>
              </div>
            </div>
          ))}
          {balances.filter(b => (b.total_allocated ?? 0) > 0).length === 0 && (
            <div className="col-span-3 text-center py-4 text-gray-500">
              No leave balances allocated yet
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </Card>

      {/* Leave Requests List */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">My Requests</h2>
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No leave requests found</div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => (
              <div key={request.id} className="border rounded p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: request.leave_type?.color_code }}
                      />
                      <span className="font-semibold">{request.leave_type?.leave_type_name}</span>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Start Date:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(request.start_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">End Date:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(request.end_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-2 font-medium">{request.total_days} days</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Requested:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    {request.reason && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Reason:</span>
                        <p className="text-gray-800 mt-1">{request.reason}</p>
                      </div>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(request.id)}
                      className="text-red-600"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Leave Request Modal */}
      <Modal open={showModal} onClose={handleCloseModal}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <ModalHeader onClose={handleCloseModal}>Request Leave</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee Name</label>
                <input
                  type="text"
                  value={currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name}` : '—'}
                  disabled
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
              {leaveTypes.filter(lt => lt.is_active).length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-amber-800 mb-1">No Leave Types Available</p>
                  <p className="text-amber-700">
                    No active leave types are configured. Please contact HR.
                  </p>
                </div>
              ) : (
                <Select
                  label="Leave Type"
                  {...register('leave_type_id')}
                  error={errors.leave_type_id?.message}
                  required
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.filter(lt => lt.is_active).map(type => {
                    const bal = balances.find(b => b.leave_type_id === type.id)
                    return (
                      <option key={type.id} value={type.id}>
                        {type.leave_type_name}{bal ? ` (${bal.available_days} days available)` : ''}
                      </option>
                    )
                  })}
                </Select>
              )}

              {selectedBalance && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <div className="font-medium text-blue-900 mb-1">Available Balance</div>
                  <div className="text-blue-700">
                    {selectedBalance.available_days} days available out of{' '}
                    {selectedBalance.total_allocated} allocated
                  </div>
                </div>
              )}

              <Input
                type="date"
                label="Start Date"
                {...register('start_date')}
                error={errors.start_date?.message}
                required
              />

              <Input
                type="date"
                label="End Date"
                {...register('end_date')}
                error={errors.end_date?.message}
                required
              />

              {totalDays > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3">
                  <div className="text-sm text-gray-600">Total Days Requested</div>
                  <div className="text-2xl font-bold text-gray-900">{totalDays} days</div>
                  {selectedBalance && totalDays > selectedBalance.available_days && (
                    <div className="text-red-600 text-sm mt-1">
                      ⚠️ Insufficient balance (need {totalDays}, have {selectedBalance.available_days})
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  {...register('reason')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide reason for leave..."
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                allocatedLeaveTypes.length === 0 ||
                (selectedBalance !== undefined && totalDays > selectedBalance.available_days) ||
                (selectedLeaveType !== '' && selectedBalance === undefined)
              }
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
