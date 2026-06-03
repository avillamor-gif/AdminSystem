'use client'

import { useState, Component, type ReactNode } from 'react'
import { 
  Users, Plus, Edit2, Trash2, Shield, Eye, Search, 
  Filter, Download, Upload, MoreHorizontal, Check, X, AlertTriangle, KeyRound, Mail
} from 'lucide-react'
import { Card, Button, Badge, Input, Avatar } from '@/components/ui'
import { useUsers, useDeleteUser, useUpdateUserStatus, useCurrentUserPermissions } from '@/hooks'
import { useDepartments } from '@/hooks'
import { UserFormModal } from './components/UserFormModal'
import type { SystemUserWithRelations } from '@/services'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <Card className="p-6 bg-red-50 border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">Page Error</h3>
            <p className="text-red-700 text-sm font-mono">{(this.state.error as any).message}</p>
            <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">{(this.state.error as any).stack}</pre>
            <Button className="mt-4" onClick={() => this.setState({ error: null })}>Retry</Button>
          </Card>
        </div>
      )
    }
    return this.props.children
  }
}

function UserManagementContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SystemUserWithRelations | undefined>()

  const { data: roleInfo } = useCurrentUserPermissions()
  
  // Fetch data with real integration
  const { data: users = [], isLoading, error } = useUsers({
    search: searchQuery || undefined,
    role: selectedRole || undefined,
    status: selectedStatus || undefined,
    department: selectedDepartment || undefined
  })
  const { data: departments = [] } = useDepartments()
  
  // Check permissions
  const canCreateUser = roleInfo?.permissions.includes('user.create')
  const canEditUser = roleInfo?.permissions.includes('user.edit')
  const canDeleteUser = roleInfo?.permissions.includes('user.delete')
  
  const deleteUser = useDeleteUser()
  const updateUserStatus = useUpdateUserStatus()

  const handleEdit = (user: SystemUserWithRelations) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  const handleAddNew = () => {
    setSelectedUser(undefined)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user "${name}"?`)) {
      await deleteUser.mutateAsync(id)
    }
  }

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    await updateUserStatus.mutateAsync({ id, status })
  }

  const [sendingResetFor, setSendingResetFor] = useState<string | null>(null)
  const isSuperAdmin = ['super admin', 'admin', 'executive director'].includes(roleInfo?.role_name?.toLowerCase() || '')

  const handleSendResetEmail = async (userId: string, email: string, name: string) => {
    if (!window.confirm(`Send a password reset email to ${name} (${email})?`)) return
    setSendingResetFor(userId)
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, email }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      alert(`Password reset email sent to ${email}`)
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setSendingResetFor(null)
    }
  }

  const handleCloseForm = () => {
    setSelectedUser(undefined)
    setIsFormOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'warning'  
      case 'suspended': return 'danger'
      default: return 'secondary'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'danger'
      case 'hr': return 'warning'
      case 'manager': return 'info'
      case 'employee': return 'secondary'
      default: return 'secondary'
    }
  }

  const metrics = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    inactiveUsers: users.filter(u => u.status === 'inactive').length,
    suspendedUsers: 0, // No suspended status - using inactive instead
    adminUsers: users.filter(u => u.role === 'admin').length,
    hrUsers: users.filter(u => u.role === 'hr').length,
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 text-center">
          <p className="text-red-600">Error loading users: {error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  // Show setup notice if no users found
  const showSetupNotice = users.length === 0 && !isLoading && !searchQuery && !selectedRole && !selectedStatus

  return (
    <div className="space-y-6">
      {/* Setup Notice */}
      {showSetupNotice && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-800">User Management Setup</h3>
              <p className="text-yellow-700 mt-1">
                No users found. This may be because the user roles table needs setup or no users have been created yet.
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                Make sure you've run the setup process and have user roles configured in your database.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          {canCreateUser && (
            <Button onClick={handleAddNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Shield className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.adminUsers}</p>
              <p className="text-sm text-gray-500">Admin Users</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <X className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics.suspendedUsers}</p>
              <p className="text-sm text-gray-500">Suspended</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          <select 
            value={selectedDepartment} 
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">System Users ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange"></div>
                      <span className="ml-2">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    {searchQuery || selectedRole || selectedStatus || selectedDepartment
                      ? 'No users found matching your search.'
                      : 'No users found. Add your first user to get started.'}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar 
                          src={user.employee?.avatar_url}
                          firstName={user.employee?.first_name || user.name.split(' ')[0] || 'U'}
                          lastName={user.employee?.last_name || user.name.split(' ')[1] || 'N'}
                          size="sm"
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getRoleColor(user.role) as any}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.employee?.department?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(user.status) as any}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.employee?.employee_id || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditUser && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            title="Send password reset email"
                            disabled={sendingResetFor === user.id}
                            onClick={() => handleSendResetEmail(user.id, user.email, user.name)}
                          >
                            {sendingResetFor === user.id
                              ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                              : <Mail className="w-3 h-3" />}
                          </Button>
                        )}
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value as any)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange"
                          disabled={updateUserStatus.isPending}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                        {canDeleteUser && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={deleteUser.isPending}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
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

      {/* Form Modal */}
      <UserFormModal
        open={isFormOpen}
        onClose={handleCloseForm}
        user={selectedUser}
      />
    </div>
  )
}

export default function UserManagementPage() {
  return (
    <ErrorBoundary>
      <ProtectedRoute requiredPermissions={['user.view']}>
        <UserManagementContent />
      </ProtectedRoute>
    </ErrorBoundary>
  )
}