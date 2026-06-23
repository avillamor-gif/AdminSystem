'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, MousePointerClick, Download } from 'lucide-react'
import { Card } from '@/components/ui'
import { useMemberCampaigns, useCampaignRecipients } from '@/hooks/useGovernance'
import { formatDate } from '@/lib/utils'

const RECIPIENT_STATUS_CLS: Record<string, string> = {
  sent:    'bg-green-100 text-green-700',
  failed:  'bg-red-100 text-red-700',
  bounced: 'bg-orange-100 text-orange-700',
  pending: 'bg-gray-100 text-gray-500',
}

function RateRing({ rate, color, label }: { rate: number; color: string; label: string }) {
  const r = 36, circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 90 90" className="w-24 h-24">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${(rate / 100) * circ} ${circ}`}
          strokeDashoffset={circ * 0.25} transform="rotate(-90 45 45)" />
        <text x="45" y="49" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1f2937">{rate}%</text>
      </svg>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
  )
}

export default function CampaignReportPage({ params }: { params: { id: string } }) {
  const { data: campaigns = [], isLoading: campaignsLoading } = useMemberCampaigns()
  const { data: recipients = [], isLoading: recipientsLoading } = useCampaignRecipients(params.id)

  const campaign = campaigns.find(c => c.id === params.id)

  const report = useMemo(() => {
    if (!recipients.length) return null
    const sent     = recipients.filter(r => r.status === 'sent' || r.status === 'bounced').length
    const failed   = recipients.filter(r => r.status === 'failed').length
    const bounced  = recipients.filter(r => r.status === 'bounced').length
    const pending  = recipients.filter(r => r.status === 'pending').length
    const opened   = recipients.filter(r => r.opened_at).length
    const clicked  = recipients.filter(r => r.clicked_at).length
    const deliveryRate = (sent + failed) > 0 ? Math.round((sent / (sent + failed)) * 100) : 0
    const openRate     = sent > 0 ? Math.round((opened / sent) * 100) : 0
    const clickRate    = sent > 0 ? Math.round((clicked / sent) * 100) : 0
    const urlMap: Record<string, number> = {}
    for (const r of recipients) {
      if (r.clicked_url) urlMap[r.clicked_url] = (urlMap[r.clicked_url] || 0) + 1
    }
    const topUrls = Object.entries(urlMap).sort((a, b) => b[1] - a[1]).slice(0, 10)
    return { sent, failed, bounced, pending, opened, clicked, deliveryRate, openRate, clickRate, topUrls }
  }, [recipients])

  function exportCsv() {
    const header = 'Name,Email,Status,Sent At,Opened,Opened At,Clicked,Clicked At,Clicked URL\n'
    const rows = recipients.map(r =>
      [
        `"${r.member?.first_name ?? ''} ${r.member?.last_name ?? ''}"`,
        `"${r.email}"`, `"${r.status}"`, `"${r.sent_at ?? ''}"`,
        r.opened_at ? 'Yes' : 'No', `"${r.opened_at ?? ''}"`,
        r.clicked_at ? 'Yes' : 'No', `"${r.clicked_at ?? ''}"`, `"${r.clicked_url ?? ''}"`,
      ].join(',')
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `report-${(campaign?.title ?? params.id).replace(/\s+/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isLoading = campaignsLoading || recipientsLoading

  if (isLoading) return <div className="p-16 text-center text-gray-400">Loading…</div>
  if (!campaign) return (
    <div className="p-16 text-center">
      <p className="text-gray-400">Campaign not found.</p>
      <Link href="/admin/governance/reports/email-report" className="text-amber-600 hover:underline text-sm mt-2 block">← Back to Email Report</Link>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/admin/governance/reports/email-report"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Email Report
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <p className="text-gray-500 mt-0.5 text-sm">Subject: {campaign.subject}</p>
            {campaign.sent_at && <p className="text-gray-400 text-xs mt-0.5">Sent on {formatDate(campaign.sent_at)}</p>}
          </div>
          {recipients.length > 0 && (
            <button onClick={exportCsv}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg bg-white transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Rate Rings */}
      {report && (
        <Card className="p-6">
          <div className="flex flex-wrap justify-around gap-6">
            <RateRing rate={report.deliveryRate} color="#22c55e" label="Delivery Rate" />
            <RateRing rate={report.openRate}     color="#f59e0b" label="Open Rate" />
            <RateRing rate={report.clickRate}    color="#8b5cf6" label="Click Rate" />
          </div>
        </Card>
      )}

      {/* Stat grid */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Delivered',  value: report.sent,    color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100'  },
            { label: 'Failed',     value: report.failed,  color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-100'    },
            { label: 'Bounced',    value: report.bounced, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
            { label: 'Opened',     value: report.opened,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100'  },
            { label: 'Clicked',    value: report.clicked, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
            { label: 'Total',      value: recipients.length, color: 'text-gray-600', bg: 'bg-gray-50',  border: 'border-gray-100'   },
          ].map(s => (
            <Card key={s.label} className={`p-4 border ${s.border}`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Open tracking notice */}
      {report && report.opened === 0 && report.sent > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <strong>Open tracking:</strong> 0 opens recorded. This may mean recipients haven&apos;t opened it yet, their email client blocks tracking pixels (e.g. Apple Mail), or the Resend webhook hasn&apos;t been configured yet.
        </div>
      )}

      {/* Top Clicked Links */}
      {report && report.topUrls.length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-purple-500" /> Clicked Links
          </p>
          <div className="space-y-2">
            {report.topUrls.map(([url, count]) => {
              const maxCount = report.topUrls[0][1]
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={url} className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate flex-1">{url}</a>
                    <span className="text-sm font-semibold text-purple-600 flex-shrink-0">{count} click{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full bg-purple-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Recipients Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Send className="w-4 h-4 text-gray-400" /> Recipients ({recipients.length})
          </p>
        </div>
        {recipients.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No recipients recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Member', 'Email', 'Status', 'Sent At', 'Opened', 'Clicked', 'Clicked URL'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recipients.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800 whitespace-nowrap">
                      {r.member ? `${r.member.first_name} ${r.member.last_name}` : '—'}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 text-xs">{r.email}</td>
                    <td className="py-2.5 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RECIPIENT_STATUS_CLS[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500 text-xs whitespace-nowrap">{r.sent_at ? formatDate(r.sent_at) : '—'}</td>
                    <td className="py-2.5 pr-4">
                      {r.opened_at
                        ? <span className="text-xs text-amber-600 font-medium" title={formatDate(r.opened_at)}>✓ {formatDate(r.opened_at)}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      {r.clicked_at
                        ? <span className="text-xs text-purple-600 font-medium" title={formatDate(r.clicked_at)}>✓ {formatDate(r.clicked_at)}</span>
                        : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="py-2.5 text-xs max-w-[200px] truncate">
                      {r.clicked_url
                        ? <a href={r.clicked_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{r.clicked_url}</a>
                        : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
