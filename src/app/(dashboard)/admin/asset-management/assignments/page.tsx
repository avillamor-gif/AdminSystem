'use client'

import { useState } from 'react'
import { useAssetAssignments, useAssets, useAssignAsset, useReturnAsset, type Asset } from '@/hooks/useAssets'
import { useEmployees } from '@/hooks/useEmployees'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Package, Plus, UserCheck, RotateCcw, Calendar, ClipboardList, CheckCheck } from 'lucide-react'

export default function AssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [assignFormData, setAssignFormData] = useState({
    asset_id: '',
    employee_id: '',
    condition: 'good'
  })
  const [returnFormData, setReturnFormData] = useState({
    condition: 'good',
    notes: ''
  })

  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useAssetAssignments({
    is_active: statusFilter === 'active' ? true : statusFilter === 'returned' ? false : undefined
  })
  const { data: assets = [], refetch: refetchAssets } = useAssets({ status: 'available' })
  const { data: employees = [] } = useEmployees()
  const assignMutation = useAssignAsset()
  const returnMutation = useReturnAsset()

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => !a.returned_date).length,
    returned: assignments.filter(a => a.returned_date).length
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    await assignMutation.mutateAsync({
      assetId: assignFormData.asset_id,
      employeeId: assignFormData.employee_id,
      assignedBy: assignFormData.employee_id,
      condition: assignFormData.condition
    })
    setShowAssignModal(false)
    setAssignFormData({ asset_id: '', employee_id: '', condition: 'good' })
  }

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAssignment) {
      await returnMutation.mutateAsync({
        assignmentId: selectedAssignment.id,
        returnedBy: selectedAssignment.employee_id,
        ...returnFormData
      })
      setShowReturnModal(false)
      setSelectedAssignment(null)
      setReturnFormData({ condition: 'good', notes: '' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Assignments</h1>
          <p className="text-gray-600">Track asset assignments and returns</p>
        </div>
        <Button onClick={() => { refetchAssets(); setShowAssignModal(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Assign Asset
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-blue-100 rounded-xl mb-3">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-1">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Assignments</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-orange-100 rounded-xl mb-3">
            <UserCheck className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600 mb-1">{stats.active}</p>
          <p className="text-sm text-gray-500">Currently Assigned</p>
        </Card>
        <Card className="p-6 flex flex-col items-center text-center">
          <div className="p-3 bg-green-100 rounded-xl mb-3">
            <CheckCheck className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 mb-1">{stats.returned}</p>
          <p className="text-sm text-gray-500">Returned</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Assignments</option>
          <option value="active">Active</option>
          <option value="returned">Returned</option>
        </select>
      </Card>

      {/* Assignments Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Assignment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returned Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition (Assign)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition (Return)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assignmentsLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : assignmentsError ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-red-500">
                    Error loading assignments: {(assignmentsError as any)?.message}
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No assignments found</td>
                </tr>
              ) : (
                assignments.map(assignment => (
                  <tr key={assignment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{assignment.asset?.name}</div>
                          <div className="text-sm text-gray-500">{assignment.asset?.asset_tag}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {assignment.employee
                        ? `${assignment.employee.first_name} ${assignment.employee.last_name}`
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(assignment.assigned_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.returned_date
                        ? new Date(assignment.returned_date).toLocaleDateString()
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment.condition_on_assignment && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {assignment.condition_on_assignment}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment.condition_on_return && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {assignment.condition_on_return}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment.returned_date ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Returned</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {!assignment.returned_date && (
                          <button
                            onClick={() => { setSelectedAssignment(assignment); setShowReturnModal(true) }}
                            title="Return"
                            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Assign Asset Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <form onSubmit={handleAssign}>
          <ModalHeader onClose={() => setShowAssignModal(false)}>
            Assign Asset to Employee
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Asset"
                value={assignFormData.asset_id}
                onChange={(e) => setAssignFormData({ ...assignFormData, asset_id: e.target.value })}
                required
              >
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>
                    {asset.asset_tag} - {asset.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Employee"
                value={assignFormData.employee_id}
                onChange={(e) => setAssignFormData({ ...assignFormData, employee_id: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </Select>

              <Select
                label="Condition"
                value={assignFormData.condition}
                onChange={(e) => setAssignFormData({ ...assignFormData, condition: e.target.value })}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Assign</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Return Asset Modal */}
      <Modal open={showReturnModal} onClose={() => setShowReturnModal(false)}>
        <form onSubmit={handleReturn}>
          <ModalHeader onClose={() => setShowReturnModal(false)}>
            Return Asset
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Asset</div>
                <div className="font-medium">{selectedAssignment?.asset?.name}</div>
                <div className="text-sm text-gray-500">{selectedAssignment?.asset?.asset_tag}</div>
              </div>

              <Select
                label="Return Condition"
                value={returnFormData.condition}
                onChange={(e) => setReturnFormData({ ...returnFormData, condition: e.target.value })}
                required
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </Select>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  value={returnFormData.notes}
                  onChange={(e) => setReturnFormData({ ...returnFormData, notes: e.target.value })}
                  placeholder="Any damages or issues to report..."
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setShowReturnModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Return Asset</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
