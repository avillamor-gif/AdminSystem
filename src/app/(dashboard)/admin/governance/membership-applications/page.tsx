'use client'

import { useState } from 'react'
import { Search, ChevronRight, Mail, Phone, MapPin, Edit2, Check, X, MoreVertical, Send } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import {
  useMemberApplications,
  useMemberApplicationById,
  useApproveMemberApplication,
  useRejectMemberApplication,
  useRequestMoreInfoMemberApplication,
} from '@/hooks/useMemberApplication'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import type { MemberApplicationWithRelations } from '@/services/memberApplication.service'
import { formatDate } from '@/lib/utils'
import { SendMembershipInvitationModal } from './SendMembershipInvitationModal'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  more_info_needed: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function MembershipApplicationsPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('submitted')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [detailPanel, setDetailPanel] = useState(false)
  const [invitationModalOpen, setInvitationModalOpen] = useState(false)

  // Queries
  const { data: applications = [], isLoading } = useMemberApplications({ status: statusFilter })
  const { data: selectedApp } = useMemberApplicationById(selectedAppId || '')
  const { data: currentEmployee } = useCurrentEmployee()

  // Mutations
  const approveMutation = useApproveMemberApplication()
  const rejectMutation = useRejectMemberApplication()
  const requestInfoMutation = useRequestMoreInfoMemberApplication()

  // Filter
  const filtered = applications.filter(
    (app) =>
      app.first_name.toLowerCase().includes(query.toLowerCase()) ||
      app.last_name.toLowerCase().includes(query.toLowerCase()) ||
      app.email.toLowerCase().includes(query.toLowerCase()) ||
      app.reference_number?.includes(query)
  )

  async function handleApprove(appId: string) {
    if (!currentEmployee) return
    // For now, create a temporary member. In production, this should open a modal
    // to map the application to a new member record
    const tempMemberId = 'temp-' + Math.random().toString(36).substring(7)
    try {
      await approveMutation.mutateAsync({
        id: appId,
        createdMemberId: tempMemberId,
        reviewedBy: currentEmployee.employee_id,
      })
      setSelectedAppId(null)
      setDetailPanel(false)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleReject(appId: string, reason: string) {
    if (!currentEmployee) return
    try {
      await rejectMutation.mutateAsync({
        id: appId,
        reason,
        reviewedBy: currentEmployee.employee_id,
      })
      setSelectedAppId(null)
      setDetailPanel(false)
    } catch (error) {
      console.error(error)
    }
  }

  async function handleRequestInfo(appId: string, reason: string) {
    if (!currentEmployee) return
    try {
      await requestInfoMutation.mutateAsync({
        id: appId,
        reason,
        reviewedBy: currentEmployee.employee_id,
      })
      setSelectedAppId(null)
      setDetailPanel(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Applications</h1>
          <p className="text-gray-600 mt-1">Review and process new membership applications</p>
        </div>
        <Button
          onClick={() => setInvitationModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send Invitation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'New Applications', value: applications.filter((a) => a.status === 'submitted').length, color: 'blue' },
          { label: 'Under Review', value: applications.filter((a) => a.status === 'under_review').length, color: 'yellow' },
          { label: 'Approved', value: applications.filter((a) => a.status === 'approved').length, color: 'green' },
          { label: 'Rejected', value: applications.filter((a) => a.status === 'rejected').length, color: 'red' },
        ].map((stat) => (
          <Card key={stat.label}>
            <div className="p-4">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 text-${stat.color}-600`}>{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 border-b flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or reference..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <option value="submitted">New (Submitted)</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-6 text-center text-gray-400">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No applications found</div>
        ) : (
          <div className="divide-y">
            {filtered.map((app) => (
              <div
                key={app.id}
                onClick={() => {
                  setSelectedAppId(app.id)
                  setDetailPanel(true)
                }}
                className="p-4 hover:bg-gray-50 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                      {app.first_name.charAt(0)}
                      {app.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.first_name} {app.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.reference_number} • {app.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className={STATUS_COLORS[app.status]}>
                    {app.status.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">{formatDate(app.submitted_at || app.created_at || '')}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail Panel */}
      {detailPanel && selectedApp && <ApplicationDetailPanel app={selectedApp} onClose={() => setDetailPanel(false)} onApprove={handleApprove} onReject={handleReject} onRequestInfo={handleRequestInfo} />}

      {/* Send Invitation Modal */}
      <SendMembershipInvitationModal
        isOpen={invitationModalOpen}
        onClose={() => setInvitationModalOpen(false)}
      />
    </div>
  )
}

function ApplicationDetailPanel({
  app,
  onClose,
  onApprove,
  onReject,
  onRequestInfo,
}: {
  app: MemberApplicationWithRelations
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
  onRequestInfo: (id: string, reason: string) => void
}) {
  const [tab, setTab] = useState<'profile' | 'background' | 'engagement' | 'review'>('profile')
  const [rejectReason, setRejectReason] = useState('')
  const [infoReason, setInfoReason] = useState('')

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[600px] bg-white shadow-2xl flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700 text-lg">
            {app.first_name.charAt(0)}
            {app.last_name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {app.first_name} {app.last_name}
            </p>
            <p className="text-sm text-gray-500">{app.reference_number}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-4 px-6">
        {['profile', 'background', 'engagement', 'review'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === t ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t === 'profile' ? 'Profile' : t === 'background' ? 'Background' : t === 'engagement' ? 'Engagement' : 'Review'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {tab === 'profile' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <p className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" /> {app.email}
              </p>
            </div>
            {app.phone_home && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone (Home)</label>
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" /> {app.phone_home}
                </p>
              </div>
            )}
            {app.phone_office && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone (Office)</label>
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" /> {app.phone_office}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Age</label>
                <p className="text-sm">{app.age || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Citizenship</label>
                <p className="text-sm">{app.citizenship}</p>
              </div>
            </div>
            {app.home_address && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Home Address</label>
                <p className="flex gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{app.home_address}</span>
                </p>
              </div>
            )}
            {app.office_address && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Office Address</label>
                <p className="flex gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{app.office_address}</span>
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'background' && (
          <div className="space-y-4">
            {app.education && app.education.length > 0 ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                <div className="space-y-2">
                  {app.education.map((edu) => (
                    <div key={edu.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">{edu.institution_name}</p>
                      <p className="text-gray-600">
                        {edu.highest_attainment} • {edu.years_inclusive}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {app.affiliations && app.affiliations.length > 0 ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Organizational Affiliation</h4>
                <div className="space-y-2">
                  {app.affiliations.map((aff) => (
                    <div key={aff.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">{aff.organization_name}</p>
                      <p className="text-gray-600">
                        {aff.position} • {aff.years_involved} years • {aff.organization_type}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {tab === 'engagement' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">How they learned about IBON</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{app.how_learned_about_ibon}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Why they want to join</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{app.why_join}</p>
            </div>
            {app.publications_read && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Publications read</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{app.publications_read}</p>
              </div>
            )}

            {app.engagements && app.engagements.length > 0 ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">IBON Engagement History</h4>
                <div className="space-y-2">
                  {app.engagements.map((eng) => (
                    <div key={eng.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">{eng.title}</p>
                      <p className="text-gray-600">
                        {eng.participation_type} • {eng.date_participated} • {eng.location}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No IBON engagement history provided</p>
            )}
          </div>
        )}

        {tab === 'review' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Endorser</label>
              <p className="font-medium text-gray-900">{app.endorser_name}</p>
              <p className="text-sm text-gray-600">
                {app.endorser_relationship} • {app.endorser_email}
              </p>
              {app.endorser_verified ? (
                <Badge variant="success" className="mt-2">
                  ✓ Verified
                </Badge>
              ) : (
                <Badge variant="warning" className="mt-2">
                  Pending Verification
                </Badge>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Admin Notes</label>
              <textarea
                placeholder="Add internal notes about this application..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                rows={3}
              />
            </div>

            {app.status === 'rejected' && app.admin_decision_reason && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rejection Reason</label>
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{app.admin_decision_reason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {['submitted', 'under_review', 'more_info_needed'].includes(app.status) && (
        <div className="px-6 py-4 border-t space-y-3">
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => onApprove(app.id)}
            >
              <Check className="w-4 h-4" />
              Approve
            </Button>
            <Button
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2"
              onClick={() => {
                const reason = prompt('Enter rejection reason:')
                if (reason) onReject(app.id, reason)
              }}
            >
              <X className="w-4 h-4" />
              Reject
            </Button>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              const reason = prompt('What information do you need?')
              if (reason) onRequestInfo(app.id, reason)
            }}
          >
            Request More Info
          </Button>
        </div>
      )}
    </div>
  )
}
