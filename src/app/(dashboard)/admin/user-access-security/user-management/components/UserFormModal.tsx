'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, User, Shield, Building2, Briefcase, Lock, Eye, EyeOff } from 'lucide-react'
import { Modal, Button, Input, Card, Badge } from '@/components/ui'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { useEmployees, useDepartments, useRoles } from '@/hooks'
import { passwordPolicyService } from '@/services'
import { logAction } from '@/services/auditLog.service'
import type { SystemUserWithRelations } from '@/services'

const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  employee_id: z.string().min(1, 'Please link this user to an employee record'),
})

type FormData = z.infer<typeof userSchema>

interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: SystemUserWithRelations
}

const statusOptions = [
  { value: 'active', label: 'Active', color: 'text-green-600 bg-green-100' },
  { value: 'inactive', label: 'Inactive', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'suspended', label: 'Suspended', color: 'text-red-600 bg-red-100' },
]

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  
  const { data: employees = [] } = useEmployees()
  const { data: departments = [] } = useDepartments()
  const { data: roles = [], isPending: isLoadingRoles } = useRoles()
  
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'Employee',
      status: 'active',
      employee_id: '',
    },
  })

  const watchedRole = watch('role')
  const watchedEmployeeId = watch('employee_id')
  const watchedPassword = watch('password') || ''

  // Find selected role details
  const selectedRoleData = roles.find(role => role.name.toLowerCase() === watchedRole?.toLowerCase())

  // Calculate password strength
  const passwordStrength = watchedPassword && watchedPassword.length > 0
    ? passwordPolicyService.calculatePasswordStrength(watchedPassword)
    : { score: 0, issues: [] }

  // Map database enum values to RBAC role display names.
  // First tries a direct lookup in loaded roles (so renames work automatically),
  // then falls back to a static map for the built-in enum values.
  const mapEnumToRole = (enumValue: string): string => {
    // Try to find a matching RBAC role by its slug (lower-cased, spaces→underscore/dash stripped)
    const slug = enumValue.toLowerCase().replace(/[^a-z0-9]/g, '')
    const matched = roles.find(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === slug)
    if (matched) return matched.name

    // Static fallback for core enum values
    const enumMap: Record<string, string> = {
      'admin': 'Admin',
      'hr': 'HR Manager',
      'manager': 'Manager',
      'employee': 'Employee',
      'ed': 'Executive Director',
      'super admin': 'Super Admin',
      'board_member': 'Board Member',
    }
    return enumMap[enumValue] || enumValue
  }

  // Map RBAC role display names back to the database enum value.
  // Uses the same slug logic so renames don't break this.
  const mapRoleToEnum = (roleName: string): string => {
    const slug = roleName.toLowerCase().replace(/[^a-z0-9]/g, '')
    const staticMap: Record<string, string> = {
      'admin': 'admin',
      'hrmanager': 'hr',
      'hr': 'hr',
      'manager': 'manager',
      'employee': 'employee',
      'ed': 'ed',
      'executivedirector': 'ed',
      'superadmin': 'super admin',
      'boardmember': 'board_member',
    }
    return staticMap[slug] || slug
  }

  // Update form when editing
  useEffect(() => {
    if (open) {
      if (user) {
        // Edit mode - populate with user data
        setValue('email', user.email)
        setValue('role', mapEnumToRole(user.role)) // Map database enum to RBAC role name
        setValue('status', user.status)
        setValue('employee_id', user.employee?.id || user.employee_id || '')
        setSelectedEmployee(user.employee?.id || user.employee_id || '')
        setShowPassword(false)
      } else {
        // Add mode - clear all fields
        reset({
          email: '',
          password: '',
          role: 'Employee',
          status: 'active',
          employee_id: '',
        })
        setSelectedEmployee('')
        setShowPassword(false)
      }
    }
  }, [user, open, setValue, reset])

  // Update selected employee display
  useEffect(() => {
    setSelectedEmployee(watchedEmployeeId || '')
  }, [watchedEmployeeId])

  const [passwordError, setPasswordError] = useState<string | null>(null)

  const onSubmit = async (data: FormData) => {
    setPasswordError(null)

    const hasPassword = data.password && data.password.trim() !== ''

    // For new users, password is required
    if (!user && !hasPassword) {
      setPasswordError('Password is required for new users')
      return
    }

    // Validate password strength if a password was provided
    if (hasPassword) {
      const strength = passwordPolicyService.calculatePasswordStrength(data.password!)
      if (strength.score < 3) {
        setPasswordError(
          'Password is too weak. Please fix: ' + strength.issues.join(', ') + '.'
        )
        return
      }
    }

    try {
      const submitData: any = {
        email: data.email,
        role: mapRoleToEnum(data.role),
        status: data.status === 'suspended' ? 'inactive' : data.status as 'active' | 'inactive',
        employee_id: data.employee_id || null,
      }

      if (hasPassword) {
        submitData.password = data.password
      }

      if (user) {
        await updateUser.mutateAsync({ id: user.id, data: submitData })
        if (submitData.employee_id) {
          await logAction({
            employee_id: submitData.employee_id,
            action: 'System User Updated',
            details: `User account updated: ${submitData.email} (role: ${submitData.role})`,
          })
        }
        if (user.role !== submitData.role) {
          alert('Role updated successfully! The user must log out and log back in for the new role to take effect.')
        }
      } else {
        await createUser.mutateAsync(submitData)
        if (submitData.employee_id) {
          await logAction({
            employee_id: submitData.employee_id,
            action: 'System User Created',
            details: `New user account created: ${submitData.email} (role: ${submitData.role})`,
          })
        }
      }

      onClose()
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    }
  }

  const handleClose = () => {
    onClose()
    reset()
    setSelectedEmployee('')
  }

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee)

  return (
    <Modal open={open} onClose={handleClose} className="max-w-2xl">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <User className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {user ? 'Edit User' : 'Add New User'}
            </h2>
            <p className="text-sm text-gray-500">
              {user ? 'Update user details and permissions' : 'Create a new system user account'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="user@company.com"
                error={errors.email?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Security & Authentication */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security & Authentication
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {user ? 'Update login credentials and security settings' : 'Set up initial login credentials'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {user && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
              </label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={user ? "Leave blank to keep current" : "Enter password (min 8 characters)"}
                  error={errors.password?.message}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {watchedPassword && watchedPassword.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Strength:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          passwordStrength.score >= 4 ? 'bg-green-500' : 
                          passwordStrength.score >= 3 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <Badge variant={
                      passwordStrength.score >= 4 ? 'success' : 
                      passwordStrength.score >= 3 ? 'warning' : 
                      'danger'
                    }>
                      {passwordStrength.score >= 4 ? 'Strong' : 
                       passwordStrength.score >= 3 ? 'Medium' : 
                       'Weak'}
                    </Badge>
                  </div>
                  
                  {passwordStrength.issues.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                      <p className="text-xs font-medium text-yellow-800 mb-1">Suggestions:</p>
                      <ul className="text-xs text-yellow-700 space-y-0.5">
                        {passwordStrength.issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-yellow-600">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {!user && !watchedPassword && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters long
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Role & Permissions */}
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role & Permissions
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Define user access level and system permissions
            </p>
          </div>

          {isLoadingRoles ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-orange-600 border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roles.filter(role => role.status === 'active').map(role => (
                  <label
                    key={role.id}
                    className={`relative flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      watchedRole?.toLowerCase() === role.name.toLowerCase()
                        ? 'border-orange bg-orange-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      {...register('role')}
                      type="radio"
                      value={role.name}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          watchedRole?.toLowerCase() === role.name.toLowerCase() ? 'bg-orange' : 'bg-gray-300'
                        }`} />
                        <span className="font-medium text-gray-900">{role.name}</span>
                        {role.is_system_role && (
                          <Badge variant="info" className="text-xs">System</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{role.description || 'No description available'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">
                          {role.permissions?.length || 0} permissions
                        </span>
                        {role.user_count !== undefined && (
                          <span className="text-xs text-gray-400">
                            • {role.user_count} users
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="text-sm text-red-600">{errors.role.message}</p>
              )}

              {/* Show permissions for selected role */}
              {selectedRoleData && selectedRoleData.permissions && selectedRoleData.permissions.length > 0 && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        {selectedRoleData.name} Permissions
                      </span>
                      <Badge variant="info">
                        {selectedRoleData.permissions.length}
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPermissions(!showPermissions)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showPermissions ? 'Hide' : 'View All'}
                    </button>
                  </div>
                  
                  {showPermissions && (
                    <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                      {Object.entries(
                        selectedRoleData.permissions.reduce((acc, perm) => {
                          if (!acc[perm.category]) acc[perm.category] = []
                          acc[perm.category].push(perm)
                          return acc
                        }, {} as Record<string, typeof selectedRoleData.permissions>)
                      ).map(([category, perms]) => (
                        <div key={category} className="space-y-1">
                          <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                            {category}
                          </p>
                          <div className="space-y-1">
                            {perms.map(perm => (
                              <div key={perm.id} className="flex items-start gap-2 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                <div>
                                  <span className="text-blue-900 font-medium">{perm.name}</span>
                                  <span className="text-blue-700 text-xs ml-2">({perm.code})</span>
                                  {perm.description && (
                                    <p className="text-blue-600 text-xs mt-0.5">{perm.description}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>

        {/* Employee Linking */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Link to Employee Record
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              {...register('employee_id')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
            >
              <option value="">Select an employee</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name} - {employee.employee_id}
                  {employee.department && ` (${employee.department.name})`}
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="text-xs text-red-500 mt-1">{errors.employee_id.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Every user must be linked to an employee record
            </p>
          </div>

          {/* Selected Employee Preview */}
          {selectedEmployeeData && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-blue-900">
                    {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    <span>ID: {selectedEmployeeData.employee_id}</span>
                    {selectedEmployeeData.department && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {selectedEmployeeData.department.name}
                      </span>
                    )}
                    {selectedEmployeeData.job_title && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {selectedEmployeeData.job_title.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        </div>

        {/* Actions — sticky footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
          {passwordError && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
              {passwordError}
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (user ? 'Update User' : 'Create User')}
          </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}