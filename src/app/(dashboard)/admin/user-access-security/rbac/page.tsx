'use client'

import { useState } from 'react'
import { Card, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Input, ConfirmModal } from '@/components/ui'
import { useRoles, usePermissions, useCreateRole, useUpdateRole, useDeleteRole, useAssignPermissions } from '@/hooks'
import { Shield, Plus, Edit2, Trash2, Users, CheckCircle } from 'lucide-react'
import type { RoleWithPermissions, Permission } from '@/services/rbac.service'

// ── Helpers (module-level so they never change identity between renders) ─────

function togglePermission(id: string, setFn: React.Dispatch<React.SetStateAction<Set<string>>>) {
  setFn(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
}

function toggleCategory(
  categoryPerms: Permission[],
  current: Set<string>,
  setFn: React.Dispatch<React.SetStateAction<Set<string>>>
) {
  const ids = categoryPerms.map(p => p.id)
  const allSelected = ids.every(id => current.has(id))
  setFn(prev => {
    const next = new Set(prev)
    if (allSelected) {
      ids.forEach(id => next.delete(id))
    } else {
      ids.forEach(id => next.add(id))
    }
    return next
  })
}

// ── Admin Module card → submenu permission code prefix mapping ────────────────
const ADMIN_CARD_PREFIXES: { code: string; label: string }[] = [
  { code: 'admin.user_access',     label: 'User Access & Security' },
  { code: 'admin.organization',    label: 'Organization Structure' },
  { code: 'admin.job_management',  label: 'Job & Position Management' },
  { code: 'admin.employee_data',   label: 'Employee Data Management' },
  { code: 'admin.time_attendance', label: 'Time & Attendance' },
  { code: 'admin.leave_management',label: 'Leave & Absence Management' },
  { code: 'admin.payroll_benefits',label: 'Payroll & Benefits' },
  { code: 'admin.performance',     label: 'Performance Management' },
  { code: 'admin.learning',        label: 'Learning & Development' },
  { code: 'admin.recruitment',     label: 'Recruitment Management' },
  { code: 'admin.compliance',      label: 'Compliance & Audit' },
  { code: 'admin.analytics',       label: 'Analytics & Reporting' },
  { code: 'admin.system_config',   label: 'System Configuration' },
  { code: 'admin.travel',          label: 'Travel Management' },
  { code: 'admin.assets',          label: 'Asset Management' },
  { code: 'admin.equipment',       label: 'Office Equipment' },
  { code: 'admin.supplies',        label: 'Office Supplies' },
  { code: 'admin.publications',    label: 'Publications' },
  { code: 'admin.internship',      label: 'Internship & Volunteer' },
]

// ── PermissionPanel (module-level to prevent remount on parent re-render) ────

function PermissionPanel({
  groupedPermissions,
  selected,
  setSelected,
}: {
  groupedPermissions: Record<string, Permission[]>
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
  // Sort: Admin Modules first, Navigation second, then alphabetical
  const sortedEntries = Object.entries(groupedPermissions).sort(([a], [b]) => {
    if (a === 'Admin Modules') return -1
    if (b === 'Admin Modules') return 1
    if (a === 'Navigation') return -1
    if (b === 'Navigation') return 1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '420px' }}>
      {sortedEntries.map(([category, perms]) => {
        const allChecked = perms.every(p => selected.has(p.id))
        const someChecked = perms.some(p => selected.has(p.id))
        const isAdminModules = category === 'Admin Modules'
        const isNavigation = category === 'Navigation'

        // Split Admin Modules into card-level (no dot after prefix) and submenu-level
        const cardPerms = isAdminModules
          ? perms.filter(p => (p.code.match(/\./g) ?? []).length === 1)
          : []
        const submenuPerms = isAdminModules
          ? perms.filter(p => (p.code.match(/\./g) ?? []).length === 2)
          : []

        return (
          <div key={category} className={`border rounded-lg p-3 ${isAdminModules ? 'border-indigo-200 bg-indigo-50/40' : isNavigation ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-100'}`}>
            {/* Category header with select-all */}
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                onChange={() => toggleCategory(perms, selected, setSelected)}
                className="w-4 h-4 rounded"
              />
              <span className={`text-sm font-semibold ${isAdminModules ? 'text-indigo-800' : isNavigation ? 'text-emerald-800' : 'text-gray-800'}`}>
                {category}
              </span>
              {isAdminModules && (
                <span className="text-xs text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                  Card + submenu access
                </span>
              )}
              {isNavigation && (
                <span className="text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  Sidebar visibility
                </span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {perms.filter(p => selected.has(p.id)).length}/{perms.length}
              </span>
            </label>

            {isAdminModules ? (
              // Render each card as a collapsible group with its submenus nested below
              <div className="space-y-2 pl-2">
                {ADMIN_CARD_PREFIXES.map(({ code: cardCode, label: cardLabel }) => {
                  const cardPerm = cardPerms.find(p => p.code === cardCode)
                  const subs = submenuPerms.filter(p => p.code.startsWith(cardCode + '.'))
                  if (!cardPerm && subs.length === 0) return null

                  const allSubsChecked = subs.every(p => selected.has(p.id))
                  const someSubsChecked = subs.some(p => selected.has(p.id))
                  const cardChecked = cardPerm ? selected.has(cardPerm.id) : false

                  // Select-all for this card: toggles card-level + all submenus
                  const toggleCard = () => {
                    const allOn = cardChecked && allSubsChecked
                    setSelected(prev => {
                      const next = new Set(prev)
                      const targets = [...(cardPerm ? [cardPerm] : []), ...subs]
                      if (allOn) targets.forEach(p => next.delete(p.id))
                      else targets.forEach(p => next.add(p.id))
                      return next
                    })
                  }

                  const allGroupChecked = cardChecked && allSubsChecked
                  const someGroupChecked = cardChecked || someSubsChecked

                  return (
                    <div key={cardCode} className="border border-indigo-100 rounded-md bg-white">
                      {/* Card-level row */}
                      <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allGroupChecked}
                          ref={(el) => { if (el) el.indeterminate = someGroupChecked && !allGroupChecked }}
                          onChange={toggleCard}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm font-semibold text-indigo-700">{cardLabel}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {(cardChecked ? 1 : 0) + subs.filter(p => selected.has(p.id)).length}/{(cardPerm ? 1 : 0) + subs.length}
                        </span>
                      </label>
                      {/* Card-level permission (show card in admin page) */}
                      {cardPerm && (
                        <div className="px-3 pb-1 border-t border-indigo-50">
                          <label className="flex items-center gap-2 py-1 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={selected.has(cardPerm.id)}
                              onChange={() => togglePermission(cardPerm.id, setSelected)}
                              className="w-3.5 h-3.5 rounded ml-5"
                            />
                            <span className="text-xs font-medium text-indigo-600">Show card in Admin page</span>
                          </label>
                        </div>
                      )}
                      {/* Submenu permissions */}
                      {subs.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 px-3 pb-2 border-t border-indigo-50">
                          {subs.map(p => (
                            <label key={p.id} className="flex items-center gap-2 py-0.5 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={selected.has(p.id)}
                                onChange={() => togglePermission(p.id, setSelected)}
                                className="w-3.5 h-3.5 rounded ml-5"
                              />
                              <span className="text-xs text-gray-700 group-hover:text-gray-900">{p.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : isNavigation ? (
              <div className="grid grid-cols-2 gap-1 pl-2">
                {perms.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-emerald-50 group">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => togglePermission(p.id, setSelected)}
                      className="w-4 h-4 rounded accent-emerald-600"
                    />
                    <span className="text-sm text-emerald-900 group-hover:text-emerald-700 truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-6">
                {perms.map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer py-0.5 group">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => togglePermission(p.id, setSelected)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function RBACPage() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles()
  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()
  const assignPermissions = useAssignPermissions()

  // Edit state
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set())

  // Create state
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPermissionIds, setNewPermissionIds] = useState<Set<string>>(new Set())

  // Delete state
  const [deletingRole, setDeletingRole] = useState<RoleWithPermissions | null>(null)

  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) acc[permission.category] = []
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, typeof permissions>)

  const getRoleColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'super admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-orange-100 text-orange-700'
      case 'hr manager': return 'bg-purple-100 text-purple-700'
      case 'manager': return 'bg-blue-100 text-blue-700'
      case 'employee': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  // ── Edit helpers ──────────────────────────────────────────────────────────
  function openEdit(role: RoleWithPermissions) {
    setEditingRole(role)
    setEditName(role.name)
    setEditDescription(role.description || '')
    setSelectedPermissionIds(new Set(role.permissions.map(p => p.id)))
  }

  async function handleSaveEdit() {
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

  // ── Create helpers ────────────────────────────────────────────────────────
  function openCreate() {
    setNewName('')
    setNewDescription('')
    setNewPermissionIds(new Set())
    setShowCreate(true)
  }

  async function handleCreate() {
    const created = await createRole.mutateAsync({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
    })
    if (created?.id && newPermissionIds.size > 0) {
      await assignPermissions.mutateAsync({
        roleId: created.id,
        permissionIds: Array.from(newPermissionIds),
      })
    }
    setShowCreate(false)
  }

  // ── Delete helpers ────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deletingRole) return
    await deleteRole.mutateAsync(deletingRole.id)
    setDeletingRole(null)
  }

  const isSavingEdit = updateRole.isPending || assignPermissions.isPending
  const isCreating = createRole.isPending || assignPermissions.isPending
  const isDeleting = deleteRole.isPending


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role-Based Access Control</h1>
          <p className="text-gray-600 mt-1">Manage roles and permissions for system access</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      {/* Stats */}
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

      {/* Roles Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Roles</h2>
        {rolesLoading ? (
          <p className="text-gray-500">Loading roles…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      <Badge className={getRoleColor(role.name)}>
                        {role.permissions?.length ?? 0} permissions
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(role)} title="Edit role">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {!role.is_system_role && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingRole(role)}
                        title="Delete role"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {role.description && (
                  <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase">Key Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions?.slice(0, 5).map((permission) => (
                      <Badge key={permission.id} className="bg-gray-100 text-gray-700 text-xs">
                        {permission.name}
                      </Badge>
                    ))}
                    {(role.permissions?.length ?? 0) > 5 && (
                      <Badge className="bg-gray-100 text-gray-500 text-xs">
                        +{(role.permissions?.length ?? 0) - 5} more
                      </Badge>
                    )}
                    {(role.permissions?.length ?? 0) === 0 && (
                      <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Catalogue */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissions Catalogue</h2>
        {permissionsLoading ? (
          <p className="text-gray-500">Loading permissions…</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <Card key={category} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <Badge className="bg-blue-100 text-blue-800">{perms.length} permissions</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {perms.map((permission) => (
                    <div key={permission.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                        {permission.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                        )}
                        <code className="text-[10px] text-gray-400">{permission.code}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Create Role Modal ─────────────────────────────────────────────── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="lg">
        <ModalHeader onClose={() => setShowCreate(false)}>
          Create New Role
        </ModalHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); handleCreate() }}
          className="flex flex-col flex-1 min-h-0"
        >
          <ModalBody>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Department Head"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <Input
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Brief description of this role's purpose"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Assign Permissions
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    {newPermissionIds.size} selected
                  </span>
                </p>
                <PermissionPanel groupedPermissions={groupedPermissions} selected={newPermissionIds} setSelected={setNewPermissionIds} />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreate(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !newName.trim()}>
              {isCreating ? 'Creating…' : 'Create Role'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── Edit Role Modal ───────────────────────────────────────────────── */}
      <Modal open={!!editingRole} onClose={() => setEditingRole(null)} size="lg">
        <ModalHeader onClose={() => setEditingRole(null)}>
          Edit Role: {editingRole?.name}
        </ModalHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSaveEdit() }}
          className="flex flex-col flex-1 min-h-0"
        >
          <ModalBody>
            <div className="space-y-5">
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

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Permissions
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    {selectedPermissionIds.size} selected
                  </span>
                </p>
                <PermissionPanel groupedPermissions={groupedPermissions} selected={selectedPermissionIds} setSelected={setSelectedPermissionIds} />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingRole(null)}
              disabled={isSavingEdit}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingEdit || !editName.trim()}>
              {isSavingEdit ? 'Saving…' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* ── Delete Confirmation ───────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={!!deletingRole}
        onClose={() => setDeletingRole(null)}
        onConfirm={handleDelete}
        title="Delete Role"
        message={`Are you sure you want to delete the "${deletingRole?.name}" role? This action cannot be undone and will remove all associated permissions.`}
        confirmText="Delete Role"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  )
}