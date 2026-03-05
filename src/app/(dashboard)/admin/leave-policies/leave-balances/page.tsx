'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import {
  useAllLeaveBalances,
  useAllocateLeaveBalance,
  useBulkInitializeLeaveBalances,
} from '@/hooks/useLeaveRequests'
import { useLeaveTypes } from '@/hooks/useLeaveAbsence'
import { useEmployees } from '@/hooks/useEmployees'
import { Plus, Search, Wallet, RefreshCw, Pencil, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LeaveBalancesPage() {
  const currentYear = new Date().getFullYear()
  const [yearFilter, setYearFilter] = useState(currentYear)
  const [searchTerm, setSearchTerm] = useState('')

  // Allocate modal state
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedLeaveType, setSelectedLeaveType] = useState('')
  const [allocationDays, setAllocationDays] = useState('')

  // Bulk initialize modal state
  const [showInitModal, setShowInitModal] = useState(false)
  const [defaultDays, setDefaultDays] = useState<Record<string, string>>({})

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingDays, setEditingDays] = useState('')

  const { data: balances = [], isLoading } = useAllLeaveBalances(yearFilter)
  const { data: employees = [] } = useEmployees({ status: 'active' })
  const { data: leaveTypes = [] } = useLeaveTypes({ is_active: true })
  const allocateMutation = useAllocateLeaveBalance()
  const bulkInitMutation = useBulkInitializeLeaveBalances()

  // Build a lookup: employee_id → employee object
  const empMap = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees]
  )

  const filtered = useMemo(() => {
    return balances.filter((b) => {
      // Hide rows with zero allocation and no activity
      if ((b.total_allocated ?? 0) === 0 && (b.used_days ?? 0) === 0 && (b.pending_days ?? 0) === 0) return false
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      const emp = empMap[b.employee_id]
      const lt = (b as any).leave_type
      return (
        emp?.first_name?.toLowerCase().includes(q) ||
        emp?.last_name?.toLowerCase().includes(q) ||
        emp?.employee_id?.toLowerCase().includes(q) ||
        lt?.leave_type_name?.toLowerCase().includes(q)
      )
    })
  }, [balances, searchTerm, empMap])

  const stats = useMemo(() => {
    const totalAllocated = balances.reduce((s, b) => s + (b.total_allocated ?? 0), 0)
    const totalUsed = balances.reduce((s, b) => s + (b.used_days ?? 0), 0)
    const totalAvailable = balances.reduce((s, b) => s + (b.available_days ?? 0), 0)
    return { totalAllocated, totalUsed, totalAvailable, count: balances.length }
  }, [balances])

  const handleAllocate = async () => {
    if (!selectedEmployee || !selectedLeaveType || !allocationDays) return
    await allocateMutation.mutateAsync({
      employee_id: selectedEmployee,
      leave_type_id: selectedLeaveType,
      year: yearFilter,
      days: Number(allocationDays),
    })
    setShowAllocateModal(false)
    setSelectedEmployee('')
    setSelectedLeaveType('')
    setAllocationDays('')
  }

  const handleInlineEdit = (balance: any) => {
    setEditingId(balance.id)
    setEditingDays(String(balance.total_allocated ?? 0))
  }

  const handleInlineSave = async (balance: any) => {
    if (!editingDays || isNaN(Number(editingDays))) {
      toast.error('Enter a valid number of days')
      return
    }
    await allocateMutation.mutateAsync({
      employee_id: balance.employee_id,
      leave_type_id: balance.leave_type_id,
      year: balance.year,
      days: Number(editingDays),
    })
    setEditingId(null)
    setEditingDays('')
  }

  const handleBulkInit = async () => {
    const days: Record<string, number> = {}
    for (const [typeId, val] of Object.entries(defaultDays)) {
      const n = Number(val)
      if (!isNaN(n) && n >= 0) days[typeId] = n
    }
    if (Object.keys(days).length === 0) {
      toast.error('Set at least one leave type default')
      return
    }
    await bulkInitMutation.mutateAsync({ year: yearFilter, defaultDays: days })
    setShowInitModal(false)
    setDefaultDays({})
  }

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map((y) => ({
    value: String(y),
    label: String(y),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Balances</h1>
          <p className="text-gray-600 mt-1">View and allocate leave balances per employee</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowInitModal(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Initialize Year
          </Button>
          <Button onClick={() => setShowAllocateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Allocate Balance
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Balance Records', value: stats.count, color: 'text-blue-600' },
          { label: 'Total Allocated', value: `${stats.totalAllocated} days`, color: 'text-indigo-600' },
          { label: 'Total Used', value: `${stats.totalUsed} days`, color: 'text-orange-600' },
          { label: 'Total Available', value: `${stats.totalAvailable} days`, color: 'text-green-600' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by employee name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={String(yearFilter)}
            onChange={(e) => setYearFilter(Number(e.target.value))}
            options={yearOptions}
            className="w-32"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading balances...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p>No leave balances found for {yearFilter}</p>
            <p className="text-sm mt-1">
              Use{' '}
              <button className="text-blue-600 underline" onClick={() => setShowInitModal(true)}>Initialize Year</button>
              {' '}to create balances for all active employees, or{' '}
              <button className="text-blue-600 underline" onClick={() => setShowAllocateModal(true)}>Allocate Balance</button>
              {' '}for an individual.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Employee', 'Leave Type', 'Year', 'Allocated', 'Used', 'Pending', 'Available', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((balance) => {
                  const emp = empMap[balance.employee_id]
                  const lt = (balance as any).leave_type
                  const pct = balance.total_allocated
                    ? Math.round(((balance.used_days ?? 0) / balance.total_allocated) * 100)
                    : 0

                  const isEditing = editingId === balance.id

                  return (
                    <tr key={balance.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {emp ? `${emp.first_name} ${emp.last_name}` : balance.employee_id.slice(0, 8) + '…'}
                        </div>
                        <div className="text-xs text-gray-500">{emp?.employee_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        {lt ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: lt.color_code || '#6B7280' }}
                          >
                            {lt.leave_type_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{balance.year}</td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editingDays}
                            onChange={(e) => setEditingDays(e.target.value)}
                            className="w-20 py-1 text-sm"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium">{balance.total_allocated} days</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-orange-600">{balance.used_days ?? 0} days</td>
                      <td className="px-4 py-3 text-yellow-600">{balance.pending_days ?? 0} days</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${(balance.available_days ?? 0) <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {balance.available_days ?? 0} days
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 hidden sm:block">
                            <div
                              className="h-1.5 rounded-full bg-green-500"
                              style={{ width: `${Math.max(0, 100 - pct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleInlineSave(balance)}
                              disabled={allocateMutation.isPending}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditingDays('') }}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleInlineEdit(balance)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit allocation"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Initialize Year Modal ── */}
      <Modal open={showInitModal} onClose={() => setShowInitModal(false)}>
        <ModalHeader onClose={() => setShowInitModal(false)}>
          Initialize Leave Balances — {yearFilter}
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 mb-4">
            Set default allocations for each leave type. This will create missing balance records for
            all active employees. Existing records will <strong>not</strong> be changed.
          </p>
          <div className="space-y-3">
            {leaveTypes.map((lt) => (
              <div key={lt.id} className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: (lt as any).color_code || '#6B7280' }}
                />
                <span className="flex-1 text-sm font-medium text-gray-700">{lt.leave_type_name}</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={defaultDays[lt.id] ?? ''}
                    onChange={(e) =>
                      setDefaultDays((prev) => ({ ...prev, [lt.id]: e.target.value }))
                    }
                    className="w-24 text-sm py-1"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Leave types with 0 days will still get a balance record with 0 allocation.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowInitModal(false)}>Cancel</Button>
          <Button onClick={handleBulkInit} disabled={bulkInitMutation.isPending}>
            {bulkInitMutation.isPending ? 'Initializing...' : 'Initialize for All Employees'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* ── Allocate Balance Modal ── */}
      <Modal open={showAllocateModal} onClose={() => setShowAllocateModal(false)}>
        <ModalHeader onClose={() => setShowAllocateModal(false)}>Allocate Leave Balance</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <Select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                options={[
                  { value: '', label: 'Select employee...' },
                  ...employees.map((e) => ({
                    value: e.id,
                    label: `${e.first_name} ${e.last_name} (${e.employee_id})`,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <Select
                value={selectedLeaveType}
                onChange={(e) => setSelectedLeaveType(e.target.value)}
                options={[
                  { value: '', label: 'Select leave type...' },
                  ...leaveTypes.map((lt) => ({
                    value: lt.id,
                    label: lt.leave_type_name,
                  })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <Select
                value={String(yearFilter)}
                onChange={(e) => setYearFilter(Number(e.target.value))}
                options={yearOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days to Allocate</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 15"
                value={allocationDays}
                onChange={(e) => setAllocationDays(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                If a balance already exists for this employee + leave type + year, it will be updated.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowAllocateModal(false)}>Cancel</Button>
          <Button
            onClick={handleAllocate}
            disabled={!selectedEmployee || !selectedLeaveType || !allocationDays || allocateMutation.isPending}
          >
            {allocateMutation.isPending ? 'Saving...' : 'Allocate'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
