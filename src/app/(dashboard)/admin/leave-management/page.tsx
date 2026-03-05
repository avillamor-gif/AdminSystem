'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { useLeaveRequests, useAllocateLeaveBalance, type LeaveRequest } from '@/hooks/useLeaveRequests'
import { useLeaveTypes } from '@/hooks/useLeaveAbsence'
import { useEmployees } from '@/hooks/useEmployees'
import { Calendar, Users, Clock, CheckCircle, XCircle, Search, Plus } from 'lucide-react'
import { format } from 'date-fns'

export default function HRLeaveManagementPage() {
  const currentYear = new Date().getFullYear()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedLeaveType, setSelectedLeaveType] = useState('')
  const [allocationDays, setAllocationDays] = useState('')

  const { data: allRequests = [], isLoading } = useLeaveRequests()
  const { data: employees = [] } = useEmployees({ status: 'active' })
  const { data: leaveTypes = [] } = useLeaveTypes({ is_active: true })
  const allocateMutation = useAllocateLeaveBalance()

  const filteredRequests = useMemo(() => {
    return allRequests.filter(req => {
      const matchesSearch =
        searchTerm === '' ||
        req.employee?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employee?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.employee?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === '' || req.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [allRequests, searchTerm, statusFilter])

  const statistics = useMemo(() => {
    const total = allRequests.length
    const pending = allRequests.filter(r => r.status === 'pending').length
    const approved = allRequests.filter(r => r.status === 'approved').length
    const rejected = allRequests.filter(r => r.status === 'rejected').length
    
    const thisMonth = allRequests.filter(r => {
      const startDate = new Date(r.start_date)
      const now = new Date()
      return startDate.getMonth() === now.getMonth() && startDate.getFullYear() === now.getFullYear()
    }).length

    return { total, pending, approved, rejected, thisMonth }
  }, [allRequests])

  const handleAllocate = async () => {
    if (!selectedEmployee || !selectedLeaveType || !allocationDays) {
      alert('Please fill all fields')
      return
    }

    await allocateMutation.mutateAsync({
      employee_id: selectedEmployee,
      leave_type_id: selectedLeaveType,
      year: currentYear,
      days: parseFloat(allocationDays),
    })

    setShowAllocateModal(false)
    setSelectedEmployee('')
    setSelectedLeaveType('')
    setAllocationDays('')
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success'
      case 'rejected': return 'danger'
      case 'cancelled': return 'default'
      case 'escalated': return 'warning'
      default: return 'warning'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-gray-600 mt-1">Manage all employee leave requests and balances</p>
        </div>
        <Button onClick={() => setShowAllocateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Allocate Leave
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <Calendar className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{statistics.approved}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{statistics.rejected}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.thisMonth}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by employee name or ID..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            <option value="escalated">Escalated</option>
          </select>
        </div>
      </Card>

      {/* Leave Requests Table */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">All Leave Requests</h2>
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No leave requests found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Leave Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Start Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">End Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">
                          {request.employee?.first_name} {request.employee?.last_name}
                        </div>
                        <div className="text-sm text-gray-600">{request.employee?.employee_id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: request.leave_type?.color_code || '#6B7280' }}
                      >
                        {request.leave_type?.leave_type_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(request.start_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(request.end_date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{request.total_days}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Allocate Leave Balance Modal */}
      <Modal open={showAllocateModal} onClose={() => setShowAllocateModal(false)}>
        <ModalHeader onClose={() => setShowAllocateModal(false)}>
          Allocate Leave Balance
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.employee_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <select
                value={selectedLeaveType}
                onChange={e => setSelectedLeaveType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select leave type</option>
                {leaveTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.leave_type_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Days
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={allocationDays}
                onChange={e => setAllocationDays(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
              This will allocate leave balance for year {currentYear}. If a balance already exists,
              it will be updated.
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowAllocateModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAllocate}
            disabled={allocateMutation.isPending || !selectedEmployee || !selectedLeaveType || !allocationDays}
          >
            {allocateMutation.isPending ? 'Allocating...' : 'Allocate'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
