'use client'

import { useMemo, useState } from 'react'
import {
  BarChart2, Package, RotateCcw, AlertTriangle, Users, Building2,
  TrendingUp, Clock, Calendar,
} from 'lucide-react'
import { Card } from '@/components/ui'
import { useAssetRequests, useAssets } from '@/hooks/useAssets'
import { useEmployees } from '@/hooks'
import { formatDate } from '@/lib/utils'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function StatCard({
  icon: Icon, label, value, sub, color = 'blue',
}: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color?: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  }
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

function HBarRow({ label, value, max, color = 'bg-blue-500' }: {
  label: string; value: number; max: number; color?: string
}) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-36 truncate text-gray-700 font-medium shrink-0" title={label}>{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-gray-600 font-semibold shrink-0">{value}</span>
    </div>
  )
}

export default function EquipmentAnalyticsPage() {
  const [monthRange, setMonthRange] = useState(6)

  const { data: requests = [], isLoading } = useAssetRequests({ status: 'fulfilled' })
  const { data: allAssets = [] } = useAssets({})
  const { data: employees = [] } = useEmployees()
  const employeeMap = useMemo(
    () => Object.fromEntries(employees.map(e => [e.id, `${e.first_name} ${e.last_name}`])),
    [employees]
  )

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const stats = useMemo(() => {
    const total = requests.length
    const returned = requests.filter(r => !!(r as any).returned_date).length
    const active = total - returned
    const overdue = requests.filter(r => {
      if ((r as any).returned_date) return false
      const end = r.borrow_end_date
      return end ? end < todayStr : false
    }).length
    const external = requests.filter(r => (r as any).borrower_type === 'external').length
    const internal = total - external
    return { total, returned, active, overdue, external, internal }
  }, [requests, todayStr])

  // Monthly trend
  const monthlyData = useMemo(() => {
    const months: { label: string; count: number; returned: number }[] = []
    for (let i = monthRange - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${MONTHS[d.getMonth()]} ${d.getFullYear() !== today.getFullYear() ? d.getFullYear() : ''}`
      const monthReqs = requests.filter(r => {
        const date = (r as any).fulfilled_date || r.requested_date || ''
        return date.startsWith(key)
      })
      months.push({ label: label.trim(), count: monthReqs.length, returned: monthReqs.filter(r => !!(r as any).returned_date).length })
    }
    return months
  }, [requests, monthRange])

  const monthMax = useMemo(() => Math.max(...monthlyData.map(m => m.count), 1), [monthlyData])

  // Top borrowed items
  const topItems = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of requests) {
      const name = r.item_description || 'Unknown'
      counts[name] = (counts[name] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [requests])
  const itemMax = topItems[0]?.[1] || 1

  // Top employee borrowers
  const topBorrowers = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of requests) {
      if ((r as any).borrower_type === 'external') continue
      const eid = (r as any).employee_id
      if (!eid) continue
      const name = employeeMap[eid] || eid
      counts[name] = (counts[name] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [requests, employeeMap])
  const borrowerMax = topBorrowers[0]?.[1] || 1

  // Top external orgs
  const topOrgs = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of requests) {
      if ((r as any).borrower_type !== 'external') continue
      const org = (r as any).external_borrower_org || (r as any).external_borrower_name || 'Unknown'
      counts[org] = (counts[org] || 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [requests])
  const orgMax = topOrgs[0]?.[1] || 1

  // Currently overdue list
  const overdueList = useMemo(() =>
    requests
      .filter(r => {
        if ((r as any).returned_date) return false
        return r.borrow_end_date ? r.borrow_end_date < todayStr : false
      })
      .sort((a, b) => (a.borrow_end_date || '').localeCompare(b.borrow_end_date || ''))
      .slice(0, 5),
    [requests, todayStr]
  )

  // Avg borrow duration (returned items only)
  const avgDuration = useMemo(() => {
    const durations = requests
      .filter(r => !!(r as any).returned_date && ((r as any).fulfilled_date || r.requested_date))
      .map(r => {
        const start = new Date((r as any).fulfilled_date || r.requested_date!)
        const end = new Date((r as any).returned_date)
        return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      })
    if (durations.length === 0) return '—'
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    return `${avg.toFixed(1)} days`
  }, [requests])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-3" />
        Loading analytics…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Analytics</h1>
          <p className="text-gray-500 mt-1">Borrowing trends and usage insights for office equipment</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>As of {formatDate(todayStr)}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Package}       label="Total Borrow Records"  value={stats.total}    color="blue" />
        <StatCard icon={TrendingUp}    label="Currently Borrowed"    value={stats.active}   color="yellow" />
        <StatCard icon={RotateCcw}     label="Returned"              value={stats.returned} color="green" />
        <StatCard icon={AlertTriangle} label="Overdue"               value={stats.overdue}  color="red" />
        <StatCard icon={Users}         label="Internal Borrowers"    value={stats.internal} color="purple" />
        <StatCard icon={Building2}     label="External Borrowers"    value={stats.external} color="orange" />
      </div>

      {/* Row 2: Monthly Trend + Avg Duration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend — takes 2/3 */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Monthly Borrow Activity</h3>
            </div>
            <select
              value={monthRange}
              onChange={e => setMonthRange(Number(e.target.value))}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-3 h-36">
            {monthlyData.map((m, i) => {
              const pct = monthMax === 0 ? 0 : (m.count / monthMax) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-gray-700">{m.count > 0 ? m.count : ''}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${Math.max(pct, m.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 text-center leading-tight">{m.label}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Quick Stats card */}
        <Card className="p-6 flex flex-col gap-5">
          <h3 className="font-semibold text-gray-900">Quick Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Avg. borrow duration</span>
              <span className="font-semibold text-gray-900">{avgDuration}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Return rate</span>
              <span className="font-semibold text-green-600">
                {stats.total === 0 ? '—' : `${Math.round((stats.returned / stats.total) * 100)}%`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Overdue rate</span>
              <span className={`font-semibold ${stats.overdue > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                {stats.active === 0 ? '—' : `${Math.round((stats.overdue / stats.active) * 100)}%`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Unique equipment types</span>
              <span className="font-semibold text-gray-900">{topItems.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Total assets in inventory</span>
              <span className="font-semibold text-gray-900">{allAssets.length}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3: Top Items + Top Borrowers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Package className="w-4 h-4 text-green-600" />
            <h3 className="font-semibold text-gray-900">Most Borrowed Equipment</h3>
          </div>
          {topItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {topItems.map(([name, count]) => (
                <HBarRow key={name} label={name} value={count} max={itemMax} color="bg-green-500" />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Top Employee Borrowers</h3>
          </div>
          {topBorrowers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No internal borrow records.</p>
          ) : (
            <div className="space-y-3">
              {topBorrowers.map(([name, count]) => (
                <HBarRow key={name} label={name} value={count} max={borrowerMax} color="bg-purple-500" />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 4: External Orgs + Overdue List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Top External Organizations</h3>
          </div>
          {topOrgs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No external borrow records.</p>
          ) : (
            <div className="space-y-3">
              {topOrgs.map(([name, count]) => (
                <HBarRow key={name} label={name} value={count} max={orgMax} color="bg-orange-400" />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900">Currently Overdue</h3>
          </div>
          {overdueList.length === 0 ? (
            <p className="text-sm text-green-600 text-center py-6 font-medium">✓ No overdue items</p>
          ) : (
            <div className="space-y-3">
              {overdueList.map(r => {
                const bt = (r as any).borrower_type || 'employee'
                const borrowerName = bt === 'external'
                  ? ((r as any).external_borrower_name || 'External')
                  : (employeeMap[(r as any).employee_id] || '—')
                const daysOverdue = r.borrow_end_date
                  ? Math.max(0, Math.round((today.getTime() - new Date(r.borrow_end_date).getTime()) / (1000 * 60 * 60 * 24)))
                  : 0
                return (
                  <div key={r.id} className="flex items-start justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{r.item_description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{borrowerName}</p>
                      <p className="text-xs text-gray-400">Due: {r.borrow_end_date ? formatDate(r.borrow_end_date) : '—'}</p>
                    </div>
                    <span className="shrink-0 ml-3 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      {daysOverdue}d overdue
                    </span>
                  </div>
                )
              })}
              {stats.overdue > 5 && (
                <p className="text-xs text-gray-400 text-center">+ {stats.overdue - 5} more overdue items</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
