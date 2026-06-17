'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@/components/ui'
import { useSendMembershipInvitation } from '@/hooks/useMembershipInvitation'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { Mail, CheckCircle } from 'lucide-react'

interface SendMembershipInvitationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SendMembershipInvitationModal({ isOpen, onClose }: SendMembershipInvitationModalProps) {
  const [email, setEmail] = useState('')
  const [targetName, setTargetName] = useState('')
  const [invitationType, setInvitationType] = useState<'direct' | 'referred'>('direct')
  const [showSuccess, setShowSuccess] = useState(false)

  const sendMutation = useSendMembershipInvitation()
  const { data: currentEmployee } = useCurrentEmployee()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      alert('Please enter an email address')
      return
    }

    if (!targetName.trim()) {
      alert('Please enter the target person\'s name')
      return
    }

    const referrerName = currentEmployee
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : 'An IBON International member'

    try {
      await sendMutation.mutateAsync({
        email: email.toLowerCase().trim(),
        target_name: targetName.trim(),
        invitation_type: invitationType,
        referrer_name: referrerName,
      })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setEmail('')
        setTargetName('')
        setInvitationType('direct')
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>Send Membership Invitation</ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showSuccess ? (
            <div className="py-8 text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <p className="text-lg font-medium text-gray-900">Invitation Sent!</p>
              <p className="text-gray-600 mt-2">
                An invitation has been sent to <span className="font-medium">{email}</span>
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Person's Name *
                </label>
                <Input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="e.g., Juan dela Cruz"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="person@example.com"
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-sm font-medium text-gray-700">Invitation Type</label>

                {/* Direct Invitation */}
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="invitationType"
                    value="direct"
                    checked={invitationType === 'direct'}
                    onChange={() => setInvitationType('direct')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Direct Invitation</p>
                    <p className="text-sm text-gray-500">Invite them directly to apply for membership</p>
                  </div>
                </label>

                {/* Referral */}
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="invitationType"
                    value="referred"
                    checked={invitationType === 'referred'}
                    onChange={() => setInvitationType('referred')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Refer a Member</p>
                    <p className="text-sm text-gray-500">
                      They'll know they were referred by{' '}
                      <span className="font-medium">
                        {currentEmployee
                          ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
                          : 'you'}
                      </span>
                    </p>
                  </div>
                </label>
              </div>
            </>
          )}
        </form>
      </ModalBody>
      {!showSuccess && (
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={sendMutation.isPending || !email.trim() || !targetName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  )
}
