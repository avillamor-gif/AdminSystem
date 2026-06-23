'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Plus, Send, Edit2, Trash2, Eye, FileText, CheckCircle, Clock,
  Users, Mail, BarChart2, X, ChevronRight, ChevronLeft, AlertCircle,
  Download, RefreshCw, MousePointerClick,
} from 'lucide-react'
import { Card, Button, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'
import {
  useMemberCampaigns, useCreateMemberCampaign, useUpdateMemberCampaign,
  useDeleteMemberCampaign, useMembers, useCampaignRecipients,
} from '@/hooks/useGovernance'
import type { MemberCampaign, MemberCampaignFilter } from '@/services/governance.service'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<MemberCampaign['status'], { label: string; cls: string; Icon: React.ElementType }> = {
  draft:     { label: 'Draft',     cls: 'bg-gray-100 text-gray-600',    Icon: FileText },
  sending:   { label: 'Sending',   cls: 'bg-blue-100 text-blue-700',    Icon: RefreshCw },
  sent:      { label: 'Sent',      cls: 'bg-green-100 text-green-700',  Icon: CheckCircle },
  scheduled: { label: 'Scheduled', cls: 'bg-purple-100 text-purple-700',Icon: Clock },
}

const RECIPIENT_STATUS_CLS: Record<string, string> = {
  sent:    'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-700',
  bounced: 'bg-orange-100 text-orange-700',
  pending: 'bg-gray-100 text-gray-500',
}

const MEMBERSHIP_TYPES = ['regular','associate','honorary','institutional']
const MEMBER_STATUSES  = ['active','inactive','suspended','lapsed','deceased']

const DEFAULT_HTML = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
  <!-- Header -->
  <div style="background: #1e3a5f; padding: 32px 40px; text-align: center;">
    <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 700;">IBON International</h1>
    <p style="color: #93c5fd; font-size: 14px; margin: 8px 0 0;">Foundation Membership</p>
  </div>

  <!-- Body -->
  <div style="padding: 40px;">
    <h2 style="color: #1e3a5f; font-size: 22px; margin: 0 0 16px;">Dear {{first_name}},</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">
      Your message content goes here. This email is going to all members matching your audience filter.
    </p>
    <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 32px;">
      Add more paragraphs as needed to communicate your message.
    </p>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background: #d97706; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
        Learn More
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 40px; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0 0 4px;">IBON International Foundation, Inc.</p>
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">Member #{{member_number}}</p>
  </div>
</div>`

const BLOCK_SNIPPETS = {
  'Heading':    `\n<h2 style="color: #1e3a5f; font-size: 22px; margin: 0 0 16px;">Your Heading</h2>\n`,
  'Paragraph':  `\n<p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">Your paragraph text here.</p>\n`,
  'Button':     `\n<div style="text-align: center; margin: 24px 0;">\n  <a href="#" style="background: #d97706; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">Button Text</a>\n</div>\n`,
  'Divider':    `\n<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />\n`,
  'Alert Box':  `\n<div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">\n  <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">Important Notice</p>\n  <p style="color: #78350f; font-size: 14px; margin: 8px 0 0;">Your alert message here.</p>\n</div>\n`,
  'Name Token': `{{first_name}}`,
  'Member #':   `{{member_number}}`,
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function audienceLabel(filter: MemberCampaignFilter): string {
  if (filter.all) return 'All Members'
  const parts: string[] = []
  if (filter.membership_types?.length)
    parts.push(filter.membership_types.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', '))
  if (filter.statuses?.length)
    parts.push(filter.statuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', '))
  return parts.join(' · ') || 'Custom'
}

function estimateRecipients(members: any[], filter: MemberCampaignFilter): number {
  return members.filter(m => {
    if (m.opt_out_email) return false
    if (!m.email) return false
    if (filter.all) return true
    const typeOk = !filter.membership_types?.length || filter.membership_types.includes(m.membership_type)
    const statusOk = !filter.statuses?.length || filter.statuses.includes(m.status)
    return typeOk && statusOk
  }).length
}

// ── Compose Modal ─────────────────────────────────────────────────────────────

interface ComposeState {
  title: string
  subject: string
  preview_text: string
  body_html: string
  recipient_filter: MemberCampaignFilter
}

const emptyCompose: ComposeState = {
  title: '',
  subject: '',
  preview_text: '',
  body_html: DEFAULT_HTML,
  recipient_filter: { all: true },
}

function ComposeModal({
  open, onClose, initial, allMembers,
}: {
  open: boolean
  onClose: () => void
  initial: { campaign?: MemberCampaign | null; compose: ComposeState }
  allMembers: any[]
}) {
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState<ComposeState>(initial.compose)
  const [preview, setPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [useCustom, setUseCustom] = useState(!initial.compose.recipient_filter.all)

  const createMutation = useCreateMemberCampaign()
  const updateMutation = useUpdateMemberCampaign()

  const estimated = useMemo(
    () => estimateRecipients(allMembers, form.recipient_filter),
    [allMembers, form.recipient_filter]
  )

  const campaign = initial.campaign

  function setF(k: keyof ComposeState, v: any) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function toggleTypeFilter(type: string) {
    const cur = form.recipient_filter.membership_types || []
    const next = cur.includes(type) ? cur.filter(t => t !== type) : [...cur, type]
    setF('recipient_filter', { ...form.recipient_filter, all: false, membership_types: next })
  }

  function toggleStatusFilter(status: string) {
    const cur = form.recipient_filter.statuses || []
    const next = cur.includes(status) ? cur.filter(s => s !== status) : [...cur, status]
    setF('recipient_filter', { ...form.recipient_filter, all: false, statuses: next })
  }

  function insertBlock(snippet: string) {
    setF('body_html', form.body_html + snippet)
  }

  async function saveDraft() {
    const payload = { ...form, status: 'draft' as const, recipient_count: 0, sent_count: 0, failed_count: 0, scheduled_at: null, sent_at: null, created_by: null }
    if (campaign) {
      await updateMutation.mutateAsync({ id: campaign.id, data: form })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onClose()
  }

  async function handleSend() {
    if (!form.title || !form.subject || !form.body_html) {
      toast.error('Please fill in all required fields')
      return
    }
    setSending(true)
    try {
      let campaignId = campaign?.id
      if (!campaignId) {
        const saved = await createMutation.mutateAsync({
          ...form, status: 'draft', recipient_count: 0, sent_count: 0, failed_count: 0, scheduled_at: null, sent_at: null, created_by: null,
        })
        campaignId = saved.id
      } else {
        await updateMutation.mutateAsync({ id: campaignId, data: form })
      }
      const res = await fetch('/api/governance/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, ...form }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? 'Failed to send')
      }
      const result = await res.json()
      toast.success(`Campaign sent! ${result.sent} delivered, ${result.failed} failed.`)
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {campaign ? 'Edit Campaign' : 'New Campaign'}
            </h2>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1 text-sm">
            {['Audience', 'Content', 'Review'].map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i + 1)}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  step === i + 1
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Step 1 – Audience */}
          {step === 1 && (
            <div className="p-6 space-y-5 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Title <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-400 ml-1">(internal name)</span>
                </label>
                <input
                  value={form.title}
                  onChange={e => setF('title', e.target.value)}
                  placeholder="e.g. May 2026 Newsletter"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.subject}
                  onChange={e => setF('subject', e.target.value)}
                  placeholder="e.g. IBON International – May Update"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preview Text
                  <span className="text-xs font-normal text-gray-400 ml-1">(shown in inbox before opening)</span>
                </label>
                <input
                  value={form.preview_text}
                  onChange={e => setF('preview_text', e.target.value)}
                  placeholder="Short teaser for the email…"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="audience" checked={!useCustom}
                      onChange={() => { setUseCustom(false); setF('recipient_filter', { all: true }) }}
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-gray-700">All members (who haven't opted out)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="audience" checked={useCustom}
                      onChange={() => { setUseCustom(true); setF('recipient_filter', { all: false }) }}
                      className="accent-amber-500"
                    />
                    <span className="text-sm text-gray-700">Custom filter</span>
                  </label>
                </div>

                {useCustom && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1.5">Membership Type</p>
                      <div className="flex flex-wrap gap-2">
                        {MEMBERSHIP_TYPES.map(t => (
                          <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(form.recipient_filter.membership_types || []).includes(t)}
                              onChange={() => toggleTypeFilter(t)}
                              className="accent-amber-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1.5">Member Status</p>
                      <div className="flex flex-wrap gap-2">
                        {MEMBER_STATUSES.map(s => (
                          <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(form.recipient_filter.statuses || []).includes(s)}
                              onChange={() => toggleStatusFilter(s)}
                              className="accent-amber-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Estimated reach */}
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Users className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-800">
                  Estimated recipients: <strong>{estimated}</strong> member{estimated !== 1 ? 's' : ''} with email addresses
                </span>
              </div>
            </div>
          )}

          {/* Step 2 – Content */}
          {step === 2 && (
            <div className="flex h-[520px]">
              {/* Editor pane */}
              <div className="flex-1 flex flex-col border-r border-gray-100">
                {/* Block toolbar */}
                <div className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-100 flex-wrap bg-gray-50">
                  <span className="text-xs font-medium text-gray-400 mr-1">Insert:</span>
                  {Object.entries(BLOCK_SNIPPETS).map(([label, snippet]) => (
                    <button
                      key={label}
                      onClick={() => insertBlock(snippet)}
                      className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-amber-50 hover:border-amber-300 text-gray-600 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <button
                    onClick={() => setPreview(p => !p)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                      preview ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 inline mr-1" />
                    {preview ? 'Hide Preview' : 'Preview'}
                  </button>
                </div>
                <textarea
                  value={form.body_html}
                  onChange={e => setF('body_html', e.target.value)}
                  className="flex-1 p-4 font-mono text-xs text-gray-800 resize-none focus:outline-none border-none"
                  placeholder="Paste or write your HTML email here…"
                  spellCheck={false}
                />
              </div>

              {/* Preview pane */}
              {preview && (
                <div className="w-[420px] overflow-y-auto bg-gray-100 p-4">
                  <p className="text-xs text-gray-400 mb-2 font-medium text-center">Email Preview</p>
                  <div
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                    dangerouslySetInnerHTML={{
                      __html: form.body_html
                        .replace(/{{first_name}}/g, 'Juan')
                        .replace(/{{name}}/g, 'Juan dela Cruz')
                        .replace(/{{member_number}}/g, 'MBR-001'),
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3 – Review & Send */}
          {step === 3 && (
            <div className="p-6 max-w-xl space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Campaign Summary</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-500">Title</span>
                  <span className="text-gray-900 font-medium">{form.title || '—'}</span>
                  <span className="text-gray-500">Subject</span>
                  <span className="text-gray-900">{form.subject || '—'}</span>
                  <span className="text-gray-500">Audience</span>
                  <span className="text-gray-900">{audienceLabel(form.recipient_filter)}</span>
                  <span className="text-gray-500">Estimated Recipients</span>
                  <span className="text-sm font-semibold text-amber-700">{estimated}</span>
                  <span className="text-gray-500">From</span>
                  <span className="text-gray-900 text-xs">noreply@adminsystem.iboninternational.org</span>
                </div>
              </div>
              {!form.title || !form.subject ? (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Please complete the Campaign Title and Subject in Step 1.
                </div>
              ) : estimated === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  No recipients match your audience filter. Adjust it in Step 1.
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Ready to send to <strong className="mx-1">{estimated}</strong> member{estimated !== 1 ? 's' : ''}.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(s => s - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={saveDraft}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Save Draft
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(s => s + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={sending || !form.title || !form.subject || estimated === 0}
              >
                {sending ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Send Now</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

function CampaignDetailPanel({
  campaign, onClose, onEdit,
}: {
  campaign: MemberCampaign
  onClose: () => void
  onEdit: () => void
}) {
  const [tab, setTab] = useState<'report' | 'recipients'>(
    campaign.status === 'sent' ? 'report' : 'recipients'
  )
  const { data: recipients = [], isLoading } = useCampaignRecipients(campaign.id)
  const { Icon, cls, label } = STATUS_META[campaign.status]

  // ── Derived report stats ─────────────────────────────────────────────────────
  const report = useMemo(() => {
    const total    = recipients.length
    const sent     = recipients.filter(r => r.status === 'sent' || r.status === 'bounced').length
    const failed   = recipients.filter(r => r.status === 'failed').length
    const bounced  = recipients.filter(r => r.status === 'bounced').length
    const opened   = recipients.filter(r => r.opened_at).length
    const clicked  = recipients.filter(r => r.clicked_at).length
    const deliveryRate = (sent + failed) > 0 ? Math.round((sent / (sent + failed)) * 100) : 0
    const openRate     = sent > 0 ? Math.round((opened / sent) * 100) : 0
    const clickRate    = sent > 0 ? Math.round((clicked / sent) * 100) : 0

    // Top clicked URLs
    const urlMap: Record<string, number> = {}
    for (const r of recipients) {
      if (r.clicked_url) urlMap[r.clicked_url] = (urlMap[r.clicked_url] || 0) + 1
    }
    const topUrls = Object.entries(urlMap).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return { total, sent, failed, bounced, opened, clicked, deliveryRate, openRate, clickRate, topUrls }
  }, [recipients])

  function exportCsv() {
    const header = 'Name,Email,Status,Sent At,Opened,Clicked,Clicked URL\n'
    const rows = recipients.map(r =>
      [
        `"${r.member?.first_name ?? ''} ${r.member?.last_name ?? ''}"`,
        `"${r.email}"`,
        `"${r.status}"`,
        `"${r.sent_at ?? ''}"`,
        r.opened_at ? 'Yes' : 'No',
        r.clicked_at ? 'Yes' : 'No',
        `"${r.clicked_url ?? ''}"`,
      ].join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `report-${campaign.title.replace(/\s+/g, '-')}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Rate ring helper ─────────────────────────────────────────────────────────
  function RateRing({ rate, color, label: ringLabel }: { rate: number; color: string; label: string }) {
    const r = 28, circ = 2 * Math.PI * r
    return (
      <div className="flex flex-col items-center gap-1">
        <svg viewBox="0 0 70 70" className="w-16 h-16">
          <circle cx="35" cy="35" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <circle cx="35" cy="35" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${(rate / 100) * circ} ${circ}`}
            strokeDashoffset={circ * 0.25} transform="rotate(-90 35 35)" />
          <text x="35" y="39" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1f2937">{rate}%</text>
        </svg>
        <span className="text-xs text-gray-500 text-center">{ringLabel}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[520px] bg-white shadow-2xl flex flex-col border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <h3 className="font-semibold text-gray-900 truncate">{campaign.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cls}`}>{label}</span>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Meta */}
      <div className="px-5 py-3 border-b border-gray-100 space-y-1 bg-gray-50">
        <p className="text-xs text-gray-500">Subject: <span className="text-gray-800 font-medium">{campaign.subject}</span></p>
        {campaign.preview_text && <p className="text-xs text-gray-400 italic">{campaign.preview_text}</p>}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Audience: {audienceLabel(campaign.recipient_filter)}</span>
          {campaign.sent_at && <span>Sent: {formatDate(campaign.sent_at)}</span>}
        </div>
      </div>

      {/* Tabs — only show Report tab for sent campaigns */}
      {campaign.status === 'sent' && (
        <div className="flex border-b border-gray-100 px-5">
          {(['report', 'recipients'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors ${tab === t ? 'border-amber-500 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'report' ? 'Report' : `Recipients (${recipients.length})`}
            </button>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div className="px-4 py-2.5 border-b border-gray-100 flex gap-2">
        {campaign.status === 'draft' && (
          <Button variant="secondary" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit &amp; Send
          </Button>
        )}
        {recipients.length > 0 && (
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── REPORT TAB ── */}
        {tab === 'report' && campaign.status === 'sent' && (
          <div className="p-5 space-y-5">
            {/* Rate rings */}
            <div className="flex justify-around py-2">
              <RateRing rate={report.deliveryRate} color="#22c55e" label="Delivery Rate" />
              <RateRing rate={report.openRate}     color="#f59e0b" label="Open Rate" />
              <RateRing rate={report.clickRate}    color="#8b5cf6" label="Click Rate" />
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Delivered',  value: report.sent,    color: 'text-green-600',  bg: 'bg-green-50'  },
                { label: 'Failed',     value: report.failed,  color: 'text-red-600',    bg: 'bg-red-50'    },
                { label: 'Bounced',    value: report.bounced, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Opened',     value: report.opened,  color: 'text-amber-600',  bg: 'bg-amber-50'  },
                { label: 'Clicked',    value: report.clicked, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Total Sent', value: report.total,   color: 'text-gray-600',   bg: 'bg-gray-50'   },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Open tracking notice */}
            {report.opened === 0 && report.sent > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>Open tracking:</strong> 0 opens recorded. This may mean opens haven&apos;t occurred yet, or recipients are using email clients that block tracking pixels (e.g. Apple Mail).
              </div>
            )}

            {/* Top clicked links */}
            {report.topUrls.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                  <MousePointerClick className="w-3.5 h-3.5" /> Top Clicked Links
                </p>
                <div className="space-y-2">
                  {report.topUrls.map(([url, count]) => (
                    <div key={url} className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg">
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline truncate flex-1">{url}</a>
                      <span className="text-xs font-semibold text-purple-600 flex-shrink-0">{count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RECIPIENTS TAB ── */}
        {(tab === 'recipients' || campaign.status !== 'sent') && (
          <div className="p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Recipients ({recipients.length})
            </p>
            {isLoading ? (
              <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
            ) : recipients.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No recipients recorded yet.</p>
            ) : (
              <div className="space-y-1">
                {/* Column header */}
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-2 pb-1 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-400">Member</span>
                  <span className="text-xs font-medium text-gray-400 text-center w-14">Status</span>
                  <span className="text-xs font-medium text-gray-400 text-center w-8" title="Opened">👁</span>
                  <span className="text-xs font-medium text-gray-400 text-center w-8" title="Clicked">🖱</span>
                </div>
                {recipients.map(r => (
                  <div key={r.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-2 py-2 hover:bg-gray-50 rounded-lg">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {r.member ? `${r.member.first_name} ${r.member.last_name}` : '—'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{r.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-14 text-center ${RECIPIENT_STATUS_CLS[r.status]}`}>
                      {r.status}
                    </span>
                    <span className={`text-sm text-center w-8 ${r.opened_at ? 'text-amber-500' : 'text-gray-200'}`} title={r.opened_at ? `Opened ${formatDate(r.opened_at)}` : 'Not opened'}>
                      {r.opened_at ? '✓' : '—'}
                    </span>
                    <span className={`text-sm text-center w-8 ${r.clicked_at ? 'text-purple-500' : 'text-gray-200'}`} title={r.clicked_at ? `Clicked ${formatDate(r.clicked_at)}` : 'No clicks'}>
                      {r.clicked_at ? '✓' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const [compose, setCompose]         = useState(false)
  const [editTarget, setEditTarget]   = useState<MemberCampaign | null>(null)
  const [detailPanel, setDetailPanel] = useState<MemberCampaign | null>(null)

  const { data: campaigns = [], isLoading } = useMemberCampaigns()
  const { data: allMembers = [] }           = useMembers()
  const deleteMutation                      = useDeleteMemberCampaign()

  const stats = useMemo(() => ({
    total:      campaigns.length,
    sent:       campaigns.filter(c => c.status === 'sent').length,
    drafts:     campaigns.filter(c => c.status === 'draft').length,
    recipients: campaigns.reduce((s, c) => s + c.sent_count, 0),
  }), [campaigns])

  function openCompose(campaign?: MemberCampaign) {
    setEditTarget(campaign || null)
    setDetailPanel(null)
    setCompose(true)
  }

  function handleDelete(c: MemberCampaign) {
    if (!confirm(`Delete "${c.title}"?`)) return
    deleteMutation.mutate(c.id)
  }

  const composeInitial = useMemo(() => ({
    campaign: editTarget,
    compose: editTarget ? {
      title: editTarget.title,
      subject: editTarget.subject,
      preview_text: editTarget.preview_text || '',
      body_html: editTarget.body_html,
      recipient_filter: editTarget.recipient_filter,
    } : emptyCompose,
  }), [editTarget])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="text-gray-600 mt-1">Compose and send email campaigns to your membership</p>
        </div>
        <Button onClick={() => openCompose()}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: stats.total,      icon: Mail,       color: 'text-blue-600',   bg: 'bg-blue-100'  },
          { label: 'Sent',            value: stats.sent,       icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-100' },
          { label: 'Drafts',          value: stats.drafts,     icon: FileText,   color: 'text-gray-600',   bg: 'bg-gray-100'  },
          { label: 'Emails Delivered',value: stats.recipients, icon: BarChart2,  color: 'text-amber-600',  bg: 'bg-amber-100' },
        ].map(s => (
          <Card key={s.label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Campaign Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center">
            <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No campaigns yet. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Audience</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Results</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map(c => {
                  const { label, cls, Icon } = STATUS_META[c.status]
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setDetailPanel(c)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900">{c.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[260px]">{c.subject}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {audienceLabel(c.recipient_filter)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
                          <Icon className="w-3 h-3" />
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm">
                        {c.status === 'sent' ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-green-600 font-medium">{c.sent_count}</span>
                              <span className="text-gray-400 text-xs">delivered</span>
                              {c.failed_count > 0 && <span className="text-red-500 text-xs">· {c.failed_count} failed</span>}
                            </div>
                            {((c.open_count ?? 0) > 0 || (c.click_count ?? 0) > 0) && (
                              <div className="flex items-center gap-2 text-xs">
                                {(c.open_count ?? 0) > 0 && (
                                  <span className="text-amber-600">👁 {c.open_count} opens</span>
                                )}
                                {(c.click_count ?? 0) > 0 && (
                                  <span className="text-purple-600">🖱 {c.click_count} clicks</span>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-sm">
                        {c.sent_at ? formatDate(c.sent_at) : (c.created_at ? formatDate(c.created_at) : '—')}
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {c.status === 'draft' && (
                            <button
                              onClick={() => openCompose(c)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setDetailPanel(c)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Compose Modal */}
      {compose && (
        <ComposeModal
          open={compose}
          onClose={() => { setCompose(false); setEditTarget(null) }}
          initial={composeInitial}
          allMembers={allMembers}
        />
      )}

      {/* Detail Panel overlay */}
      {detailPanel && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setDetailPanel(null)} />
          <CampaignDetailPanel
            campaign={detailPanel}
            onClose={() => setDetailPanel(null)}
            onEdit={() => { openCompose(detailPanel); setDetailPanel(null) }}
          />
        </>
      )}
    </div>
  )
}
