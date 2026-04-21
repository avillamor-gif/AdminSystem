'use client'

import { useState } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { Mail, Eye, Save, RotateCcw, Send } from 'lucide-react'
import { useEmailTemplates, useUpdateEmailTemplate } from '@/hooks'
import type { EmailTemplate } from '@/services/emailTemplate.service'

export default function EmailConfigurationPage() {
  const { data: templates = [], isLoading } = useEmailTemplates()
  const updateMutation = useUpdateEmailTemplate()
  
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setEditedTemplate({ ...template })
  }

  const handleSave = async () => {
    if (!editedTemplate) return
    
    await updateMutation.mutateAsync({
      id: editedTemplate.id,
      updates: {
        subject: editedTemplate.subject,
        header_color: editedTemplate.header_color,
        button_color: editedTemplate.button_color,
        button_text: editedTemplate.button_text,
        body_template: editedTemplate.body_template,
      }
    })
    
    setSelectedTemplate(null)
    setEditedTemplate(null)
  }

  const handleReset = () => {
    if (!selectedTemplate) return
    const original = templates.find(t => t.id === selectedTemplate.id)
    if (original) {
      setEditedTemplate({ ...original })
    }
  }

  const handleSendTest = async () => {
    if (!editedTemplate) return
    
    const testEmail = prompt('Enter email address to send test:')
    if (!testEmail) return
    
    setSendingTest(true)
    try {
      const response = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          template: editedTemplate
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`✅ Test email sent to ${testEmail}`)
      } else {
        alert(`❌ Failed to send: ${result.error}`)
      }
    } catch (error) {
      alert('❌ Error sending test email')
      console.error(error)
    } finally {
      setSendingTest(false)
    }
  }

  const generatePreview = (template: EmailTemplate) => {
    const sampleData: Record<string, string> = {
      requesterName: 'Juan dela Cruz',
      employeeName: 'Juan dela Cruz',
      leaveType: 'Vacation Leave',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      days: '5',
      requestNumber: 'TRV-2026-001',
      requestDetails: 'Business trip to Manila for 3 days',
      rejectionReason: 'Insufficient leave balance',
      email: 'juan@example.com',
      temporaryPassword: 'Welcome2026!'
    }

    let bodyHtml = template.body_template
    Object.entries(sampleData).forEach(([key, value]) => {
      bodyHtml = bodyHtml.replace(new RegExp(`{${key}}`, 'g'), value)
    })

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>II Admin System</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <tr>
            <td style="background:${template.header_color};padding:24px 32px;">
              <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">II Admin System</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
              <a href="#" style="display:inline-block;margin-top:20px;padding:12px 24px;background:${template.button_color};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${template.button_text}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                This is an automated message from II Admin System. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Configuration</h1>
          <p className="text-gray-600 mt-1">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Configuration</h1>
        <p className="text-gray-600 mt-1">
          Customize email notification templates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template List */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Email Templates</h2>
          </div>
          
          <div className="space-y-2">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleEdit(template)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-gray-900">{template.name}</div>
                <div className="text-sm text-gray-500 mt-1">{template.description}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Template Editor */}
        {editedTemplate ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editedTemplate.name}</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPreviewOpen(!previewOpen)}
                  variant="secondary"
                  className="text-sm"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  onClick={handleReset}
                  variant="secondary"
                  className="text-sm"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject Line
                </label>
                <Input
                  value={editedTemplate.subject}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, subject: e.target.value })}
                  placeholder="Email subject"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use variables: {'{requesterName}'}, {'{employeeName}'}, {'{requestNumber}'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editedTemplate.header_color}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, header_color: e.target.value })}
                      className="h-10 w-16 rounded border border-gray-300"
                    />
                    <Input
                      value={editedTemplate.header_color}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, header_color: e.target.value })}
                      placeholder="#f97316"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Button Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editedTemplate.button_color}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, button_color: e.target.value })}
                      className="h-10 w-16 rounded border border-gray-300"
                    />
                    <Input
                      value={editedTemplate.button_color}
                      onChange={(e) => setEditedTemplate({ ...editedTemplate, button_color: e.target.value })}
                      placeholder="#f97316"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Button Text
                </label>
                <Input
                  value={editedTemplate.button_text}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, button_text: e.target.value })}
                  placeholder="Review Request →"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Body (HTML)
                </label>
                <textarea
                  value={editedTemplate.body_template}
                  onChange={(e) => setEditedTemplate({ ...editedTemplate, body_template: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="HTML template..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{requesterName}'}, {'{leaveType}'}, {'{startDate}'}, {'{endDate}'}, {'{days}'}, etc.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSave} 
                  className="flex-1"
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? 'Saving...' : 'Save Template'}
                </Button>
                <Button 
                  onClick={handleSendTest} 
                  variant="secondary"
                  disabled={sendingTest}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingTest ? 'Sending...' : 'Send Test'}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Select a template to edit</p>
            </div>
          </Card>
        )}
      </div>

      {/* Preview Modal */}
      {previewOpen && editedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Email Preview</h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="text-sm text-gray-600">Subject:</div>
                <div className="font-medium">{editedTemplate.subject.replace(/{(\w+)}/g, 'Juan dela Cruz')}</div>
              </div>
              <iframe
                srcDoc={generatePreview(editedTemplate)}
                className="w-full border border-gray-200 rounded"
                style={{ height: '600px' }}
                title="Email Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
