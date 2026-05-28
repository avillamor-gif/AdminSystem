'use client'

import { usePrograms, useProjects, useIndicators, useDataEntries } from '@/hooks'

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  )
}

export default function MEDashboard() {
  const { data: programs = [] } = usePrograms()
  const { data: projects = [] } = useProjects()
  const { data: indicators = [] } = useIndicators()
  const { data: entries = [] } = useDataEntries()

  const activePrograms = programs.filter((p) => p.status === 'active').length
  const activeProjects = projects.filter((p) => p.status === 'active').length
  const activeIndicators = indicators.filter((i) => i.is_active).length
  const verifiedEntries = entries.filter((e) => e.status === 'verified').length

  // Achievement rates per indicator (latest entry vs target)
  const indicatorStats = indicators.slice(0, 6).map((ind) => {
    const indEntries = entries.filter((e) => e.indicator_id === ind.id)
    const latest = indEntries.sort((a, b) => b.period_start.localeCompare(a.period_start))[0]
    const pct = latest ? Math.min(100, Math.round((latest.actual_value / ind.target_value) * 100)) : 0
    return { ind, pct, latest }
  })

  const recentEntries = [...entries]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">M&E Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Monitoring & Evaluation overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Programs" value={activePrograms} sub={`${programs.length} total`} />
        <StatCard label="Active Projects" value={activeProjects} sub={`${projects.length} total`} />
        <StatCard label="Active Indicators" value={activeIndicators} sub={`${indicators.length} total`} />
        <StatCard label="Verified Entries" value={verifiedEntries} sub={`${entries.length} total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program status breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Programs by Status</h2>
          {['planning', 'active', 'completed', 'suspended'].map((s) => {
            const cnt = programs.filter((p) => p.status === s).length
            const pct = programs.length ? Math.round((cnt / programs.length) * 100) : 0
            return (
              <div key={s} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize text-gray-700">{s}</span>
                  <span className="text-gray-500">{cnt}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Indicator achievement */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Indicator Achievement (latest entry)</h2>
          {indicatorStats.length === 0 && (
            <p className="text-sm text-gray-400">No indicators with data yet.</p>
          )}
          {indicatorStats.map(({ ind, pct }) => (
            <div key={ind.id} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 truncate max-w-[60%]">{ind.name}</span>
                <span className="text-gray-500">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Programs */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Programs</h2>
        {programs.length === 0 ? (
          <p className="text-sm text-gray-400">No programs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 text-left font-medium">Name</th>
                  <th className="pb-2 text-left font-medium">Type</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                  <th className="pb-2 text-left font-medium">Lead</th>
                  <th className="pb-2 text-right font-medium">Beneficiaries</th>
                </tr>
              </thead>
              <tbody>
                {programs.slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">{p.name}</td>
                    <td className="py-2 capitalize text-gray-600">{p.program_type.replace('_', ' ')}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">
                      {p.lead_staff ? `${p.lead_staff.first_name} ${p.lead_staff.last_name}` : '—'}
                    </td>
                    <td className="py-2 text-right text-gray-600">
                      {p.beneficiary_count ?? 0}{p.beneficiary_target ? ` / ${p.beneficiary_target}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent data entries */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Data Entries</h2>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-gray-400">No data entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 text-left font-medium">Indicator</th>
                  <th className="pb-2 text-left font-medium">Period</th>
                  <th className="pb-2 text-right font-medium">Value</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                  <th className="pb-2 text-left font-medium">Entered By</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-2 text-gray-800">{e.indicator?.name ?? '—'}</td>
                    <td className="py-2 text-gray-600">{e.period_label}</td>
                    <td className="py-2 text-right font-medium text-gray-800">
                      {e.actual_value} {e.indicator?.unit_of_measure}
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.status === 'verified' ? 'bg-green-100 text-green-800' :
                        e.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="py-2 text-gray-600">
                      {e.entered_by_emp
                        ? `${e.entered_by_emp.first_name} ${e.entered_by_emp.last_name}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
