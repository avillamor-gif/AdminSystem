'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Plus, Search, MoreVertical, Eye, Pencil, Trash2, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmployeeFormModal } from '@/app/(dashboard)/employees/components/EmployeeFormModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useEmployees, useDeleteEmployee } from '@/hooks/useEmployees'
import { useDepartments } from '@/hooks/useDepartments'
import { useCurrentUserPermissions } from '@/hooks'
import type { EmployeeFilters, EmployeeWithRelations } from '@/services/employee.service'

export default function EmployeeProfilesPage() {
  const [filters, setFilters] = useState<EmployeeFilters>({})
  const [employeeGroup, setEmployeeGroup] = useState<'current' | 'all' | 'past'>('current')

  // Derive the status filter from the group selection
  const groupStatusMap: Record<string, string> = {
    current: '',      // active + inactive — handled by post-filter below
    all: '',          // all statuses
    past: 'terminated',
  }
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { data: roleInfo } = useCurrentUserPermissions()

  const canCreateEmployee = roleInfo?.permissions.includes('employee.create')
  const canEditEmployee = roleInfo?.permissions.includes('employee.edit')
  const canDeleteEmployee = true // admin-only page — delete always visible

  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithRelations | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: allEmployeesRaw = [], isLoading: isLoadingEmployees, error: employeesError } = useEmployees(filters)
  const { data: departments = [] } = useDepartments()
  const deleteEmployee = useDeleteEmployee()

  // Filter by group after fetch (useEmployees already handles dept/search filters)
  const employees = (allEmployeesRaw as EmployeeWithRelations[]).filter(e => {
    if (employeeGroup === 'current') return e.status === 'active'
    if (employeeGroup === 'past') return e.status === 'terminated'
    return true // 'all'
  })
  const typedEmployees = employees
  const typedDepartments = departments

  const stats = {
    total: typedEmployees.length,
    active: typedEmployees.filter(e => e.status === 'active').length,
    inactive: typedEmployees.filter(e => e.status === 'inactive').length,
    terminated: typedEmployees.filter(e => e.status === 'terminated').length,
  }

  useEffect(() => {
    if (employeesError) console.error('Employees Error:', employeesError)
  }, [employeesError])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const handleEditEmployee = (employee: EmployeeWithRelations) => {
    setEditingEmployee(employee)
    setShowEditModal(true)
    setMenuOpen(null)
  }

  const handleDeleteEmployee = (id: string) => {
    setMenuOpen(null)
    setConfirmDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!confirmDeleteId) return
    await deleteEmployee.mutateAsync(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  const handleExport = () => {
    const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Job Title', 'Status', 'Hire Date']
    const rows = typedEmployees.map(emp => [
      emp.employee_id || '',
      `${emp.first_name} ${emp.last_name}`,
      emp.email || '',
      emp.department?.name || '',
      emp.job_title?.title || '',
      emp.status || '',
      emp.hire_date || ''
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger'> = {
      active: 'success',
      inactive: 'warning',
      terminated: 'danger',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'terminated', label: 'Terminated' },
  ]

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...typedDepartments.map((d) => ({ value: String(d.id), label: d.name })),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Profiles</h1>
          <p className="text-gray-600 mt-1">
            Manage comprehensive employee information and profiles
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
          <Button variant="secondary" onClick={handleExport}>
            <FileText className="w-4 h-4 mr-2" />
            Export
          </Button>
          {canCreateEmployee && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Employees</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Inactive</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.inactive}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Terminated</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.terminated}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <Select
            options={departmentOptions}
            value={filters.department || ''}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 col-span-2">
            {([
              { value: 'current', label: 'Current Employees' },
              { value: 'all',     label: 'Current & Past' },
              { value: 'past',    label: 'Past Employees' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setEmployeeGroup(opt.value)}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  employeeGroup === opt.value
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* List View */}
      {viewMode === 'list' ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoadingEmployees ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">Loading employees...</p>
                    </td>
                  </tr>
                ) : employeesError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-red-600">
                      Error loading employees
                    </td>
                  </tr>
                ) : typedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No employees found</td>
                  </tr>
                ) : (
                  typedEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={employee.avatar_url}
                            firstName={employee.first_name}
                            lastName={employee.last_name}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.department?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.job_title?.title || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(employee.status ?? '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative" ref={menuOpen === employee.id ? menuRef : null}>
                          <button
                            onClick={() => setMenuOpen(menuOpen === employee.id ? null : employee.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          {menuOpen === employee.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <Link
                                href={`/admin/employee-data/employee-profiles/${employee.employee_id}`}
                                onClick={() => setMenuOpen(null)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </Link>
                              {canEditEmployee && (
                                <button
                                  onClick={() => handleEditEmployee(employee)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left border-b border-gray-100"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Edit
                                </button>
                              )}
                              {canDeleteEmployee && (
                                <button
                                  onClick={() => handleDeleteEmployee(employee.id)}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingEmployees ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Loading employees...</p>
              </div>
            </div>
          ) : employeesError ? (
            <div className="col-span-full py-12 text-center text-red-600">
              Error loading employees
            </div>
          ) : typedEmployees.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              No employees found
            </div>
          ) : (
            typedEmployees.map((employee) => (
              <Card key={employee.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <Avatar
                    src={employee.avatar_url}
                    firstName={employee.first_name}
                    lastName={employee.last_name}
                    size="xl"
                  />
                  <h3 className="mt-4 font-semibold text-gray-900">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">{employee.email}</p>
                  <div className="mt-3">
                    {getStatusBadge(employee.status ?? '')}
                  </div>
                  <div className="mt-4 w-full space-y-2">
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                      <span className="font-medium">Dept:</span>
                      <span>{employee.department?.name || '-'}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                      <span className="font-medium">Title:</span>
                      <span>{employee.job_title?.title || '-'}</span>
                    </div>
                  </div>
                  <div className="mt-4 w-full space-y-2">
                    <Link
                      href={`/admin/employee-data/employee-profiles/${employee.employee_id}`}
                      className="block w-full px-3 py-2 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-center transition-colors"
                    >
                      View Full Details
                    </Link>
                    <div className="flex gap-2">
                      {canEditEmployee && (
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                      )}
                      {canDeleteEmployee && (
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This action cannot be undone and will permanently remove all associated records."
        confirmText="Delete"
        variant="danger"
        isLoading={deleteEmployee.isPending}
      />

      <EmployeeFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EmployeeFormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingEmployee(null)
        }}
        employee={editingEmployee as any}
      />
    </div>
  )
}
