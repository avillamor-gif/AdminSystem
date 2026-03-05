'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Shield, Star, AlertCircle } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useAttendancePolicies, useDeleteAttendancePolicy, useSetDefaultAttendancePolicy } from '@/hooks/useTimeAttendance'
import { AttendancePolicyFormModal } from '../components/AttendancePolicyFormModal'
import type { AttendancePolicy } from '@/services/timeAttendance.service'

export default function AttendancePoliciesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [policyTypeFilter, setPolicyTypeFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<AttendancePolicy | null>(null)

  const { data: policies = [], isLoading } = useAttendancePolicies()
  const deleteMutation = useDeleteAttendancePolicy()
  const setDefaultMutation = useSetDefaultAttendancePolicy()

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = !searchQuery || 
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (policy.description && policy.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = !policyTypeFilter || policy.policy_type === policyTypeFilter
    return matchesSearch && matchesType
  })

  const handleEdit = (policy: AttendancePolicy) => {
    setSelectedPolicy(policy)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendance policy?')) return
    await deleteMutation.mutateAsync(id)
  }

  const handleSetDefault = async (id: string) => {
    await setDefaultMutation.mutateAsync(id)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedPolicy(null)
  }

  const stats = {
    total: filteredPolicies.length,
    comprehensive: filteredPolicies.filter(p => (p.policy_type as string) === 'comprehensive').length,
    defaultPolicy: filteredPolicies.find(p => p.is_default)?.name || 'None',
  }

  const getPolicyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      comprehensive: 'bg-blue-100 text-blue-700',
      tardiness: 'bg-yellow-100 text-yellow-700',
      absence: 'bg-red-100 text-red-700',
      early_departure: 'bg-orange-100 text-orange-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Policies</h1>
          <p className="text-gray-600 mt-1">
            Configure attendance rules and violation management
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Attendance Policy
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Policies</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Comprehensive</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.comprehensive}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Default Policy</div>
          <div className="text-lg font-semibold text-orange-600 mt-1 truncate">{stats.defaultPolicy}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div>
            <select
              value={policyTypeFilter}
              onChange={(e) => setPolicyTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Policy Types</option>
              <option value="comprehensive">Comprehensive</option>
              <option value="tardiness">Tardiness Only</option>
              <option value="absence">Absence Only</option>
              <option value="early_departure">Early Departure Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Policies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tardiness</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Penalties</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{policy.name}</span>
                        {policy.is_default && (
                          <Badge className="bg-orange-100 text-orange-700">
                            <Star className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                      {policy.description && (
                        <div className="text-sm text-gray-500">{policy.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getPolicyTypeColor(policy.policy_type)}>
                      {policy.policy_type.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900">
                        Grace: {formatMinutes(policy.grace_period_minutes)}
                      </div>
                      {policy.max_consecutive_absences > 0 && (
                        <div className="text-gray-500">
                          Max consec: {policy.max_consecutive_absences}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {policy.max_consecutive_absences > 0 ? (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-gray-900">Max {policy.max_consecutive_absences} consecutive</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No limit</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {policy.late_action === 'warning' && (
                        <Badge className="bg-yellow-100 text-yellow-700">Warning</Badge>
                      )}
                      {policy.late_action === 'deduction' && (
                        <Badge className="bg-red-100 text-red-700">Deduction</Badge>
                      )}
                      {policy.late_action === 'half_day' && (
                        <Badge className="bg-purple-100 text-purple-700">Half Day</Badge>
                      )}
                      {policy.requires_manager_approval && (
                        <Badge className="bg-blue-100 text-blue-700">Notify</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!policy.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(policy.id)}
                          disabled={setDefaultMutation.isPending}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(policy.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredPolicies.length === 0 && (
        <Card className="p-12 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance policies found</h3>
          <p className="text-gray-600 mb-4">Create your first attendance policy to get started</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Attendance Policy
          </Button>
        </Card>
      )}

      {/* Form Modal */}
      <AttendancePolicyFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        policy={selectedPolicy}
      />
    </div>
  )
}
