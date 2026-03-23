'use client'

import { useState } from 'react'
import { Search, Grid, List, Mail, Phone, MapPin } from 'lucide-react'
import { useEmployees } from '@/hooks'
import { Card, Avatar, Badge } from '@/components/ui'
import type { EmployeeWithRelations } from '@/services'

export default function DirectoryPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')

  const { data: employees, isLoading } = useEmployees({ search: searchQuery, department: selectedDepartment, status: 'active' })
  const typedEmployees = (employees || []) as EmployeeWithRelations[]

  // Get unique departments
  const departments = Array.from(new Set(typedEmployees.map(e => e.department?.name).filter(Boolean)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
          <p className="text-gray-500 mt-1">Find and connect with colleagues</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-orange' : 'text-gray-500'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-orange' : 'text-gray-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, job title, or email..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange bg-white"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing <span className="font-medium text-gray-900">{typedEmployees.length}</span> employees
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && typedEmployees.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500">No employees found matching your criteria.</p>
        </Card>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && typedEmployees.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {typedEmployees.map((employee) => (
            <Card key={employee.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer">
              <div className="text-center">
                <Avatar
                  src={employee.avatar_url}
                  firstName={employee.first_name}
                  lastName={employee.last_name}
                  size="lg"
                  className="mx-auto mb-4"
                />
                <h3 className="font-semibold text-gray-900">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-sm text-orange mt-1">{employee.job_title?.title || 'No Title'}</p>
                <p className="text-sm text-gray-500 mt-1">{employee.department?.name || 'No Department'}</p>
                
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <a 
                    href={`mailto:${employee.email}`}
                    className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-orange"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{employee.email}</span>
                  </a>
                  {employee.phone && (
                    <a 
                      href={`tel:${employee.phone}`}
                      className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-orange"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{employee.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && typedEmployees.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {typedEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={employee.avatar_url}
                          firstName={employee.first_name}
                          lastName={employee.last_name}
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{employee.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {employee.job_title?.title || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {employee.department?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {employee.city || employee.country || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <a 
                          href={`mailto:${employee.email}`}
                          className="p-2 text-gray-400 hover:text-orange rounded hover:bg-orange/10"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        {employee.phone && (
                          <a 
                            href={`tel:${employee.phone}`}
                            className="p-2 text-gray-400 hover:text-orange rounded hover:bg-orange/10"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
