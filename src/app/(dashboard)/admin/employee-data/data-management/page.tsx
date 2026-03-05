'use client'

import { useState } from 'react'
import { Search, Upload, Download, RefreshCw, CheckSquare, Trash2, Edit2, AlertCircle, Users } from 'lucide-react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { useEmployees } from '@/hooks/useEmployees'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function DataManagementPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState('')

  const { data: employees = [], isLoading } = useEmployees({ search: searchQuery })

  const handleSelectAll = () => {
    if (selectedEmployees.size === employees.length) {
      setSelectedEmployees(new Set())
    } else {
      setSelectedEmployees(new Set(employees.map(e => e.id)))
    }
  }

  const handleSelectEmployee = (id: string) => {
    const newSelected = new Set(selectedEmployees)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedEmployees(newSelected)
  }

  const handleBulkAction = () => {
    if (!bulkAction || selectedEmployees.size === 0) return
    
    switch (bulkAction) {
      case 'export':
        toast.success(`Exporting ${selectedEmployees.size} employees...`)
        break
      case 'deactivate':
        toast.success(`Deactivating ${selectedEmployees.size} employees...`)
        break
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedEmployees.size} employees?`)) {
          toast.success(`Deleting ${selectedEmployees.size} employees...`)
        }
        break
      default:
        toast.error('Invalid bulk action')
    }
  }

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    duplicates: 0,
    incomplete: employees.filter(e => !e.phone || !e.date_of_birth).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
          <p className="text-gray-600 mt-1">
            Bulk operations, data validation, and duplicate detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Validate Data
          </Button>
          <Button variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Records</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Active Employees</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Incomplete Profiles</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.incomplete}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Potential Duplicates</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.duplicates}</div>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedEmployees.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedEmployees.size} employee(s) selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-1.5 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Action...</option>
                <option value="export">Export Selected</option>
                <option value="deactivate">Deactivate</option>
                <option value="delete">Delete</option>
              </select>
              <Button onClick={handleBulkAction} size="sm">
                Apply
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedEmployees(new Set())}>
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.size === employees.length && employees.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Data Quality</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => {
                const isComplete = !!(employee.phone && employee.date_of_birth && employee.address)
                return (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.has(employee.id)}
                        onChange={() => handleSelectEmployee(employee.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{employee.employee_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{employee.email}</td>
                    <td className="px-4 py-3">
                      <Badge className={employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {isComplete ? (
                        <Badge className="bg-green-100 text-green-700">Complete</Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" />
                          Incomplete
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/employees/${employee.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {employees.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </Card>
      )}
    </div>
  )
}
