'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, User, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, Button, Badge, Avatar } from '@/components/ui'
import { useTerminationRequest } from '@/hooks/useTerminations'
import Link from 'next/link'

export default function TerminationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const terminationId = params.id as string

  const { data: termination, isLoading } = useTerminationRequest(terminationId)

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
        <div className="text-gray-600">Loading termination details...</div>
      </div>
    )
  }

  if (!termination) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Termination request not found</div>
      </div>
    )
  }

  const employee = termination.employee

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Termination Request</h1>
            <p className="text-gray-600 mt-1">Request #{termination.request_number}</p>
          </div>
        </div>
        <Badge className={getStatusColor(termination.status)}>
          {termination.status}
        </Badge>
      </div>

      {/* Employee Information */}
      {employee && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h3>
          <div className="flex items-center gap-4">
            <Avatar
              src={employee.avatar_url}
              firstName={employee.first_name}
              lastName={employee.last_name}
              size="lg"
            />
            <div>
              <p className="text-lg font-semibold text-gray-900">
                {employee.first_name} {employee.last_name}
              </p>
              <p className="text-gray-600">{employee.employee_id}</p>
              <p className="text-gray-600">{employee.email}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Termination Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Termination Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Type</label>
              <p className="text-gray-900 capitalize">
                {termination.termination_type?.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Reason</label>
              <p className="text-gray-900">{termination.termination_reason}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Proposed Last Working Date</label>
              <p className="text-gray-900">
                {termination.proposed_last_working_date ? new Date(termination.proposed_last_working_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {termination.actual_last_working_date && (
              <div>
                <label className="text-sm text-gray-600">Actual Last Working Date</label>
                <p className="text-gray-900">
                  {new Date(termination.actual_last_working_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {termination.notice_period_days && (
              <div>
                <label className="text-sm text-gray-600">Notice Period</label>
                <p className="text-gray-900">{termination.notice_period_days} days</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Status</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {termination.exit_interview_scheduled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Exit Interview</p>
                <p className="text-sm text-gray-600">
                  {termination.exit_interview_completed ? 'Completed' : 
                   termination.exit_interview_scheduled ? 'Scheduled' : 'Not scheduled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {termination.clearance_completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Clearance</p>
                <p className="text-sm text-gray-600">
                  {termination.clearance_completed ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {termination.final_settlement_completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-900">Final Settlement</p>
                <p className="text-sm text-gray-600">
                  {termination.final_settlement_completed ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Notes */}
      {termination.notes && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{termination.notes}</p>
        </Card>
      )}

      {/* Approval Information */}
      {(termination.status === 'approved' || termination.status === 'rejected') && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {termination.status === 'approved' ? 'Approval' : 'Rejection'} Information
          </h3>
          <div className="space-y-2">
            {termination.approved_at && (
              <p className="text-gray-700">
                Date: {new Date(termination.approved_at).toLocaleString()}
              </p>
            )}
            {termination.rejection_reason && (
              <div>
                <label className="text-sm text-gray-600">Reason</label>
                <p className="text-gray-900">{termination.rejection_reason}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
