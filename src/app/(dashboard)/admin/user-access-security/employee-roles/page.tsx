'use client'

import { useState } from 'react'
import { useEmployees } from '@/hooks/useEmployees'
import { useRoles } from '@/hooks/useRBAC'
import { useCurrentUserPermissions } from '@/hooks/usePermissions'
import { Card, Button, Input, Select, Badge } from '@/components/ui'
import { Search, Save, Loader2, AlertCircle } from 'lucide-react'
import { rbacService } from '@/services/rbac.service'
import toast from 'react-hot-toast'

interface EmployeeRoleAssignment {
  employee_id: string
  role_id: string
  first_name: string
  last_name: string
  email: string
  current_role?: string
}

export default function EmployeeRBACPage() {
  const { data: employees = [], isLoading: employeesLoading } = useEmployees()
  const { data: roles = [], isLoading: rolesLoading } = useRoles()
  const { data: userPermissions } = useCurrentUserPermissions()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set())

  // Check if user has permission to manage roles
  const canManageRoles = userPermissions?.permissions.includes('admin.user_access.rbac.manage') || 
                         userPermissions?.permissions.includes('role.manage')

  if (!canManageRoles) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Access Control</h1>
          <p className="text-gray-600 mt-1">Assign roles and permissions to employees</p>
        </div>
        <Card className="p-6 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="text-amber-900">You don't have permission to manage employee roles. Contact your administrator.</p>
          </div>
        </Card>
      </div>
    )
  }

  // Get departments from employees
  const departments = Array.from(new Set(
    employees.map((emp: any) => emp.department?.name).filter(Boolean)
  ))

  // Filter employees based on search and department
  const filteredEmployees = employees.filter((emp: any) => {
    const matchesSearch = 
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesDept = selectedDept === 'all' || emp.department?.name === selectedDept
    
    return matchesSearch && matchesDept
  })

  // Initialize assignments from current employee roles
  const initializeAssignments = () => {
    const newAssignments: Record<string, string> = {}
    employees.forEach((emp: any) => {
      // This would come from user_roles table in real implementation
      // For now, just initialize empty
      newAssignments[emp.id] = ''
    })
    setAssignments(newAssignments)
  }

  const handleRoleChange = (employeeId: string, roleId: string) => {
    setAssignments(prev => ({
      ...prev,
      [employeeId]: roleId
    }))
    setUnsavedChanges(prev => new Set([...prev, employeeId]))
  }

  const handleSaveAll = async () => {
    if (unsavedChanges.size === 0) {
      toast.success('No changes to save')
      return
    }

    setIsSaving(true)
    try {
      // Batch update employee roles
      const updates = Array.from(unsavedChanges).map(employeeId => ({
        employeeId,
        roleId: assignments[employeeId]
      }))

      // Call API to update roles
      const response = await fetch('/api/admin/employee-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      if (!response.ok) throw new Error('Failed to update roles')

      toast.success(`Updated roles for ${unsavedChanges.size} employee(s)`)
      setUnsavedChanges(new Set())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const stats = {
    total: employees.length,
    assigned: Object.values(assignments).filter(Boolean).length,
    unassigned: employees.length - Object.values(assignments).filter(Boolean).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Access Control</h1>
          <p className="text-gray-600 mt-1">Assign roles and permissions to employees</p>
        </div>
        <Button 
          onClick={handleSaveAll}
          disabled={unsavedChanges.size === 0 || isSaving}
          className={unsavedChanges.size > 0 ? 'bg-amber-500 hover:bg-amber-600' : ''}
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isSaving ? 'Saving...' : unsavedChanges.size > 0 ? `Save Changes (${unsavedChanges.size})` : 'No Changes'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Roles Assigned</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.assigned}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Missing Roles</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{stats.unassigned}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search by name, email, or ID</label>
            <Input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Employees List */}
      <Card className="overflow-hidden">
        {employeesLoading || rolesLoading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No employees found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((emp: any) => {
                  const currentRole = assignments[emp.id]
                  const hasChanged = unsavedChanges.has(emp.id)
                  
                  return (
                    <tr key={emp.id} className={`hover:bg-gray-50 transition-colors ${hasChanged ? 'bg-amber-50' : ''}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {emp.avatar_url && (
                            <img 
                              src={emp.avatar_url} 
                              alt={`${emp.first_name} ${emp.last_name}`}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                            <p className="text-xs text-gray-500">{emp.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{emp.email}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{emp.department?.name || '—'}</td>
                      <td className="px-6 py-3">
                        <select
                          value={currentRole}
                          onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                          className={`px-3 py-1.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm ${
                            hasChanged 
                              ? 'bg-amber-100 border-amber-300' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">— None —</option>
                          {roles.map((role: any) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        {currentRole ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Assigned</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Pending</Badge>
                        )}
                        {hasChanged && (
                          <Badge className="bg-amber-100 text-amber-800 ml-1">Unsaved</Badge>
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

      {/* Bulk Actions */}
      {filteredEmployees.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Bulk Actions (for filtered employees)</p>
          <div className="flex gap-2 flex-wrap">
            {roles.map((role: any) => (
              <Button
                key={role.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  filteredEmployees.forEach((emp: any) => {
                    handleRoleChange(emp.id, role.id)
                  })
                }}
              >
                Assign All to {role.name}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                filteredEmployees.forEach((emp: any) => {
                  handleRoleChange(emp.id, '')
                })
              }}
            >
              Clear All
            </Button>
          </div>
        </Card>
      )}

      {/* Unsaved Changes Notice */}
      {unsavedChanges.size > 0 && (
        <div className="fixed bottom-6 right-6 bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{unsavedChanges.size} unsaved change(s)</span>
        </div>
      )}
    </div>
  )
}
