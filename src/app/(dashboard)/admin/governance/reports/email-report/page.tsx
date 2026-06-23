'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Send, Mail, BellOff, TrendingUp, BarChart2, MousePointerClick, Eye, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui'
import { useMembers, useMemberCampaigns } from '@/hooks/useGovernance'
import { formatDate } from '@/lib/utils'

function HorizBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 capitalize">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

const STATUS_BADGE: Record<string, string> = {
  sent:    'bg-green-100 text-green-700',
  draft:   'bg-gray-100 text-gray-600',
  failed:  'bg-red-100 text-red-700',
  sending: 'bg-blue-100 text-blue-700',
}

export default function EmailReportPage() {
  const { data: members = [], isLoading: membersLoading } = useMembers()
  const { data: campaigns = [], isLoading: campaignsLoading } = useMemberCampaigns()
  const isLoading = membersLoading || campaignsLoading

  const stats = useMemo(() => {
    const withEmail  = members.filter(m => m.email).length
    const optedOut   = members.filter(m => m.opt_out_email).length
    const reachable  = withEmail - optedOut
    const sentCampaigns  = campaigns.filter(c => c.status === 'sent')
    const totalSent      = sentCampaigns.reduce((s, c) => s + c.sent_count, 0)
    const totalFailed    = sentCampaigns.reduce((s, c) => s + c.failed_count, 0)
    const totalOpened    = sentCampaigns.reduce((s, c) => s + (c.open_count ?? 0), 0)
    const totalClicked   = sentCampaigns.reduce((s, c) => s + (c.click_count ?? 0), 0)
    const totalAttempted = totalSent + totalFailed
    const deliveryRate   = totalAttempted > 0 ? Math.round((totalSent / totalAttempted) * 100) : 0
    const openRate       = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0
    const clickRate      = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0
    const avgPerCampaign = sentCampaigns.length > 0 ? Math.round(totalSent / sentCampaigns.length) : 0
    const monthMap: Record<string, number> = {}
    for (const c of sentCampaigns) {
      if (!c.sent_at) continue
      const key = c.sent_at.slice(0, 7)
      monthMap[key] = (monthMap[key] || 0) + c.sent_count
    }
    const bySentMonth = Object.keys(monthMap).sort().slice(-8).map(k => ({ label: k.slice(5), value: monthMap[k] }))
    const topCampaigns = [...sentCampaigns].sort((a, b) => b.sent_count - a.sent_count).slice(0, 5)
    return { withEmail, optedOut, reachable, totalCampaigns: campaigns.length, sentCampaigns: sentCampaigns.length, totalSent, totalFailed, totalOpened, totalClicked, deliveryRate, openRate, clickRate, avgPerCampaign, bySentMonth, topCampaigns }
  }, [members, campaigns])

  if (isLoading) return <div className="p-16 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Campaign Report</h1>
        <p className="text-gray-500 mt-1 text-sm">Delivery performance and reach for all membership email campaigns</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Campaigns Sent',    value: stats.sentCampaigns,                icon: Send,              color: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-100'   },
          { label: 'Emails Delivered',  value: stats.totalSent.toLocaleString(),   icon: Mail,              color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100'  },
          { label: 'Delivery Rate',     value: `${stats.deliveryRate}%`,           icon: TrendingUp,        color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
          { label: 'Unique Opens',      value: stats.totalOpened.toLocaleString(), icon: Eye,               color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100', sub: `${stats.openRate}% open rate`   },
          { label: 'Unique Clicks',     value: stats.totalClicked.toLocaleString(),icon: MousePointerClick, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100',sub: `${stats.clickRate}% click rate` },
          { label: 'Reachable Members', value: stats.reachable,                    icon: BellOff,           color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        ].map(s => (
          <Card key={s.label} className={`p-4 border ${s.border}`}>
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}><s.icon className={`w-4 h-4 ${s.color}`} /></div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            {(s as any).sub && <p className="text-xs text-gray-400 mt-0.5">{(s as any).sub}</p>}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Send className="w-4 h-4 text-teal-500" /> Delivery Performance</p>
          {stats.sentCampaigns > 0 ? (
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0">
                <circle cx="50" cy="50" r="36" fill="none" stroke="#f3f4f6" strokeWidth="18" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#14b8a6" strokeWidth="18"
                  strokeDasharray={`${(stats.deliveryRate / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
                  strokeDashoffset={2 * Math.PI * 36 * 0.25} transform="rotate(-90 50 50)" />
                <text x="50" y="47" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937">{stats.deliveryRate}%</text>
                <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#9ca3af">delivered</text>
              </svg>
              <div className="space-y-3 flex-1">
                {[{ label:'Delivered',value:stats.totalSent,color:'#14b8a6'},{label:'Failed',value:stats.totalFailed,color:'#ef4444'}].map(r=>(
                  <HorizBar key={r.label} label={r.label} value={r.value} max={stats.totalSent+stats.totalFailed} color={r.color} />
                ))}
                <div className="pt-2 border-t border-gray-100 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Avg / campaign</span><span className="font-semibold">{stats.avgPerCampaign.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total campaigns</span><span className="font-semibold">{stats.totalCampaigns}</span></div>
                </div>
              </div>
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-10">No sent campaigns yet</p>}
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Mail className="w-4 h-4 text-blue-500" /> Member Email Reach</p>
          <div className="space-y-3">
            {[{label:'Have email address',value:stats.withEmail,color:'#3b82f6',max:stats.withEmail||1},{label:'Opted out',value:stats.optedOut,color:'#ef4444',max:stats.withEmail||1},{label:'Reachable',value:stats.reachable,color:'#22c55e',max:stats.withEmail||1}].map(r=>(
              <HorizBar key={r.label} label={r.label} value={r.value} max={r.max} color={r.color} />
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <span className="font-semibold text-green-600">{stats.reachable}</span> members can be reached by email
            {stats.optedOut > 0 && <> · <span className="font-semibold text-red-500">{stats.optedOut}</span> opted out</>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-green-500" /> Emails Delivered by Month</p>
          {stats.bySentMonth.length > 0 ? (
            <div className="flex items-end gap-1.5 h-32">
              {stats.bySentMonth.map(d => {
                const maxV = Math.max(...stats.bySentMonth.map(x => x.value), 1)
                return (
                  <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500">{d.value.toLocaleString()}</span>
                    <div className="w-full rounded-t-sm" style={{ height: `${(d.value/maxV)*80}px`, backgroundColor:'#14b8a6', minHeight: d.value>0?4:0 }} />
                    <span className="text-[10px] text-gray-400">{d.label}</span>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-10">No data yet</p>}
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Top Campaigns by Delivery</p>
          {stats.topCampaigns.length > 0 ? (
            <div className="space-y-2">
              {stats.topCampaigns.map(c => <HorizBar key={c.id} label={c.title} value={c.sent_count} max={stats.topCampaigns[0]?.sent_count||1} color="#f59e0b" />)}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-10">No campaigns yet</p>}
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Send className="w-4 h-4 text-gray-400" /> All Campaigns</p>
          <p className="text-xs text-gray-400">Click <strong>View Report</strong> to see per-campaign details</p>
        </div>
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No campaigns yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Campaign','Status','Sent','Failed','Delivery %','Opens','Open %','Clicks','Click %','Date',''].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map(c => {
                  const attempted = c.sent_count + c.failed_count
                  const rate      = attempted > 0 ? Math.round((c.sent_count / attempted) * 100) : null
                  const opens     = c.open_count ?? 0
                  const clicks    = c.click_count ?? 0
                  const openPct   = c.sent_count > 0 ? Math.round((opens / c.sent_count) * 100) : null
                  const clickPct  = c.sent_count > 0 ? Math.round((clicks / c.sent_count) * 100) : null
                  return (
                    <tr key={c.id} className="hover:bg-amber-50 group">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-900">{c.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{c.subject}</p>
                      </td>
                      <td className="py-3 pr-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status]??'bg-gray-100 text-gray-500'}`}>{c.status}</span></td>
                      <td className="py-3 pr-4 text-green-600 font-semibold">{c.sent_count.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-red-500">{c.failed_count.toLocaleString()}</td>
                      <td className="py-3 pr-4 text-gray-600">{rate !== null ? `${rate}%` : '—'}</td>
                      <td className="py-3 pr-4 text-amber-600 font-semibold">{opens > 0 ? opens : '—'}</td>
                      <td className="py-3 pr-4 text-amber-500 text-xs">{openPct !== null && opens > 0 ? `${openPct}%` : '—'}</td>
                      <td className="py-3 pr-4 text-purple-600 font-semibold">{clicks > 0 ? clicks : '—'}</td>
                      <td className="py-3 pr-4 text-purple-500 text-xs">{clickPct !== null && clicks > 0 ? `${clickPct}%` : '—'}</td>
                      <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{c.sent_at ? formatDate(c.sent_at) : (c.created_at ? formatDate(c.created_at) : '—')}</td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <Link href={`/admin/governance/reports/email-report/${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors">
                          View Report <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
