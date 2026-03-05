'use client'

import { useState } from 'react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Input } from '@/components/ui'
import { useRoles, usePermissions, useUpdateRole, useAssignPermissions } from '@/hooks'
import { Shield, Plus, Edit2, Users, CheckCircle } from 'lucide-react'
import type { RoleWithPermissions } from '@/services/rbac.service'

export default function RBACPage() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles()
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions()
  const updateRole = useUpdateRole()
  const assignPermissions = useAssignPermissions()

  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set())

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) acc[permission.category] = []
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, typeof permissions>)

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'super admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-orange-100 text-orange'
      case 'hr manager': return 'bg-purple-100 text-purple-600'
      case 'manager': return 'bg-blue-100 text-blue-600'
      case 'employee': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  function openEdit(role: RoleWithPermissions) {
    setEditingRole(role)
    setEditName(role.name)
    setEditDescription(role.description || '')
    setSelectedPermissionIds(new Set(role.permissions.map(p => p.id)))
  }

  function togglePermission(id: string) {
    setSelectedPermissionIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleCategory(categoryPerms: typeof permissions) {
    const ids = categoryPerms.map(p => p.id)
    const allSelected = ids.every(id => selectedPermissionIds.has(id))
    setSelectedPermissionIds(prev => {
      const next = new Set(prev)
      if (allSelected) {
        ids.forEach(id => next.delete(id))
      } else {
        ids.forEach(id => next.add(id))
      }
      return next
    })
  }

  async function handleSave() {
    if (!editingRole) return
    await updateRole.mutateAsync({
      id: editingRole.id,
      data: { name: editName.trim(), description: editDescription.trim() },
    })
    await assignPermissions.mutateAsync({
      roleId: editingRole.id,
      permissionIds: Array.from(selectedPermissionIds),
    })
    setEditingRole(null)
  }

  const isSaving = updateRole.isPending || assignPermissions.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role-Based Access Control</h1>
          <p className="text-gray-600 mt-1">Manage roles and permissions for system access</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Roles</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{roles.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Permissions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{permissions.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Permission Categories</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{Object.keys(groupedPermissions).length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Roles</h2>
        {rolesLoading ? (
          <p className="text-gray-500">Loading roles...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <Badge className={getRoleColor(role.name)}>
                        {role.permissions?.length || 0} permissions
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>

                {role.description && (
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Key Permissions</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions?.slice(0, 5).map((permission) => (
                      <Badge key={permission.id} className="bg-gray-100 text-gray-700 text-xs">
                        {permission.name}
                      </Badge>
                    ))}
                    {(role.permissions?.length || 0) > 5 && (
                      <Badge className="bg-gray-100 text-gray-700 text-xs">
                        +{(role.permissions?.length || 0) - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Permission Categories</h2>
        {permissionsLoading ? (
          <p className="text-gray-500">Loading permissions...</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <Card key={category} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 capitalize">{category}</h3>
                  <Badge className="bg-blue-100 text-blue-800">{perms.length} permissions</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {perms.map((permission) => (
                    <div key={permission.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                        {permission.description && (
                          <p className="text-xs text-gray-600 mt-1">{permission.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      <Modal open={!!editingRole} onClose={() => setEditingRole(null)} size="lg">
        <ModalHeader onClose={() => setEditingRole(null)}>
          Edit Role: {editingRole?.name}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            {/* Name & Description */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Role name"
                  disabled={editingRole?.is_system_role}
                />
                {editingRole?.is_system_role && (
                  <p className="text-xs text-gray-400 mt-1">System role names cannot be changed.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Input
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Role description"
                />
              </div>
            </div>

            {/* Permission assignment */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Permissions
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  {selectedPermissionIds.size} selected
                </span>
              </p>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const allChecked = perms.every(p => selectedPermissionIds.has(p.id))
                  const someChecked = perms.some(p => selectedPermissionIds.has(p.id))
                  return (
                    <div key={category} className="border border-gray-100 rounded-lg p-3">
                      <label className="flex items-center gap-2 mb-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                          onChange={() => toggleCategory(perms)}
                          className="w-4 h-4 rounded accent-orange"
                        />
                        <span className="text-sm font-semibold text-gray-800">{category}</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-6">
                        {perms.map(p => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.has(p.id)}
                              onChange={() => togglePermission(p.id)}
                              className="w-4 h-4 rounded accent-orange"
                            />
                            <span className="text-sm text-gray-700">{p.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setEditingRole(null)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !editName.trim()}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}


