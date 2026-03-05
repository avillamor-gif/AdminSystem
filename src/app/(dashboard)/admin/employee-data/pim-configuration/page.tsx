'use client'

import { useState } from 'react'
import { Save, Eye, EyeOff, Lock, Unlock, Shield } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import { usePIMConfig, useUpdatePIMConfig } from '@/hooks/useEmployeeData'
import toast from 'react-hot-toast'

interface FieldConfig {
  field_name: string
  display_name: string
  field_group: string
  is_required: boolean
  is_visible: boolean
  is_editable: boolean
  is_sensitive: boolean
  show_in_employee_list: boolean
  show_in_employee_profile: boolean
  show_in_reports: boolean
  access_level: string
}

export default function PimConfigurationPage() {
  const { data: pimConfig = [], isLoading } = usePIMConfig()
  const updateMutation = useUpdatePIMConfig()
  const [selectedGroup, setSelectedGroup] = useState('all')

  const groups = [
    { id: 'all', name: 'All Fields', count: pimConfig.length },
    { id: 'basic', name: 'Basic Information', count: pimConfig.filter(f => f.field_group === 'basic').length },
    { id: 'contact', name: 'Contact Details', count: pimConfig.filter(f => f.field_group === 'contact').length },
    { id: 'job', name: 'Job Information', count: pimConfig.filter(f => f.field_group === 'job').length },
    { id: 'personal', name: 'Personal Details', count: pimConfig.filter(f => f.field_group === 'personal').length },
    { id: 'emergency', name: 'Emergency Contact', count: pimConfig.filter(f => f.field_group === 'emergency').length },
    { id: 'documents', name: 'Documents', count: pimConfig.filter(f => f.field_group === 'documents').length },
  ]

  const filteredConfig = selectedGroup === 'all' 
    ? pimConfig 
    : pimConfig.filter(f => f.field_group === selectedGroup)

  const toggleVisibility = async (id: string, currentValue: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { is_visible: !currentValue } })
    } catch (error) {
      console.error('Error updating field:', error)
    }
  }

  const toggleRequired = async (id: string, currentValue: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { is_required: !currentValue } })
    } catch (error) {
      console.error('Error updating field:', error)
    }
  }

  const toggleEditable = async (id: string, currentValue: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, updates: { is_editable: !currentValue } })
    } catch (error) {
      console.error('Error updating field:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading PIM configuration...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PIM Configuration</h1>
          <p className="text-gray-600 mt-1">
            Configure field visibility, requirements, and access levels
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Field Groups</h3>
            <div className="space-y-1">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedGroup === group.id
                      ? 'bg-orange-50 text-orange-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{group.name}</span>
                    <Badge className="bg-gray-100 text-gray-700">{group.count}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          <Card>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {groups.find(g => g.id === selectedGroup)?.name || 'All Fields'}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Field Name</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Visible</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Required</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Editable</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Sensitive</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredConfig.map((field: any) => (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{field.display_name}</div>
                          <div className="text-xs text-gray-500">{field.field_name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleVisibility(field.id, field.is_visible)}
                          className={`p-1 rounded ${
                            field.is_visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {field.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRequired(field.id, field.is_required)}
                          className={`px-2 py-1 rounded text-xs ${
                            field.is_required ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {field.is_required ? 'Yes' : 'No'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleEditable(field.id, field.is_editable)}
                          className={`p-1 rounded ${
                            field.is_editable ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'
                          }`}
                        >
                          {field.is_editable ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {field.is_sensitive && (
                          <Shield className="w-4 h-4 text-orange-600 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`${
                          field.access_level === 'public' ? 'bg-green-100 text-green-700' :
                          field.access_level === 'internal' ? 'bg-blue-100 text-blue-700' :
                          field.access_level === 'restricted' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {field.access_level}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
