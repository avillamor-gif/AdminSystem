'use client'

import { useState } from 'react'
import { UserX, UserCheck, AlertCircle, Clock, CheckCircle, XCircle, Plus, Eye } from 'lucide-react'
import { Card, Button, Input, Badge, Avatar } from '@/components/ui'
import { useTerminationRequests } from '@/hooks/useTerminations'
import { useEmployees } from '@/hooks/useEmployees'
import Link from 'next/link'

export default function TerminationActivationPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: terminations = [], isLoading } = useTerminationRequests({ status: statusFilter || undefined })
  const { data: employees = [] } = useEmployees()

  const stats = {
    pending: terminations.filter(t => t.status === 'pending').length,
    approved: terminations.filter(t => t.status === 'approved').length,
    rejected: terminations.filter(t => t.status === 'rejected').length,
    completed: terminations.filter(t => t.status === 'completed').length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-700'
      case 'approved':
        return 'bg-blue-100 text-blue-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading terminations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Termination & Activation</h1>
          <p className="text-gray-600 mt-1">
            Manage employee terminations, resignations, and reactivations
          </p>
        </div>
        <Link href="/terminations/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Termination
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Pending Approval</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Approved</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{stats.approved}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Rejected</div>
              <div className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by employee name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </Card>

      {/* Terminations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Request #</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Working Date</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {terminations.map((termination) => {
                const employee = termination.employee
                return (
                  <tr key={termination.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{termination.request_number}</td>
                    <td className="px-4 py-3">
                      {employee ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={employee.avatar_url}
                            firstName={employee.first_name ?? ''}
                            lastName={employee.last_name ?? ''}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{employee.employee_id}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className="bg-purple-100 text-purple-700 capitalize">
                        {termination.termination_type?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 line-clamp-1">{termination.termination_reason}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {termination.proposed_last_working_date ? new Date(termination.proposed_last_working_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <Badge className={`${getStatusColor(termination.status ?? '')} flex items-center gap-1`}>
                          {getStatusIcon(termination.status ?? '')}
                          {termination.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/terminations/${termination.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
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

      {terminations.length === 0 && (
        <Card className="p-12 text-center">
          <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No termination requests</h3>
          <p className="text-gray-600 mb-4">All termination requests will appear here</p>
          <Link href="/terminations/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Termination Request
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
