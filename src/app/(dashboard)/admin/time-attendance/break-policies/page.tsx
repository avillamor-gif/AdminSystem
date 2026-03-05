'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Coffee, Clock } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useBreakPolicies, useDeleteBreakPolicy } from '@/hooks/useTimeAttendance'
import { BreakPolicyFormModal } from '../components/BreakPolicyFormModal'
import type { BreakPolicy } from '@/services/timeAttendance.service'

export default function BreakPoliciesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [policyTypeFilter, setPolicyTypeFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<BreakPolicy | null>(null)

  const { data: policies = [], isLoading } = useBreakPolicies()
  const deleteMutation = useDeleteBreakPolicy()

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = !searchQuery || 
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (policy.description && policy.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = !policyTypeFilter || policy.break_type === policyTypeFilter
    return matchesSearch && matchesType
  })

  const handleEdit = (policy: BreakPolicy) => {
    setSelectedPolicy(policy)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this break policy?')) return
    await deleteMutation.mutateAsync(id)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedPolicy(null)
  }

  const stats = {
    total: filteredPolicies.length,
    paid: filteredPolicies.filter(p => p.is_paid).length,
    unpaid: filteredPolicies.filter(p => !p.is_paid).length,
    mandatory: filteredPolicies.filter(p => p.is_mandatory).length,
  }

  const getPolicyTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      lunch: 'bg-blue-100 text-blue-700',
      short: 'bg-green-100 text-green-700',
      rest: 'bg-purple-100 text-purple-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Break Policies</h1>
          <p className="text-gray-600 mt-1">
            Configure break time policies for different shift types
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Break Policy
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Policies</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Paid Breaks</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.paid}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Unpaid Breaks</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.unpaid}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Mandatory</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.mandatory}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}

            />
          </div>
          <div>
            <select
              value={policyTypeFilter}
              onChange={(e) => setPolicyTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Break Types</option>
              <option value="meal">Meal Break</option>
              <option value="rest">Rest Break</option>
              <option value="prayer">Prayer Break</option>
              <option value="smoking">Smoking Break</option>
              <option value="custom">Custom</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPolicies.map((policy) => (
                <tr key={policy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{policy.name}</div>
                      {policy.description && (
                        <div className="text-sm text-gray-500">{policy.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getPolicyTypeColor(policy.break_type)}>
                      {policy.break_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{policy.duration_minutes} min</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900">{policy.minimum_shift_hours ?? '—'} hrs</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {policy.is_paid ? (
                        <Badge className="bg-green-100 text-green-700">Paid</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">Unpaid</Badge>
                      )}
                      {policy.is_mandatory && (
                        <Badge className="bg-blue-100 text-blue-700">Mandatory</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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
          <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No break policies found</h3>
          <p className="text-gray-600 mb-4">Create your first break policy to get started</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Break Policy
          </Button>
        </Card>
      )}

      {/* Form Modal */}
      <BreakPolicyFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        policy={selectedPolicy}
      />
    </div>
  )
}
