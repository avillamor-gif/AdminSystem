'use client'

import { useMemo } from 'react'
import {
  Users, TrendingUp, TrendingDown, UserCheck, UserX, Mail,
  BarChart2, Send, MapPin, Calendar, Award, BellOff,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { useMembers, useMemberCampaigns } from '@/hooks/useGovernance'
import { formatDate } from '@/lib/utils'

// ── Mini chart helpers (pure CSS / SVG — no extra libs) ────────────────────────

function BarChart({ data, color = '#d97706' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">{d.value}</span>
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${(d.value / max) * 64}px`, backgroundColor: color, minHeight: d.value > 0 ? 4 : 0 }}
          />
          <span className="text-[10px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

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

function DonutSegment({ pct, offset, color }: { pct: number; offset: number; color: string }) {
  const r = 40, circ = 2 * Math.PI * r
  return (
    <circle
      cx="50" cy="50" r={r} fill="none"
      stroke={color} strokeWidth="18"
      strokeDasharray={`${(pct / 100) * circ} ${circ}`}
      strokeDashoffset={-((offset / 100) * circ)}
      transform="rotate(-90 50 50)"
    />
  )
}

// ── Analytics Page ─────────────────────────────────────────────────────────────

const TYPE_COLORS_MAP: Record<string, string> = {
  regular:       '#3b82f6',
  associate:     '#a855f7',
  honorary:      '#f59e0b',
  institutional: '#14b8a6',
}

const STATUS_COLORS_MAP: Record<string, string> = {
  active:    '#22c55e',
  inactive:  '#9ca3af',
  suspended: '#f97316',
  lapsed:    '#eab308',
  deceased:  '#ef4444',
}

export default function MembershipAnalyticsPage() {
  const { data: members = [], isLoading: membersLoading } = useMembers()
  const { data: campaigns = [], isLoading: campaignsLoading } = useMemberCampaigns()
  const isLoading = membersLoading || campaignsLoading

  // ── Derived stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total    = members.length
    const active   = members.filter(m => m.status === 'active').length
    const inactive = members.filter(m => m.status === 'inactive').length
    const lapsed   = members.filter(m => m.status === 'lapsed').length
    const deceased = members.filter(m => m.status === 'deceased').length
    const optedOut = members.filter(m => m.opt_out_email).length
    const withEmail = members.filter(m => m.email).length
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0

    // By type
    const byType = (['regular','associate','honorary','institutional'] as const).map(t => ({
      label: t.charAt(0).toUpperCase() + t.slice(1),
      value: members.filter(m => m.membership_type === t).length,
      color: TYPE_COLORS_MAP[t],
    }))

    // By status
    const byStatus = (['active','inactive','suspended','lapsed','deceased'] as const).map(s => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: members.filter(m => m.status === s).length,
      color: STATUS_COLORS_MAP[s],
    }))

    // By country (top 8)
    const countryMap: Record<string, number> = {}
    for (const m of members) {
      const c = m.country || 'Unknown'
      countryMap[c] = (countryMap[c] || 0) + 1
    }
    const byCountry = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({ label, value }))

    // Admissions by year
    const yearMap: Record<string, number> = {}
    for (const m of members) {
      if (!m.date_admitted) continue
      const y = m.date_admitted.slice(0, 4)
      yearMap[y] = (yearMap[y] || 0) + 1
    }
    const years = Object.keys(yearMap).sort()
    const lastYears = years.slice(-8)
    const byYear = lastYears.map(y => ({ label: y, value: yearMap[y] }))

    // Admissions this year vs last year
    const thisYear = new Date().getFullYear().toString()
    const lastYear = (new Date().getFullYear() - 1).toString()
    const admittedThisYear = yearMap[thisYear] || 0
    const admittedLastYear = yearMap[lastYear] || 0

    // Newest members (last 5)
    const newest = [...members]
      .filter(m => m.date_admitted)
      .sort((a, b) => (b.date_admitted ?? '').localeCompare(a.date_admitted ?? ''))
      .slice(0, 5)

    // Campaign stats
    const sentCampaigns   = campaigns.filter(c => c.status === 'sent')
    const totalSent       = sentCampaigns.reduce((s, c) => s + c.sent_count, 0)
    const totalFailed     = sentCampaigns.reduce((s, c) => s + c.failed_count, 0)
    const deliveryRate    = (totalSent + totalFailed) > 0
      ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0

    // Donut pct offsets
    let offset = 0
    const typeDonut = byType.map(t => {
      const pct = total > 0 ? (t.value / total) * 100 : 0
      const seg = { ...t, pct, offset }
      offset += pct
      return seg
    })

    return {
      total, active, inactive, lapsed, deceased, optedOut, withEmail,
      activeRate, byType, byStatus, byCountry, byYear,
      admittedThisYear, admittedLastYear,
      newest,
      sentCampaigns: sentCampaigns.length, totalSent, totalFailed, deliveryRate,
      typeDonut,
    }
  }, [members, campaigns])

  if (isLoading) {
    return <div className="p-16 text-center text-gray-400 text-sm">Loading analytics…</div>
  }

  const yoyChange = stats.admittedThisYear - stats.admittedLastYear
  const reachable = stats.withEmail - stats.optedOut

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membership Analytics</h1>
        <p className="text-gray-600 mt-1">Comprehensive overview of membership data and campaign performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members',   value: stats.total,        icon: Users,     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
          { label: 'Active Members',  value: stats.active,       icon: UserCheck, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100'  },
          { label: 'Lapsed / Inactive', value: stats.lapsed + stats.inactive, icon: UserX, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { label: 'Active Rate',     value: `${stats.activeRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
        ].map(s => (
          <Card key={s.label} className={`p-5 border ${s.border}`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Second row KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Admitted This Year', value: stats.admittedThisYear, sub: yoyChange >= 0 ? `+${yoyChange} vs last year` : `${yoyChange} vs last year`, subColor: yoyChange >= 0 ? 'text-green-600' : 'text-red-500', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'With Email Address', value: stats.withEmail, sub: `${stats.total - stats.withEmail} without email`, subColor: 'text-gray-400', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Email Opted Out',    value: stats.optedOut, sub: `${reachable} reachable`, subColor: 'text-green-600', icon: BellOff, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { label: 'Campaigns Sent',     value: stats.sentCampaigns, sub: `${stats.totalSent.toLocaleString()} emails delivered`, subColor: 'text-green-600', icon: Send, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100' },
        ].map(s => (
          <Card key={s.label} className={`p-5 border ${s.border}`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            {s.sub && <p className={`text-xs mt-1 font-medium ${s.subColor}`}>{s.sub}</p>}
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Donut — by type */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> By Membership Type
          </p>
          {stats.total > 0 ? (
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 100 100" className="w-24 h-24 flex-shrink-0">
                {stats.typeDonut.map(seg => (
                  <DonutSegment key={seg.label} pct={seg.pct} offset={seg.offset} color={seg.color} />
                ))}
                <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937">{stats.total}</text>
              </svg>
              <div className="space-y-2 flex-1">
                {stats.byType.map(t => (
                  <div key={t.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="text-xs text-gray-600">{t.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-800">{t.value}</span>
                      <span className="text-[10px] text-gray-400">
                        {stats.total > 0 ? Math.round((t.value / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          )}
        </Card>

        {/* Bar — by status */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" /> By Status
          </p>
          <div className="space-y-2.5">
            {stats.byStatus.filter(s => s.value > 0).map(s => (
              <HorizBar key={s.label} label={s.label} value={s.value} max={stats.total} color={s.color} />
            ))}
            {stats.byStatus.every(s => s.value === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
            )}
          </div>
        </Card>

        {/* Bar — admissions by year */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Admissions by Year
          </p>
          {stats.byYear.length > 0 ? (
            <BarChart data={stats.byYear} color="#22c55e" />
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No admission dates recorded</p>
          )}
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Geographic distribution */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-500" /> Geographic Distribution (Top Countries)
          </p>
          {stats.byCountry.length > 0 ? (
            <div className="space-y-2.5">
              {stats.byCountry.map(c => (
                <HorizBar key={c.label} label={c.label} value={c.value} max={stats.byCountry[0].value} color="#8b5cf6" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No country data recorded</p>
          )}
        </Card>

        {/* Campaign performance */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-teal-500" /> Email Campaign Performance
          </p>
          {campaigns.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No campaigns yet</p>
          ) : (
            <div className="space-y-4">
              {/* Delivery rate donut */}
              <div className="flex items-center gap-5">
                <svg viewBox="0 0 100 100" className="w-20 h-20 flex-shrink-0">
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#f3f4f6" strokeWidth="16" />
                  <circle cx="50" cy="50" r="36" fill="none" stroke="#14b8a6" strokeWidth="16"
                    strokeDasharray={`${(stats.deliveryRate / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
                    strokeDashoffset={2 * Math.PI * 36 * 0.25} transform="rotate(-90 50 50)" />
                  <text x="50" y="54" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937">
                    {stats.deliveryRate}%
                  </text>
                </svg>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Sent</span>
                    <span className="font-semibold text-green-600">{stats.totalSent.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Failed / Bounced</span>
                    <span className="font-semibold text-red-500">{stats.totalFailed.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Delivery Rate</span>
                    <span className="font-semibold text-teal-600">{stats.deliveryRate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Campaigns</span>
                    <span className="font-semibold text-gray-700">{campaigns.length} total, {stats.sentCampaigns} sent</span>
                  </div>
                </div>
              </div>

              {/* Recent campaigns */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-400 uppercase mb-2">Recent Campaigns</p>
                <div className="space-y-2">
                  {campaigns.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{c.title}</p>
                        <p className="text-xs text-gray-400">{c.sent_at ? formatDate(c.sent_at) : (c.created_at ? formatDate(c.created_at) : '—')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{c.sent_count}</p>
                        <p className="text-xs text-gray-400">delivered</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Newest Members */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-500" /> Recently Admitted Members
        </p>
        {stats.newest.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No members with admission dates</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase">Name</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase">Member #</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="text-left py-2 text-xs font-medium text-gray-400 uppercase">Date Admitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.newest.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{m.first_name} {m.last_name}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{m.member_number || '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{ backgroundColor: TYPE_COLORS_MAP[m.membership_type] + '20', color: TYPE_COLORS_MAP[m.membership_type] }}>
                        {m.membership_type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{ backgroundColor: STATUS_COLORS_MAP[m.status] + '20', color: STATUS_COLORS_MAP[m.status] }}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-600">{m.date_admitted ? formatDate(m.date_admitted) : '—'}</td>
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
