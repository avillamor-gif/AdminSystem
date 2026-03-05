'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, TrendingUp, DollarSign } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useOvertimeRules, useDeleteOvertimeRule } from '@/hooks/useTimeAttendance'
import { OvertimeRuleFormModal } from '../components/OvertimeRuleFormModal'
import type { OvertimeRule } from '@/services/timeAttendance.service'

export default function OvertimeRulesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [ruleTypeFilter, setRuleTypeFilter] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<OvertimeRule | null>(null)

  const { data: rules = [], isLoading } = useOvertimeRules()
  const deleteMutation = useDeleteOvertimeRule()

  const filteredRules = rules.filter(rule => {
    const matchesSearch = !searchQuery || 
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.description && rule.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = !ruleTypeFilter || rule.rule_type === ruleTypeFilter
    return matchesSearch && matchesType
  })

  const handleEdit = (rule: OvertimeRule) => {
    setSelectedRule(rule)
    setIsFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this overtime rule?')) return
    await deleteMutation.mutateAsync(id)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setSelectedRule(null)
  }

  const stats = {
    total: filteredRules.length,
    daily: filteredRules.filter(r => r.rule_type === 'daily').length,
    weekly: filteredRules.filter(r => r.rule_type === 'weekly').length,
    requireApproval: filteredRules.filter(r => r.requires_approval).length,
  }

  const getRuleTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      daily: 'bg-blue-100 text-blue-700',
      weekly: 'bg-green-100 text-green-700',
      holiday: 'bg-red-100 text-red-700',
      weekend: 'bg-purple-100 text-purple-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overtime Rules</h1>
          <p className="text-gray-600 mt-1">
            Configure overtime calculation rules and approval workflows
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Overtime Rule
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Rules</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Daily Rules</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.daily}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Weekly Rules</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.weekly}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Require Approval</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.requireApproval}</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input
              type="text"
              placeholder="Search rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div>
            <select
              value={ruleTypeFilter}
              onChange={(e) => setRuleTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Rule Types</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="holiday">Holiday</option>
              <option value="weekend">Weekend</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Rules Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Multiplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{rule.name}</div>
                      {rule.description && (
                        <div className="text-sm text-gray-500">{rule.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getRuleTypeColor(rule.rule_type)}>
                      {rule.rule_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{rule.threshold_hours} hrs</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-gray-900">{rule.multiplier}x</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {rule.requires_approval ? (
                      <Badge className="bg-orange-100 text-orange-700">Required</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Auto</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
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

      {filteredRules.length === 0 && (
        <Card className="p-12 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No overtime rules found</h3>
          <p className="text-gray-600 mb-4">Create your first overtime rule to get started</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Overtime Rule
          </Button>
        </Card>
      )}

      {/* Form Modal */}
      <OvertimeRuleFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        rule={selectedRule}
      />
    </div>
  )
}
