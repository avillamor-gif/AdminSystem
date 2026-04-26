'use client'

import { useState } from 'react'
import {
  UserX, UserCheck, AlertCircle,
  Search, Users, RefreshCw,
} from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useEmployees, useUpdateEmployee } from '@/hooks/useEmployees'
import toast from 'react-hot-toast'

type StatusAction = 'terminated' | 'inactive' | 'active'

interface PendingAction {
  employeeId: string
  employeeName: string
  newStatus: StatusAction
}

export default function TerminationActivationPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const { data: allEmployees = [], isLoading } = useEmployees({})
  const updateEmployee = useUpdateEmployee()

  const employees = (allEmployees as any[])
    .filter(e => {
      const matchesSearch =
        !search ||
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        (e.employee_id ?? '').toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a: any, b: any) =>
      `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    )

  const counts = {
    active: (allEmployees as any[]).filter(e => e.status === 'active').length,
    inactive: (allEmployees as any[]).filter(e => e.status === 'inactive').length,
    terminated: (allEmployees as any[]).filter(e => e.status === 'terminated').length,
  }

  const handleConfirm = async () => {
    if (!pendingAction) return
    try {
      await updateEmployee.mutateAsync({
        id: pendingAction.employeeId,
        data: { status: pendingAction.newStatus },
      })
      toast.success(`${pendingAction.employeeName} marked as ${pendingAction.newStatus}`)
    } catch {
      toast.error('Failed to update employee status')
    } finally {
      setPendingAction(null)
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700',
      inactive: 'bg-amber-100 text-amber-700',
      terminated: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    )
  }

  const actionLabel: Record<StatusAction, string> = {
    terminated: 'Terminate',
    inactive: 'Deactivate',
    active: 'Reactivate',
  }

  const confirmMessages: Record<StatusAction, string> = {
    terminated: 'This will mark the employee as terminated. They will be excluded from active headcount and will appear in Past Employees analytics.',
    inactive: 'This will mark the employee as inactive. They remain on record but will not count as active.',
    active: 'This will reactivate the employee and mark them as active.',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Termination & Activation</h1>
        <p className="text-gray-600 mt-1">
          Directly manage employee status — changes immediately reflect in workforce analytics and headcount reports.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Active</div>
              <div className="text-2xl font-bold text-emerald-600">{counts.active}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Inactive</div>
              <div className="text-2xl font-bold text-amber-600">{counts.inactive}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Terminated</div>
              <div className="text-2xl font-bold text-red-600">{counts.terminated}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'terminated', label: 'Terminated' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400">{employees.length} employees</span>
        </div>
      </Card>

      {/* Employee Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        ) : employees.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No employees match your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employment Type</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp: any) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={emp.avatar_url}
                        firstName={emp.first_name ?? ''}
                        lastName={emp.last_name ?? ''}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-gray-400">{emp.employee_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{emp.department?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{emp.employment_type?.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-center">{statusBadge(emp.status ?? 'active')}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {emp.status !== 'active' && (
                        <button
                          onClick={() => setPendingAction({ employeeId: emp.id, employeeName: `${emp.first_name} ${emp.last_name}`, newStatus: 'active' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Reactivate
                        </button>
                      )}
                      {emp.status !== 'inactive' && (
                        <button
                          onClick={() => setPendingAction({ employeeId: emp.id, employeeName: `${emp.first_name} ${emp.last_name}`, newStatus: 'inactive' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                        >
                          <AlertCircle className="w-3 h-3" />
                          Deactivate
                        </button>
                      )}
                      {emp.status !== 'terminated' && (
                        <button
                          onClick={() => setPendingAction({ employeeId: emp.id, employeeName: `${emp.first_name} ${emp.last_name}`, newStatus: 'terminated' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
                        >
                          <UserX className="w-3 h-3" />
                          Terminate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ConfirmModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirm}
        title={pendingAction ? `${actionLabel[pendingAction.newStatus]} Employee` : ''}
        message={pendingAction ? `You are about to ${actionLabel[pendingAction.newStatus].toLowerCase()} ${pendingAction.employeeName}.\n\n${confirmMessages[pendingAction.newStatus]}` : ''}
        confirmText={pendingAction ? actionLabel[pendingAction.newStatus] : 'Confirm'}
        variant={pendingAction?.newStatus === 'active' ? 'default' : 'danger'}
        isLoading={updateEmployee.isPending}
      />
    </div>
  )
}
