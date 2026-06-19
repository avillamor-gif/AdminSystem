'use client'

import { useState } from 'react'
import { Search, ChevronRight, Mail, Send, RefreshCw, Trash2, Clock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import {
  useMembershipInvitations,
  useResendMembershipInvitation,
  useDeleteMembershipInvitation,
} from '@/hooks/useMembershipInvitation'
import { formatDate } from '@/lib/utils'
import { SendMembershipInvitationModal } from './SendMembershipInvitationModal'
import type { MembershipInvitation } from '@/services/membershipInvitation.service'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-yellow-100 text-yellow-700',
}

const STATUS_ICONS: Record<string, React.ComponentType<any>> = {
  pending: Clock,
  sent: Mail,
  accepted: CheckCircle,
  rejected: AlertCircle,
  expired: AlertCircle,
}

export default function MembershipInvitationsPage() {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('sent')
  const [selectedInvitation, setSelectedInvitation] = useState<MembershipInvitation | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [invitationModalOpen, setInvitationModalOpen] = useState(false)

  // Queries
  const { data: invitations = [], isLoading } = useMembershipInvitations({
    status: statusFilter,
  })

  // Mutations
  const resendMutation = useResendMembershipInvitation()
  const deleteMutation = useDeleteMembershipInvitation()

  // Filter
  const filtered = invitations.filter(
    (inv) =>
      inv.target_name?.toLowerCase().includes(query.toLowerCase()) ||
      inv.email.toLowerCase().includes(query.toLowerCase()) ||
      inv.invitation_code?.includes(query)
  )

  const handleResend = async (id: string) => {
    if (confirm('Resend this invitation?')) {
      await resendMutation.mutateAsync(id)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this invitation? This cannot be undone.')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membership Invitations</h1>
          <p className="text-gray-600 mt-1">Manage and track membership invitations</p>
        </div>
        <Button
          onClick={() => setInvitationModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send New Invitation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Pending', value: invitations.filter((i) => i.status === 'pending').length, color: 'gray' },
          { label: 'Sent', value: invitations.filter((i) => i.status === 'sent').length, color: 'blue' },
          { label: 'Accepted', value: invitations.filter((i) => i.status === 'accepted').length, color: 'green' },
          { label: 'Rejected', value: invitations.filter((i) => i.status === 'rejected').length, color: 'red' },
          { label: 'Expired', value: invitations.filter((i) => i.status === 'expired').length, color: 'yellow' },
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
              placeholder="Search by name, email, or code..."
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
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
            <option value="">All Statuses</option>
          </select>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="p-6 text-center text-gray-400">Loading invitations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No invitations found</div>
        ) : (
          <div className="divide-y">
            {filtered.map((invitation) => {
              const Icon = STATUS_ICONS[invitation.status] || Mail
              return (
                <div
                  key={invitation.id}
                  onClick={() => setSelectedInvitation(invitation)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {invitation.target_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> {invitation.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="ml-13 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="font-medium capitalize">{invitation.invitation_type}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Sent:</span>
                          <p className="font-medium">
                            {invitation.sent_at ? formatDate(invitation.sent_at) : '—'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Expires:</span>
                          <p className="font-medium">
                            {invitation.expires_at ? formatDate(invitation.expires_at) : '—'}
                          </p>
                        </div>
                      </div>

                      {invitation.referrer_name && invitation.invitation_type === 'referred' && (
                        <p className="text-sm text-gray-600 mt-2">
                          Referred by: <span className="font-medium">{invitation.referrer_name}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className={STATUS_COLORS[invitation.status]}>
                        {invitation.status}
                      </Badge>

                      {/* Resend button for sent/pending invitations */}
                      {['sent', 'pending'].includes(invitation.status) && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleResend(invitation.id)
                          }}
                          disabled={resendMutation.isPending}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          variant="ghost"
                          title="Resend invitation"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}

                      {/* Delete button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(invitation.id)
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        variant="ghost"
                        title="Delete invitation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>

                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Detail Panel */}
      {selectedInvitation && (
        <div className="fixed inset-y-0 right-0 z-40 w-[400px] bg-white shadow-2xl flex flex-col border-l border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Mail className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedInvitation.target_name}</p>
                <p className="text-sm text-gray-500">{selectedInvitation.email}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedInvitation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Status</label>
              <Badge
                variant="secondary"
                className={`${STATUS_COLORS[selectedInvitation.status]} text-center`}
              >
                {selectedInvitation.status}
              </Badge>
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Invitation Type</label>
              <p className="text-sm font-medium capitalize">{selectedInvitation.invitation_type}</p>
            </div>

            {/* Referrer */}
            {selectedInvitation.referrer_name && selectedInvitation.invitation_type === 'referred' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Referred By</label>
                <p className="text-sm font-medium">{selectedInvitation.referrer_name}</p>
              </div>
            )}

            {/* Code */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Invitation Code</label>
              <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedInvitation.invitation_code}</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Created</label>
                <p className="text-sm">
                  {selectedInvitation.created_at ? formatDate(selectedInvitation.created_at) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Sent At</label>
                <p className="text-sm">
                  {selectedInvitation.sent_at ? formatDate(selectedInvitation.sent_at) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Accepted At</label>
                <p className="text-sm">
                  {selectedInvitation.accepted_at ? formatDate(selectedInvitation.accepted_at) : '—'}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expires At</label>
                <p className="text-sm">
                  {selectedInvitation.expires_at ? formatDate(selectedInvitation.expires_at) : '—'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedInvitation.notes && (
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2 cursor-pointer">
                  {showNotes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span onClick={() => setShowNotes(!showNotes)}>Notes</span>
                </label>
                {showNotes && (
                  <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedInvitation.notes}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t">
              {['sent', 'pending'].includes(selectedInvitation.status) && (
                <Button
                  onClick={() => {
                    handleResend(selectedInvitation.id)
                    setSelectedInvitation(null)
                  }}
                  disabled={resendMutation.isPending}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {resendMutation.isPending ? 'Resending...' : 'Resend Invitation'}
                </Button>
              )}
              <Button
                onClick={() => {
                  handleDelete(selectedInvitation.id)
                  setSelectedInvitation(null)
                }}
                disabled={deleteMutation.isPending}
                className="w-full border border-red-200 text-red-600 hover:bg-red-50"
                variant="secondary"
              >
                <Trash2 className="w-4 h-4" />
                Delete Invitation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Invitation Modal */}
      <SendMembershipInvitationModal
        isOpen={invitationModalOpen}
        onClose={() => setInvitationModalOpen(false)}
      />
    </div>
  )
}
