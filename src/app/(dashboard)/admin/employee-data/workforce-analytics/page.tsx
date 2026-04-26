'use client'

import { useMemo, useState } from 'react'
import {
  Users, UserCheck, UserX, TrendingUp, TrendingDown,
  Calendar, Building2, Briefcase, Globe, Heart,
  MapPin, BarChart3, PieChart, Activity, Download,
  UserPlus, Clock, Award, AlertTriangle,
} from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { useEmployees } from '@/hooks/useEmployees'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmploymentTypes } from '@/hooks/useEmploymentTypes'
import { formatDate } from '@/lib/utils'

// ── helpers ──────────────────────────────────────────────────────────────────

function age(dob: string | null): number | null {
  if (!dob) return null
  const today = new Date()
  const birth = new Date(dob)
  let a = today.getFullYear() - birth.getFullYear()
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) a--
  return a
}

function tenureYears(hireDate: string | null): number | null {
  if (!hireDate) return null
  const today = new Date()
  const hire = new Date(hireDate)
  return (today.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

function pct(n: number, total: number) {
  return total === 0 ? 0 : Math.round((n / total) * 100)
}

function avg(arr: number[]) {
  return arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length
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

function HorizontalBar({
  label,
  value,
  total,
  color,
  badge,
}: {
  label: string
  value: number
  total: number
  color: string
  badge?: string
}) {
  const p = pct(value, total)
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-sm text-gray-700 truncate shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${p}%` }}
        />
      </div>
      <div className="w-12 text-right text-sm font-semibold text-gray-800">{value}</div>
      <div className="w-10 text-right text-xs text-gray-400">{p}%</div>
      {badge && (
        <Badge variant="outline" className="text-xs shrink-0">{badge}</Badge>
      )}
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'demographics' | 'tenure' | 'headcount'

export default function WorkforceAnalyticsPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [filterEtId, setFilterEtId] = useState<string>('all')
  const [filterDeptId, setFilterDeptId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')

  const { data: allEmployees = [] } = useEmployees({})
  const { data: departments = [] } = useDepartments()
  const { data: employmentTypes = [] } = useEmploymentTypes()

  // ── filtered employee list (drives all metrics) ────────────────────────────
  const filteredEmployees = useMemo(() => {
    let list = allEmployees as any[]
    if (filterStatus !== 'all') list = list.filter(e => e.status === filterStatus)
    if (filterEtId !== 'all')   list = list.filter(e => e.employment_type_id === filterEtId)
    if (filterDeptId !== 'all') list = list.filter(e => e.department_id === filterDeptId)
    return list
  }, [allEmployees, filterStatus, filterEtId, filterDeptId])

  // ── computed metrics ───────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const employees = filteredEmployees as any[]

    const active      = employees.filter(e => e.status === 'active')
    const inactive    = employees.filter(e => e.status === 'inactive')
    const terminated  = employees.filter(e => e.status === 'terminated')

    // Gender
    const male   = active.filter(e => (e.sex ?? '').toLowerCase() === 'male').length
    const female = active.filter(e => (e.sex ?? '').toLowerCase() === 'female').length
    const otherGender = active.length - male - female

    // Age buckets (active only)
    const ages = active.map(e => age(e.date_of_birth)).filter((a): a is number => a !== null)
    const ageBuckets = [
      { label: 'Under 25',  count: ages.filter(a => a < 25).length },
      { label: '25 – 34',   count: ages.filter(a => a >= 25 && a < 35).length },
      { label: '35 – 44',   count: ages.filter(a => a >= 35 && a < 45).length },
      { label: '45 – 54',   count: ages.filter(a => a >= 45 && a < 55).length },
      { label: '55+',       count: ages.filter(a => a >= 55).length },
      { label: 'Not on file', count: active.length - ages.length },
    ]
    const avgAge = ages.length ? Math.round(avg(ages)) : null

    // Tenure (active only)
    const tenures = active.map(e => tenureYears(e.hire_date)).filter((t): t is number => t !== null)
    const tenureBuckets = [
      { label: '< 1 year',    count: tenures.filter(t => t < 1).length },
      { label: '1 – 2 years', count: tenures.filter(t => t >= 1 && t < 3).length },
      { label: '3 – 5 years', count: tenures.filter(t => t >= 3 && t < 6).length },
      { label: '6 – 10 years',count: tenures.filter(t => t >= 6 && t < 11).length },
      { label: '10+ years',   count: tenures.filter(t => t >= 11).length },
    ]
    const avgTenure = tenures.length ? avg(tenures) : null

    // Department headcount (active)
    const deptMap: Record<string, number> = {}
    active.forEach(e => {
      const deptId = e.department_id
      if (deptId) deptMap[deptId] = (deptMap[deptId] ?? 0) + 1
      else deptMap['__none__'] = (deptMap['__none__'] ?? 0) + 1
    })
    const deptRows = Object.entries(deptMap)
      .map(([id, count]) => ({
        name: (departments as any[]).find(d => d.id === id)?.name ?? (id === '__none__' ? 'Unassigned' : id),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    // Employment type (active)
    const etMap: Record<string, number> = {}
    active.forEach(e => {
      const etId = e.employment_type_id
      if (etId) etMap[etId] = (etMap[etId] ?? 0) + 1
      else etMap['__none__'] = (etMap['__none__'] ?? 0) + 1
    })
    const etRows = Object.entries(etMap)
      .map(([id, count]) => ({
        name: (employmentTypes as any[]).find(t => t.id === id)?.name ?? (id === '__none__' ? 'Unassigned' : id),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    // Work location type (active)
    const wltMap: Record<string, number> = {}
    active.forEach(e => {
      const wlt = e.work_location_type ?? 'on-site'
      wltMap[wlt] = (wltMap[wlt] ?? 0) + 1
    })
    const wltRows = Object.entries(wltMap)
      .map(([label, count]) => ({ label: label.replace(/_/g, ' '), count }))
      .sort((a, b) => b.count - a.count)

    // Marital status (active)
    const msMap: Record<string, number> = {}
    active.forEach(e => {
      const ms = e.marital_status ?? 'not specified'
      msMap[ms] = (msMap[ms] ?? 0) + 1
    })
    const msRows = Object.entries(msMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)

    // Nationality top 10 (active)
    const natMap: Record<string, number> = {}
    active.forEach(e => {
      const n = e.nationality ?? 'not specified'
      natMap[n] = (natMap[n] ?? 0) + 1
    })
    const natRows = Object.entries(natMap)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // New hires last 12 months
    const now = new Date()
    const monthlyHires: { month: string; count: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      const count = employees.filter(e => {
        if (!e.hire_date) return false
        const hd = e.hire_date.slice(0, 7)
        return hd === key
      }).length
      monthlyHires.push({ month: label, count })
    }

    // Terminations last 12 months (rough — employees whose status changed to terminated and hire_date is proxy)
    // We don't have a termination_date column, so just show termination headcount
    const terminationCount = terminated.length

    // Retention rate (simple: active / (active + terminated))
    const retentionRate = (active.length + terminated.length) > 0
      ? Math.round((active.length / (active.length + terminated.length)) * 100)
      : 100

    // Headcount by hire year
    const hireYearMap: Record<string, number> = {}
    employees.forEach(e => {
      if (e.hire_date) {
        const yr = e.hire_date.slice(0, 4)
        hireYearMap[yr] = (hireYearMap[yr] ?? 0) + 1
      }
    })
    const hireYearRows = Object.entries(hireYearMap)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year.localeCompare(b.year))

    return {
      total: employees.length,
      active: active.length,
      inactive: inactive.length,
      terminated: terminated.length,
      male, female, otherGender,
      ageBuckets, avgAge,
      tenureBuckets, avgTenure,
      deptRows, etRows, wltRows, msRows, natRows,
      monthlyHires, terminationCount, retentionRate,
      hireYearRows,
      avgTenureStr: avgTenure !== null
        ? `${Math.floor(avgTenure)}y ${Math.round((avgTenure % 1) * 12)}m`
        : '—',
    }
  }, [filteredEmployees, departments, employmentTypes])

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview',     label: 'Overview',       icon: BarChart3 },
    { key: 'demographics', label: 'Demographics',    icon: PieChart },
    { key: 'tenure',       label: 'Tenure & Retention', icon: Clock },
    { key: 'headcount',    label: 'Headcount Trends', icon: TrendingUp },
  ]

  const barColors = [
    'bg-orange-400', 'bg-blue-400', 'bg-emerald-400', 'bg-violet-400',
    'bg-amber-400', 'bg-rose-400', 'bg-teal-400', 'bg-indigo-400',
    'bg-pink-400', 'bg-cyan-400',
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workforce Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive workforce insights for assessment reporting — data as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 shrink-0">Status</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
            <option value="all">All Statuses</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 shrink-0">Employment Type</label>
          <select
            value={filterEtId}
            onChange={e => setFilterEtId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="all">All Types</option>
            {(employmentTypes as any[]).map((et: any) => (
              <option key={et.id} value={et.id}>{et.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 shrink-0">Department</label>
          <select
            value={filterDeptId}
            onChange={e => setFilterDeptId(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="all">All Departments</option>
            {(departments as any[]).map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
          <span className="font-semibold text-gray-700">{filteredEmployees.length}</span>
          employees shown
        </div>

        {(filterStatus !== 'active' || filterEtId !== 'all' || filterDeptId !== 'all') && (
          <button
            onClick={() => { setFilterStatus('active'); setFilterEtId('all'); setFilterDeptId('all') }}
            className="text-xs text-orange-600 hover:text-orange-800 font-medium underline underline-offset-2"
          >
            Reset filters
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Employees"  value={metrics.total}      sub="all statuses"                  color="bg-orange-500" />
        <StatCard icon={UserCheck} label="Active"           value={metrics.active}     sub={`${pct(metrics.active, metrics.total)}% of total`}  color="bg-emerald-500" />
        <StatCard icon={UserX}     label="Terminated"       value={metrics.terminated} sub={`${pct(metrics.terminated, metrics.total)}% of total`} color="bg-red-400" />
        <StatCard icon={Activity}  label="Retention Rate"   value={`${metrics.retentionRate}%`} sub="active ÷ (active + terminated)" color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar}  label="Avg. Tenure"      value={metrics.avgTenureStr}          sub="active employees"      color="bg-violet-500" />
        <StatCard icon={Award}     label="Avg. Age"         value={metrics.avgAge ? `${metrics.avgAge} yrs` : '—'} sub="active employees"  color="bg-amber-500" />
        <StatCard icon={UserPlus}  label="New Hires (12mo)" value={metrics.monthlyHires.reduce((a, b) => a + b.count, 0)} sub="last 12 months"   color="bg-teal-500" />
        <StatCard icon={AlertTriangle} label="Inactive"     value={metrics.inactive} sub={`${pct(metrics.inactive, metrics.total)}% of total`}   color="bg-gray-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.key
                ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Gender Distribution */}
          <Card className="p-5">
            <SectionHeader title="Gender Distribution" subtitle="Active employees" />
            <div className="space-y-3">
              <HorizontalBar label="Male"    value={metrics.male}        total={metrics.active} color="bg-blue-400" />
              <HorizontalBar label="Female"  value={metrics.female}      total={metrics.active} color="bg-pink-400" />
              {metrics.otherGender > 0 &&
                <HorizontalBar label="Other / NB" value={metrics.otherGender} total={metrics.active} color="bg-violet-400" />}
              <HorizontalBar label="Not specified" value={metrics.active - metrics.male - metrics.female - (metrics.otherGender > 0 ? metrics.otherGender : 0)} total={metrics.active} color="bg-gray-300" />
            </div>
            <div className="mt-5 flex gap-6 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500">{metrics.male}</div>
                <div className="text-xs text-gray-400">Male</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{metrics.female}</div>
                <div className="text-xs text-gray-400">Female</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{metrics.active - metrics.male - metrics.female}</div>
                <div className="text-xs text-gray-400">Other / N/A</div>
              </div>
            </div>
          </Card>

          {/* Employment Type */}
          <Card className="p-5">
            <SectionHeader title="Employment Type" subtitle="Active employees" />
            <div className="space-y-3">
              {metrics.etRows.map((row, i) => (
                <HorizontalBar key={row.name} label={row.name} value={row.count} total={metrics.active} color={barColors[i % barColors.length]} />
              ))}
              {metrics.etRows.length === 0 && <p className="text-sm text-gray-400">No data available</p>}
            </div>
          </Card>

          {/* Department Headcount */}
          <Card className="p-5 lg:col-span-2">
            <SectionHeader title="Headcount by Department" subtitle="Active employees" />
            <div className="space-y-3">
              {metrics.deptRows.map((row, i) => (
                <HorizontalBar key={row.name} label={row.name} value={row.count} total={metrics.active} color={barColors[i % barColors.length]} />
              ))}
              {metrics.deptRows.length === 0 && <p className="text-sm text-gray-400">No department data available</p>}
            </div>
          </Card>

          {/* Work Location Type */}
          <Card className="p-5">
            <SectionHeader title="Work Location Type" subtitle="Active employees" />
            <div className="space-y-3">
              {metrics.wltRows.map((row, i) => (
                <HorizontalBar key={row.label} label={row.label} value={row.count} total={metrics.active} color={barColors[i % barColors.length]} />
              ))}
              {metrics.wltRows.length === 0 && <p className="text-sm text-gray-400">No data available</p>}
            </div>
          </Card>

          {/* Status Breakdown */}
          <Card className="p-5">
            <SectionHeader title="Employee Status" subtitle="All employees" />
            <div className="space-y-3">
              <HorizontalBar label="Active"     value={metrics.active}     total={metrics.total} color="bg-emerald-400" />
              <HorizontalBar label="Inactive"   value={metrics.inactive}   total={metrics.total} color="bg-amber-400" />
              <HorizontalBar label="Terminated" value={metrics.terminated} total={metrics.total} color="bg-red-400" />
            </div>
            <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">
                  Retention Rate: {metrics.retentionRate}%
                </span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                {metrics.active} active out of {metrics.active + metrics.terminated} total (excl. inactive)
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── DEMOGRAPHICS TAB ─────────────────────────────────────────────── */}
      {tab === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Age Distribution */}
          <Card className="p-5">
            <SectionHeader
              title="Age Distribution"
              subtitle={metrics.avgAge ? `Average age: ${metrics.avgAge} years (active employees)` : 'Active employees'}
            />
            <div className="space-y-3">
              {metrics.ageBuckets.map((b, i) => (
                <HorizontalBar key={b.label} label={b.label} value={b.count} total={metrics.active} color={barColors[i % barColors.length]} />
              ))}
            </div>
          </Card>

          {/* Marital Status */}
          <Card className="p-5">
            <SectionHeader title="Marital Status" subtitle="Active employees" />
            <div className="space-y-3">
              {metrics.msRows.map((row, i) => (
                <HorizontalBar key={row.label} label={row.label} value={row.count} total={metrics.active} color={barColors[i % barColors.length]} />
              ))}
              {metrics.msRows.length === 0 && <p className="text-sm text-gray-400">No data available</p>}
            </div>
          </Card>

          {/* Nationality */}
          <Card className="p-5 lg:col-span-2">
            <SectionHeader title="Nationality (Top 10)" subtitle="Active employees" />
            <div className="space-y-3">
              {metrics.natRows.map((row, i) => (
                <HorizontalBar key={row.label} label={row.label} value={row.count} total={metrics.active} color={barColors[i % barColors.length]} />
              ))}
              {metrics.natRows.length === 0 && <p className="text-sm text-gray-400">No nationality data on file</p>}
            </div>
          </Card>

          {/* Insight cards */}
          <Card className="p-5 bg-blue-50 border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">Gender Balance</p>
                <p className="text-sm text-blue-700 mt-1">
                  {metrics.active > 0
                    ? `${pct(metrics.female, metrics.active)}% female · ${pct(metrics.male, metrics.active)}% male`
                    : 'No active employees'}
                </p>
                {metrics.female > 0 && metrics.male > 0 && (
                  <p className="text-xs text-blue-500 mt-1">
                    {Math.abs(pct(metrics.female, metrics.active) - 50) < 10
                      ? '✅ Well-balanced gender ratio'
                      : pct(metrics.female, metrics.active) > pct(metrics.male, metrics.active)
                        ? '📊 Female-majority workforce'
                        : '📊 Male-majority workforce'}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-amber-50 border-amber-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Age Profile</p>
                <p className="text-sm text-amber-700 mt-1">
                  {metrics.avgAge ? `Average age is ${metrics.avgAge} years` : 'Age data not available'}
                </p>
                {metrics.avgAge && (
                  <p className="text-xs text-amber-500 mt-1">
                    {metrics.avgAge < 30 ? '🌱 Young workforce' : metrics.avgAge < 40 ? '⚡ Mid-career workforce' : '🎖️ Experienced workforce'}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── TENURE & RETENTION TAB ───────────────────────────────────────── */}
      {tab === 'tenure' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Tenure Distribution */}
          <Card className="p-5">
            <SectionHeader
              title="Tenure Distribution"
              subtitle={`Average tenure: ${metrics.avgTenureStr} (active employees)`}
            />
            <div className="space-y-3">
              {metrics.tenureBuckets.map((b, i) => (
                <HorizontalBar key={b.label} label={b.label} value={b.count} total={metrics.active} color={barColors[i % barColors.length]} />
              ))}
            </div>
          </Card>

          {/* Retention snapshot */}
          <Card className="p-5">
            <SectionHeader title="Retention Snapshot" subtitle="All-time headcount" />
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div>
                  <p className="text-sm text-emerald-700 font-medium">Overall Retention Rate</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-0.5">{metrics.retentionRate}%</p>
                  <p className="text-xs text-emerald-500 mt-1">
                    {metrics.active} active · {metrics.terminated} terminated
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-emerald-400" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-800">{metrics.tenureBuckets[0].count}</div>
                  <div className="text-xs text-gray-400 mt-0.5">New (&lt; 1yr)</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-800">
                    {metrics.tenureBuckets[1].count + metrics.tenureBuckets[2].count}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Developing (1–5yr)</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-800">
                    {metrics.tenureBuckets[3].count + metrics.tenureBuckets[4].count}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">Veteran (6yr+)</div>
                </div>
              </div>

              <div className="p-3 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
                <p className="text-sm font-medium text-blue-800">Insights</p>
                <ul className="mt-1 space-y-1 text-xs text-blue-700">
                  <li>• {pct(metrics.tenureBuckets[4].count, metrics.active)}% of active employees have 10+ years tenure</li>
                  <li>• {pct(metrics.tenureBuckets[0].count, metrics.active)}% are in their first year (onboarding risk)</li>
                  <li>• {metrics.terminationCount} total terminations on record</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Tenure by Department */}
          <Card className="p-5 lg:col-span-2">
            <SectionHeader title="New Hires — Last 12 Months" subtitle="Monthly hiring activity" />
            <div className="space-y-2">
              {metrics.monthlyHires.map((m, i) => {
                const maxHires = Math.max(...metrics.monthlyHires.map(x => x.count), 1)
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-14 text-xs text-gray-500 shrink-0">{m.month}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-5 bg-orange-400 rounded-full flex items-center pl-2 transition-all duration-500"
                        style={{ width: `${pct(m.count, maxHires)}%` }}
                      >
                        {m.count > 0 && (
                          <span className="text-white text-xs font-medium">{m.count}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-6 text-right text-sm font-semibold text-gray-700">{m.count}</div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── HEADCOUNT TRENDS TAB ─────────────────────────────────────────── */}
      {tab === 'headcount' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Hiring by Year */}
          <Card className="p-5 lg:col-span-2">
            <SectionHeader title="Total Hires by Year" subtitle="Cumulative headcount hired per year (all employees)" />
            <div className="space-y-2">
              {metrics.hireYearRows.map((row) => {
                const maxCount = Math.max(...metrics.hireYearRows.map(r => r.count), 1)
                return (
                  <div key={row.year} className="flex items-center gap-3">
                    <div className="w-12 text-sm text-gray-500 shrink-0">{row.year}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-6 bg-blue-400 rounded-full flex items-center pl-2 transition-all duration-500"
                        style={{ width: `${pct(row.count, maxCount)}%` }}
                      >
                        {row.count > 0 && (
                          <span className="text-white text-xs font-semibold">{row.count}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-8 text-right text-sm font-bold text-gray-700">{row.count}</div>
                  </div>
                )
              })}
              {metrics.hireYearRows.length === 0 && <p className="text-sm text-gray-400">No hire date data available</p>}
            </div>
          </Card>

          {/* Department breakdown with employment type context */}
          <Card className="p-5">
            <SectionHeader title="Department vs Employment Type" subtitle="Active employees" />
            <div className="space-y-4">
              {metrics.deptRows.slice(0, 6).map((dept, i) => (
                <div key={dept.name} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">{dept.name}</span>
                    <Badge variant="outline">{dept.count} employees</Badge>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${barColors[i % barColors.length]}`}
                      style={{ width: `${pct(dept.count, metrics.active)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{pct(dept.count, metrics.active)}% of active workforce</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Summary Assessment Card */}
          <Card className="p-5">
            <SectionHeader title="Assessment Summary" subtitle="Key workforce indicators" />
            <div className="space-y-3">
              {[
                {
                  label: 'Workforce Size',
                  value: `${metrics.total} total (${metrics.active} active)`,
                  icon: Users,
                  color: 'text-blue-600',
                },
                {
                  label: 'Gender Diversity',
                  value: `${pct(metrics.female, metrics.active)}% F · ${pct(metrics.male, metrics.active)}% M`,
                  icon: Heart,
                  color: 'text-pink-500',
                },
                {
                  label: 'Average Age',
                  value: metrics.avgAge ? `${metrics.avgAge} years` : 'N/A',
                  icon: Calendar,
                  color: 'text-amber-500',
                },
                {
                  label: 'Average Tenure',
                  value: metrics.avgTenureStr,
                  icon: Clock,
                  color: 'text-violet-500',
                },
                {
                  label: 'Retention Rate',
                  value: `${metrics.retentionRate}%`,
                  icon: TrendingUp,
                  color: 'text-emerald-600',
                },
                {
                  label: 'Departments',
                  value: `${metrics.deptRows.filter(r => r.name !== 'Unassigned').length} active`,
                  icon: Building2,
                  color: 'text-orange-500',
                },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
