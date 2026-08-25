'use client'

import { useState } from 'react'
import { Send, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import toast from 'react-hot-toast'

export default function SendEquipmentFormPage() {
  const [formData, setFormData] = useState({
    partnerName: '',
    partnerEmail: '',
    partnerOrg: '',
    formLink: '',
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const formUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/forms/equipment-checkout`
  const deepLink = `${formUrl}?org=${encodeURIComponent(formData.partnerOrg || formData.partnerName)}`

  function generateLink() {
    if (!formData.partnerName.trim()) {
      toast.error('Please enter partner name')
      return
    }

    const link = `${formUrl}?org=${encodeURIComponent(
      (formData.partnerOrg || formData.partnerName).trim()
    )}`

    setFormData(p => ({ ...p, formLink: link }))
    setShowModal(true)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(formData.formLink)
    toast.success('Link copied to clipboard')
  }

  async function sendEmail() {
    if (!formData.partnerEmail.trim()) {
      toast.error('Please enter partner email')
      return
    }

    if (!formData.formLink) {
      toast.error('Please generate link first')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/admin/send-equipment-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: formData.partnerEmail.trim(),
          partnerName: formData.partnerName.trim(),
          partnerOrg: formData.partnerOrg.trim(),
          formLink: formData.formLink,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to send email')
        return
      }

      toast.success('Email sent successfully!')
      setShowModal(false)
      setFormData({
        partnerName: '',
        partnerEmail: '',
        partnerOrg: '',
        formLink: '',
      })
    } catch (error) {
      console.error('Email send error:', error)
      toast.error('Failed to send email')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Equipment Form to Partners</h1>
        <p className="text-gray-600 mt-1">Generate and send secure equipment checkout form links to external partners</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border-l-4 border-l-green-500 bg-green-50">
          <h3 className="font-semibold text-green-900 mb-1">How It Works</h3>
          <p className="text-sm text-green-800">
            1. Enter partner details below<br />
            2. Generate secure form link<br />
            3. Send via email to partner<br />
            4. Partner fills out form (no login needed)<br />
            5. Request appears in Equipment Requests for approval
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
          <h3 className="font-semibold text-blue-900 mb-1">Security</h3>
          <p className="text-sm text-blue-800">
            ✓ Rate limited (5 requests/hour per IP)<br />
            ✓ Input validation & sanitization<br />
            ✓ Email verification at submission<br />
            ✓ Admin approval required<br />
            ✓ No sensitive data exposed
          </p>
        </Card>
      </div>

      {/* Form */}
      <Card className="p-6">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Partner Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Juan dela Cruz"
              value={formData.partnerName}
              onChange={e => setFormData(p => ({ ...p, partnerName: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">Used to pre-fill the form</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Partner Organization <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., DSWD Region III"
              value={formData.partnerOrg}
              onChange={e => setFormData(p => ({ ...p, partnerOrg: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">Will be pre-filled on the form</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Recipient Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="e.g., partner@organization.com"
              value={formData.partnerEmail}
              onChange={e => setFormData(p => ({ ...p, partnerEmail: e.target.value }))}
            />
            <p className="text-xs text-gray-500 mt-1">Where to send the form link</p>
          </div>

          <button
            type="button"
            onClick={generateLink}
            disabled={!formData.partnerName.trim()}
            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Form Link
          </button>
        </div>
      </Card>

      {/* Modal with link preview and send option */}
      {showModal && (
        <Modal open onClose={() => setShowModal(false)}>
          <ModalHeader>
            <h3 className="text-lg font-semibold text-gray-900">Send Equipment Form Link</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-5">
              {/* Link Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Form Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.formLink}
                    readOnly
                    className="flex-1 px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-1.5"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>

              {/* Email Preview */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Preview</label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-3 max-h-64 overflow-y-auto">
                  <p>
                    <strong>To:</strong> {formData.partnerEmail || '(email address)'}
                  </p>
                  <p>
                    <strong>Subject:</strong> Equipment Checkout Form - {formData.partnerOrg || formData.partnerName}
                  </p>
                  <hr className="border-gray-300" />
                  <div>
                    <p>Hello {formData.partnerName},</p>
                    <p>
                      IBON International would like to share a secure equipment checkout form with you. Please use the button below to request equipment.
                    </p>
                    <div style={{ margin: '20px 0', textAlign: 'center' }}>
                      <a
                        href={formData.formLink}
                        style={{
                          display: 'inline-block',
                          padding: '12px 24px',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                        }}
                      >
                        Fill Out Equipment Form
                      </a>
                    </div>
                    <p>
                      <strong>What to expect:</strong> Our team will review your request and contact you within 2 business days to confirm.
                    </p>
                    <p>
                      If you have any questions, please contact us at{' '}
                      <a href="mailto:admin@iboninternational.org">admin@iboninternational.org</a>
                    </p>
                    <p>Best regards,<br />IBON International Team</p>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  The form link can be shared publicly. It's rate-limited to prevent abuse. Partner information will be pre-filled for convenience.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={isGenerating || !formData.partnerEmail.trim()}
              onClick={sendEmail}
              className="flex items-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
