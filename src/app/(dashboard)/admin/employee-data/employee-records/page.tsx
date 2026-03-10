'use client'

import { useState, useRef } from 'react'
import { FileText, Download, Eye, Trash2, Upload, Shield, Clock, CheckCircle } from 'lucide-react'
import { Card, Button, Input, Badge, Avatar } from '@/components/ui'
import { useEmployees } from '@/hooks/useEmployees'
import { useEmployeeAttachments, useUploadEmployeeAttachment, useDownloadEmployeeAttachment, useDeleteEmployeeAttachment } from '@/hooks/useEmployeeAttachments'
import { useEmployeeAuditLogs } from '@/hooks/useEmployeeAuditLogs'
import { useEmployeeCompliance, useToggleComplianceItem, useCreateDefaultComplianceItems } from '@/hooks/useEmployeeCompliance'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function EmployeeRecordsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: employees = [], isLoading } = useEmployees({ search: searchQuery })
  const { data: attachments = [] } = useEmployeeAttachments(selectedEmployee || '')
  const uploadMutation = useUploadEmployeeAttachment()
  const downloadMutation = useDownloadEmployeeAttachment()
  const deleteMutation = useDeleteEmployeeAttachment()
  const { data: auditLogs = [], isLoading: isLoadingAuditLogs } = useEmployeeAuditLogs(selectedEmployee || '')
  const { data: complianceItems = [], isLoading: isLoadingCompliance } = useEmployeeCompliance(selectedEmployee || '')
  const toggleCompliance = useToggleComplianceItem()
  const createDefaultCompliance = useCreateDefaultComplianceItems()

  const handleUploadClick = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee first')
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEmployee) return

    try {
      await uploadMutation.mutateAsync({
        employeeId: selectedEmployee,
        file,
        description: file.name,
        documentType: 'other',
      })
      toast.success('File uploaded successfully')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    }
  }

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      await downloadMutation.mutateAsync({ filePath, fileName })
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download file')
    }
  }

  const handleDelete = async (attachmentId: string, filePath: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await deleteMutation.mutateAsync({ id: attachmentId, filePath, employeeId: selectedEmployee || '' })
      toast.success('Document deleted successfully')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const stats = {
    totalEmployees: employees.length,
    completeRecords: employees.filter(e => e.status === 'active').length,
    pendingReview: Math.floor(employees.length * 0.1),
    archived: employees.filter(e => e.status === 'terminated').length,
  }

  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Records</h1>
        <p className="text-gray-600 mt-1">
          Manage employee documents, compliance records, and audit trail
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Employees</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Complete Records</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.completeRecords}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending Review</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingReview}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Archived</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{stats.archived}</div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Employee List */}
        <div className="col-span-4">
          <Card>
            <div className="p-4 border-b border-gray-200">
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {employees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedEmployee === employee.id ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={employee.avatar_url}
                      firstName={employee.first_name}
                      lastName={employee.last_name}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{employee.employee_id}</p>
                    </div>
                    <Badge className={employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                      {employee.status}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Record Details */}
        <div className="col-span-8">
          {selectedEmployeeData ? (
            <div className="space-y-6">
              {/* Employee Header */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={selectedEmployeeData.avatar_url}
                      firstName={selectedEmployeeData.first_name}
                      lastName={selectedEmployeeData.last_name}
                      size="lg"
                    />
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedEmployeeData.first_name} {selectedEmployeeData.last_name}
                      </h2>
                      <p className="text-gray-600">{selectedEmployeeData.employee_id}</p>
                    </div>
                  </div>
                  <Link href={`/admin/employee-data/employee-profiles/${selectedEmployeeData.employee_id}`}>
                    <Button variant="secondary">
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Profile
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Documents */}
              <Card>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Documents & Attachments</h3>
                  <Button size="sm" onClick={handleUploadClick} disabled={uploadMutation.isPending}>
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
                <div className="divide-y divide-gray-200">
                  {attachments.length > 0 ? (
                    attachments.map((attachment) => (
                      <div key={attachment.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{attachment.file_name}</p>
                            <p className="text-sm text-gray-500">Uploaded {new Date(attachment.created_at ?? '').toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(attachment.file_path, attachment.file_name)}
                            disabled={downloadMutation.isPending}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(attachment.id, attachment.file_path)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No documents uploaded</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Compliance Status */}
              <Card>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Compliance Checklist</h3>
                  {complianceItems.length === 0 && !isLoadingCompliance && (
                    <Button size="sm" variant="secondary" onClick={() => createDefaultCompliance.mutate(selectedEmployee!)}>
                      Initialize Checklist
                    </Button>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  {isLoadingCompliance ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
                  ) : complianceItems.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No compliance items. Click "Initialize Checklist" to create defaults.
                    </div>
                  ) : (
                    complianceItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <button
                          onClick={() => toggleCompliance.mutate({
                            id: item.id,
                            isComplete: !item.is_complete,
                            employeeId: item.employee_id,
                          })}
                          disabled={toggleCompliance.isPending}
                          className="focus:outline-none"
                        >
                          {item.is_complete ? (
                            <Badge className="bg-green-100 text-green-700 flex items-center gap-1 cursor-pointer hover:bg-green-200">
                              <CheckCircle className="w-3 h-3" />
                              Complete
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-700 flex items-center gap-1 cursor-pointer hover:bg-orange-200">
                              <Clock className="w-3 h-3" />
                              Pending
                            </Badge>
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Audit Trail */}
              <Card>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-4 space-y-3">
                  {isLoadingAuditLogs ? (
                    <div className="text-center py-4 text-gray-500 text-sm">Loading...</div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-6">
                      <Shield className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No activity recorded yet</p>
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Shield className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} by {log.changed_by}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employee selected</h3>
              <p className="text-gray-600">Select an employee from the list to view their records</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
