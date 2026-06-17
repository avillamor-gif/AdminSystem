'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from '@/components/ui'
import { useSendMembershipInvitation } from '@/hooks/useMembershipInvitation'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface SendMembershipInvitationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SendMembershipInvitationModal({ isOpen, onClose }: SendMembershipInvitationModalProps) {
  const [email, setEmail] = useState('')
  const [targetName, setTargetName] = useState('')
  const [invitationType, setInvitationType] = useState<'direct' | 'referred'>('direct')
  const [referrerName, setReferrerName] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

  const sendMutation = useSendMembershipInvitation()
  const { data: currentEmployee } = useCurrentEmployee()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter an email address')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.toLowerCase().trim())) {
      setError('Please enter a valid email address')
      return
    }

    if (!targetName.trim()) {
      setError('Please enter the target person\'s name')
      return
    }

    if (invitationType === 'referred' && !referrerName.trim()) {
      setError('Please enter the referrer\'s name')
      return
    }

    try {
      await sendMutation.mutateAsync({
        email: email.toLowerCase().trim(),
        target_name: targetName.trim(),
        invitation_type: invitationType,
        referrer_name: invitationType === 'referred' ? referrerName.trim() : undefined,
      })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setEmail('')
        setTargetName('')
        setReferrerName('')
        setInvitationType('direct')
        onClose()
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation'
      setError(errorMessage)
      console.error('Error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <Modal open={isOpen} onClose={onClose}>
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
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

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
                    onChange={() => {
                      setInvitationType('direct')
                      setReferrerName('')
                    }}
                    className="w-4 h-4 text-orange-500"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">Direct Invitation</p>
                    <p className="text-sm text-gray-500">Invite them directly to apply for membership</p>
                  </div>
                </label>

                {/* Referral */}
                <div className="space-y-2">
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                    <input
                      type="radio"
                      name="invitationType"
                      value="referred"
                      checked={invitationType === 'referred'}
                      onChange={() => setInvitationType('referred')}
                      className="w-4 h-4 text-orange-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">Refer a Member</p>
                      <p className="text-sm text-gray-500">They'll know who referred them to IBON</p>
                    </div>
                  </label>

                  {invitationType === 'referred' && (
                    <div className="ml-7 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referrer's Name *
                      </label>
                      <Input
                        type="text"
                        value={referrerName}
                        onChange={(e) => setReferrerName(e.target.value)}
                        placeholder="e.g., Maria Santos"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
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
            disabled={sendMutation.isPending || !email.trim() || !targetName.trim() || (invitationType === 'referred' && !referrerName.trim())}
            className="bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
          >
            {sendMutation.isPending ? 'Sending...' : 'Send Invitation'}
          </Button>
        </ModalFooter>
      )}
    </Modal>
  )
}
