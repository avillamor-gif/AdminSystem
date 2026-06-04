'use client'

import { useMemo } from 'react'
import {
  Users, Clock, CheckCircle, TrendingUp, Award,
  Building2, BookOpen, BarChart3, AlertTriangle, GraduationCap,
} from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { useProgramEnrollments, usePartnerInstitutions } from '@/hooks/useInternship'
import { useDepartments } from '@/hooks/useDepartments'

// ── helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100)
}

function formatHours(h: number) {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  )
}

function HorizontalBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = total === 0 ? 0 : Math.min(100, (value / total) * 100)
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-sm text-gray-600 w-40 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className={`h-3 rounded-full transition-all duration-500 ${color}`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-sm font-semibold text-gray-800 w-8 text-right">{value}</span>
      <span className="text-xs text-gray-400 w-10 text-right">{pct(value, total)}%</span>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ── status badge color ────────────────────────────────────────────────────────

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'active':    return 'warning'
    case 'completed': return 'success'
    case 'dropped':   return 'danger'
    case 'extended':  return 'warning'
    case 'pending':   return 'default'
    default:          return 'default'
  }
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function InternshipAnalyticsPage() {
  const { data: enrollments = [], isLoading } = useProgramEnrollments()
  const { data: institutions = [] } = usePartnerInstitutions()
  const { data: departments = [] } = useDepartments()

  const metrics = useMemo(() => {
    const total      = enrollments.length
    const active     = enrollments.filter(e => e.status === 'active')
    const completed  = enrollments.filter(e => e.status === 'completed')
    const dropped    = enrollments.filter(e => e.status === 'dropped')
    const extended   = enrollments.filter(e => e.status === 'extended')
    const pending    = enrollments.filter(e => e.status === 'pending')

    // Hours stats (active + completed)
    const withHours = enrollments.filter(e => Number(e.required_hours ?? 0) > 0)
    const avgRendered = withHours.length
      ? withHours.reduce((s, e) => s + Number(e.rendered_hours ?? 0), 0) / withHours.length
      : 0
    const avgRequired = withHours.length
      ? withHours.reduce((s, e) => s + Number(e.required_hours ?? 0), 0) / withHours.length
      : 0
    const totalRendered = enrollments.reduce((s, e) => s + Number(e.rendered_hours ?? 0), 0)
    const totalRequired = enrollments.reduce((s, e) => s + Number(e.required_hours ?? 0), 0)

    // Near-completion (>= 80% and still active)
    const nearComplete = active.filter(e => {
      const req = Number(e.required_hours ?? 0)
      const ren = Number(e.rendered_hours ?? 0)
      return req > 0 && ren / req >= 0.8
    })

    // At risk (< 30% done, active, end_date within 30 days)
    const now = new Date()
    const atRisk = active.filter(e => {
      const req = Number(e.required_hours ?? 0)
      const ren = Number(e.rendered_hours ?? 0)
      if (req === 0) return false
      const progress = ren / req
      if (progress >= 0.3) return false
      if (!e.end_date) return false
      const daysLeft = (new Date(e.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      return daysLeft <= 30
    })

    // Completion rate
    const completionRate = total === 0 ? 0 : pct(completed.length, total)

    // Certificate rate (of completed)
    const certIssued = enrollments.filter(e => e.certificate_issued).length
    const certRate = completed.length === 0 ? 0 : pct(certIssued, completed.length)

    // By program type
    const typeMap: Record<string, number> = {}
    enrollments.forEach(e => {
      const t = e.program_type ?? 'unknown'
      typeMap[t] = (typeMap[t] ?? 0) + 1
    })
    const typeRows = Object.entries(typeMap)
      .map(([label, count]) => ({ label: label.replace(/_/g, ' ').toUpperCase(), count }))
      .sort((a, b) => b.count - a.count)

    // By partner institution
    const instMap: Record<string, number> = {}
    enrollments.forEach(e => {
      const instId = e.partner_institution_id ?? '__none__'
      instMap[instId] = (instMap[instId] ?? 0) + 1
    })
    const instRows = Object.entries(instMap)
      .map(([id, count]) => ({
        label: (institutions as any[]).find(i => i.id === id)?.name ?? (id === '__none__' ? 'Independent' : id),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // By department
    const deptMap: Record<string, number> = {}
    enrollments.forEach(e => {
      const dId = e.department_id ?? '__none__'
      deptMap[dId] = (deptMap[dId] ?? 0) + 1
    })
    const deptRows = Object.entries(deptMap)
      .map(([id, count]) => ({
        label: (departments as any[]).find(d => d.id === id)?.name ?? (id === '__none__' ? 'Unassigned' : id),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    // Hours progress distribution (active only)
    const progressBuckets = [
      { label: 'Not started (0%)',   count: active.filter(e => Number(e.rendered_hours ?? 0) === 0).length },
      { label: 'Early (1–25%)',      count: active.filter(e => { const r = Number(e.required_hours ?? 0); const n = Number(e.rendered_hours ?? 0); return r > 0 && n / r > 0 && n / r <= 0.25 }).length },
      { label: 'Ongoing (26–50%)',   count: active.filter(e => { const r = Number(e.required_hours ?? 0); const n = Number(e.rendered_hours ?? 0); return r > 0 && n / r > 0.25 && n / r <= 0.5 }).length },
      { label: 'Halfway (51–75%)',   count: active.filter(e => { const r = Number(e.required_hours ?? 0); const n = Number(e.rendered_hours ?? 0); return r > 0 && n / r > 0.5 && n / r <= 0.75 }).length },
      { label: 'Near done (76–99%)', count: active.filter(e => { const r = Number(e.required_hours ?? 0); const n = Number(e.rendered_hours ?? 0); return r > 0 && n / r > 0.75 && n / r < 1 }).length },
      { label: 'Completed (100%)',   count: active.filter(e => { const r = Number(e.required_hours ?? 0); const n = Number(e.rendered_hours ?? 0); return r > 0 && n / r >= 1 }).length },
    ]

    return {
      total, active: active.length, completed: completed.length,
      dropped: dropped.length, extended: extended.length, pending: pending.length,
      avgRendered, avgRequired, totalRendered, totalRequired,
      nearComplete: nearComplete.length, atRisk: atRisk.length,
      completionRate, certIssued, certRate,
      typeRows, instRows, deptRows, progressBuckets,
    }
  }, [enrollments, institutions, departments])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const barColors = [
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
    'bg-pink-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500',
    'bg-orange-500', 'bg-amber-500',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Internship & Volunteer Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Program performance, hours progress, and enrollment breakdown</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Total Enrollments"  value={metrics.total}            sub="All time"                       color="bg-blue-500" />
        <StatCard icon={TrendingUp}  label="Active"             value={metrics.active}           sub={`${metrics.extended} extended`} color="bg-emerald-500" />
        <StatCard icon={CheckCircle} label="Completed"          value={metrics.completed}        sub={`${metrics.completionRate}% rate`} color="bg-green-500" />
        <StatCard icon={Award}       label="Certificates Issued" value={metrics.certIssued}      sub={`${metrics.certRate}% of completed`} color="bg-purple-500" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock}         label="Avg. Hours Rendered" value={formatHours(metrics.avgRendered)} sub={`of avg ${formatHours(metrics.avgRequired)} required`} color="bg-indigo-500" />
        <StatCard icon={BarChart3}     label="Total Hours Logged"  value={formatHours(metrics.totalRendered)} sub={`of ${formatHours(metrics.totalRequired)} total required`} color="bg-cyan-500" />
        <StatCard icon={GraduationCap} label="Near Completion"     value={metrics.nearComplete}   sub="≥ 80% done, still active"  color="bg-amber-500" />
        <StatCard icon={AlertTriangle} label="At Risk"             value={metrics.atRisk}         sub="< 30% done, ≤ 30 days left" color="bg-red-500" />
      </div>

      {/* Status summary */}
      <Card className="p-5">
        <SectionHeader title="Enrollment Status Breakdown" subtitle="All enrollments" />
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Active',    count: metrics.active,    variant: 'warning' as const },
            { label: 'Completed', count: metrics.completed, variant: 'success' as const },
            { label: 'Pending',   count: metrics.pending,   variant: 'default' as const },
            { label: 'Extended',  count: metrics.extended,  variant: 'warning' as const },
          { label: 'Dropped',   count: metrics.dropped,   variant: 'danger'  as const },
          ].map(({ label, count, variant }) => (
            <div key={label} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
              <Badge variant={variant}>{label}</Badge>
              <span className="text-xl font-bold text-gray-900">{count}</span>
              <span className="text-xs text-gray-400">({pct(count, metrics.total)}%)</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* By program type */}
        <Card className="p-5">
          <SectionHeader title="By Program Type" subtitle="All enrollments" />
          {metrics.typeRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No data</p>
          ) : (
            <div>
              {metrics.typeRows.map(({ label, count }, i) => (
                <HorizontalBar key={label} label={label} value={count} total={metrics.total} color={barColors[i % barColors.length]} />
              ))}
            </div>
          )}
        </Card>

        {/* Hours progress distribution */}
        <Card className="p-5">
          <SectionHeader title="Hours Progress Distribution" subtitle="Active enrollments only" />
          {metrics.active === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No active enrollments</p>
          ) : (
            <div>
              {metrics.progressBuckets.map(({ label, count }, i) => (
                <HorizontalBar key={label} label={label} value={count} total={metrics.active} color={barColors[i % barColors.length]} />
              ))}
            </div>
          )}
        </Card>

        {/* By partner institution */}
        <Card className="p-5">
          <SectionHeader title="By Partner Institution" subtitle="Top 10 — all enrollments" />
          {metrics.instRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No institutions on record</p>
          ) : (
            <div>
              {metrics.instRows.map(({ label, count }, i) => (
                <HorizontalBar key={label} label={label} value={count} total={metrics.total} color={barColors[i % barColors.length]} />
              ))}
            </div>
          )}
        </Card>

        {/* By department */}
        <Card className="p-5">
          <SectionHeader title="By Department" subtitle="All enrollments" />
          {metrics.deptRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No department data</p>
          ) : (
            <div>
              {metrics.deptRows.map(({ label, count }, i) => (
                <HorizontalBar key={label} label={label} value={count} total={metrics.total} color={barColors[i % barColors.length]} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* At-risk table */}
      {metrics.atRisk > 0 && (
        <Card className="p-5">
          <SectionHeader
            title={`At-Risk Interns (${metrics.atRisk})`}
            subtitle="Active enrollments with < 30% hours completed and ≤ 30 days remaining"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 font-semibold text-gray-600">Name</th>
                  <th className="pb-2 font-semibold text-gray-600">Program</th>
                  <th className="pb-2 font-semibold text-gray-600">Institution</th>
                  <th className="pb-2 font-semibold text-gray-600 text-right">Progress</th>
                  <th className="pb-2 font-semibold text-gray-600 text-right">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {enrollments
                  .filter(e => {
                    if (e.status !== 'active') return false
                    const req = Number(e.required_hours ?? 0)
                    const ren = Number(e.rendered_hours ?? 0)
                    if (req === 0 || ren / req >= 0.3) return false
                    if (!e.end_date) return false
                    const daysLeft = (new Date(e.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    return daysLeft <= 30
                  })
                  .sort((a, b) => {
                    const dA = a.end_date ? new Date(a.end_date).getTime() : Infinity
                    const dB = b.end_date ? new Date(b.end_date).getTime() : Infinity
                    return dA - dB
                  })
                  .map(e => {
                    const req = Number(e.required_hours ?? 0)
                    const ren = Number(e.rendered_hours ?? 0)
                    const progress = req > 0 ? pct(ren, req) : 0
                    const daysLeft = e.end_date
                      ? Math.ceil((new Date(e.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      : null
                    const emp = (e as any).employee
                    const fullName = emp ? `${emp.first_name} ${emp.last_name}` : '—'
                    return (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 font-medium text-gray-800">{fullName}</td>
                        <td className="py-2 text-gray-600 capitalize">{e.program_type?.replace(/_/g, ' ') ?? '—'}</td>
                        <td className="py-2 text-gray-600">{(e as any).partner_institution?.name ?? 'Independent'}</td>
                        <td className="py-2 text-right">
                          <span className="text-red-600 font-semibold">{progress}%</span>
                          <span className="text-gray-400 text-xs ml-1">({formatHours(ren)} / {formatHours(req)})</span>
                        </td>
                        <td className="py-2 text-right">
                          {daysLeft !== null ? (
                            <Badge variant={daysLeft <= 7 ? 'danger' : 'warning'}>{daysLeft}d</Badge>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
