'use client'

import { useMemo } from 'react'
import { Users, TrendingUp, UserCheck, Calendar, MapPin, Award, BarChart2 } from 'lucide-react'
import { Card } from '@/components/ui'
import { useMembers } from '@/hooks/useGovernance'
import { formatDate } from '@/lib/utils'

// ── Region mapping ─────────────────────────────────────────────────────────────

const REGION_MAP: Record<string, string> = {
  // Southeast Asia
  Philippines: 'Southeast Asia', Indonesia: 'Southeast Asia', Malaysia: 'Southeast Asia',
  Thailand: 'Southeast Asia', Vietnam: 'Southeast Asia', Singapore: 'Southeast Asia',
  Myanmar: 'Southeast Asia', Cambodia: 'Southeast Asia', Laos: 'Southeast Asia',
  'Timor-Leste': 'Southeast Asia', Brunei: 'Southeast Asia',
  // East Asia
  China: 'East Asia', Japan: 'East Asia', 'South Korea': 'East Asia',
  Taiwan: 'East Asia', 'North Korea': 'East Asia', Mongolia: 'East Asia',
  // South Asia
  India: 'South Asia', Pakistan: 'South Asia', Bangladesh: 'South Asia',
  'Sri Lanka': 'South Asia', Nepal: 'South Asia', Bhutan: 'South Asia',
  Maldives: 'South Asia', Afghanistan: 'South Asia',
  // Central Asia
  Kazakhstan: 'Central Asia', Kyrgyzstan: 'Central Asia', Tajikistan: 'Central Asia',
  Turkmenistan: 'Central Asia', Uzbekistan: 'Central Asia',
  // Middle East
  'Saudi Arabia': 'Middle East', 'United Arab Emirates': 'Middle East',
  Iran: 'Middle East', Iraq: 'Middle East', Turkey: 'Middle East', Syria: 'Middle East',
  Jordan: 'Middle East', Lebanon: 'Middle East', Israel: 'Middle East', Kuwait: 'Middle East',
  Qatar: 'Middle East', Oman: 'Middle East', Bahrain: 'Middle East', Yemen: 'Middle East',
  Palestine: 'Middle East',
  // Europe
  Albania: 'Europe', Andorra: 'Europe', Armenia: 'Europe', Austria: 'Europe',
  Azerbaijan: 'Europe', Belarus: 'Europe', Belgium: 'Europe', 'Bosnia and Herzegovina': 'Europe',
  Bulgaria: 'Europe', Croatia: 'Europe', Cyprus: 'Europe', 'Czech Republic': 'Europe',
  Denmark: 'Europe', Estonia: 'Europe', Finland: 'Europe', France: 'Europe',
  Georgia: 'Europe', Germany: 'Europe', Greece: 'Europe', Hungary: 'Europe',
  Iceland: 'Europe', Ireland: 'Europe', Italy: 'Europe', Kosovo: 'Europe',
  Latvia: 'Europe', Liechtenstein: 'Europe', Lithuania: 'Europe', Luxembourg: 'Europe',
  Malta: 'Europe', Moldova: 'Europe', Monaco: 'Europe', Montenegro: 'Europe',
  Netherlands: 'Europe', 'North Macedonia': 'Europe', Norway: 'Europe', Poland: 'Europe',
  Portugal: 'Europe', Romania: 'Europe', Russia: 'Europe', 'San Marino': 'Europe',
  Serbia: 'Europe', Slovakia: 'Europe', Slovenia: 'Europe', Spain: 'Europe',
  Sweden: 'Europe', Switzerland: 'Europe', Ukraine: 'Europe', 'United Kingdom': 'Europe',
  'Vatican City': 'Europe',
  // North America
  'United States': 'North America', Canada: 'North America', Mexico: 'North America',
  // Caribbean & Central America
  Cuba: 'Caribbean & C. America', Haiti: 'Caribbean & C. America',
  'Dominican Republic': 'Caribbean & C. America', Jamaica: 'Caribbean & C. America',
  'Trinidad and Tobago': 'Caribbean & C. America', Barbados: 'Caribbean & C. America',
  'Saint Lucia': 'Caribbean & C. America', 'Saint Kitts and Nevis': 'Caribbean & C. America',
  'Saint Vincent': 'Caribbean & C. America', Grenada: 'Caribbean & C. America',
  'Antigua and Barbuda': 'Caribbean & C. America', Dominica: 'Caribbean & C. America',
  Guatemala: 'Caribbean & C. America', Honduras: 'Caribbean & C. America',
  'El Salvador': 'Caribbean & C. America', Nicaragua: 'Caribbean & C. America',
  'Costa Rica': 'Caribbean & C. America', Panama: 'Caribbean & C. America',
  Belize: 'Caribbean & C. America',
  // South America
  Brazil: 'South America', Argentina: 'South America', Colombia: 'South America',
  Peru: 'South America', Chile: 'South America', Venezuela: 'South America',
  Ecuador: 'South America', Bolivia: 'South America', Paraguay: 'South America',
  Uruguay: 'South America', Guyana: 'South America', Suriname: 'South America',
  // Africa
  Nigeria: 'Africa', Kenya: 'Africa', Tanzania: 'Africa', Ethiopia: 'Africa',
  Ghana: 'Africa', Uganda: 'Africa', Mozambique: 'Africa', Madagascar: 'Africa',
  Cameroon: 'Africa', 'Ivory Coast': 'Africa', Angola: 'Africa', Niger: 'Africa',
  Senegal: 'Africa', Mali: 'Africa', Burkina: 'Africa', Zambia: 'Africa',
  Zimbabwe: 'Africa', Rwanda: 'Africa', Burundi: 'Africa', Benin: 'Africa',
  Somalia: 'Africa', Chad: 'Africa', Sudan: 'Africa', 'South Sudan': 'Africa',
  Algeria: 'Africa', Egypt: 'Africa', Morocco: 'Africa', Tunisia: 'Africa',
  Libya: 'Africa', 'Burkina Faso': 'Africa', Malawi: 'Africa', Namibia: 'Africa',
  Botswana: 'Africa', Lesotho: 'Africa', Eswatini: 'Africa', Gabon: 'Africa',
  'Congo (Brazzaville)': 'Africa', 'Congo (Kinshasa)': 'Africa', Liberia: 'Africa',
  'Sierra Leone': 'Africa', 'Guinea-Bissau': 'Africa', Guinea: 'Africa',
  Gambia: 'Africa', Mauritania: 'Africa', 'Cape Verde': 'Africa', 'Cabo Verde': 'Africa',
  'Equatorial Guinea': 'Africa', 'Sao Tome and Principe': 'Africa',
  Eritrea: 'Africa', Djibouti: 'Africa', Comoros: 'Africa', Seychelles: 'Africa',
  Mauritius: 'Africa', 'Central African Republic': 'Africa',
  // Oceania
  Australia: 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania',
  Fiji: 'Oceania', 'Solomon Islands': 'Oceania', Vanuatu: 'Oceania',
  Samoa: 'Oceania', Kiribati: 'Oceania', Tonga: 'Oceania', Tuvalu: 'Oceania',
  Nauru: 'Oceania', 'Marshall Islands': 'Oceania', Micronesia: 'Oceania', Palau: 'Oceania',
}

const REGION_COLORS: Record<string, string> = {
  'Southeast Asia':         '#f59e0b',
  'East Asia':              '#3b82f6',
  'South Asia':             '#8b5cf6',
  'Central Asia':           '#06b6d4',
  'Middle East':            '#ef4444',
  'Europe':                 '#22c55e',
  'North America':          '#f97316',
  'Caribbean & C. America': '#ec4899',
  'South America':          '#14b8a6',
  'Africa':                 '#a78bfa',
  'Oceania':                '#84cc16',
  'Other':                  '#9ca3af',
}

const TYPE_COLORS: Record<string, string> = {
  regular: '#3b82f6', associate: '#a855f7', honorary: '#f59e0b', institutional: '#14b8a6',
}
const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e', inactive: '#9ca3af', suspended: '#f97316', lapsed: '#eab308', deceased: '#ef4444',
}
const GENDER_COLORS: Record<string, string> = {
  Male: '#3b82f6', Female: '#ec4899', Other: '#8b5cf6', 'Prefer not to say': '#9ca3af',
}

// ── Chart primitives ───────────────────────────────────────────────────────────

function HorizBar({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700 truncate max-w-[60%]">{label}{sub && <span className="text-gray-400 text-xs ml-1">{sub}</span>}</span>
        <span className="font-semibold text-gray-900 ml-2">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function BarChart({ data, color = '#d97706' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">{d.value}</span>
          <div className="w-full rounded-t-sm" style={{ height: `${(d.value / max) * 64}px`, backgroundColor: color, minHeight: d.value > 0 ? 4 : 0 }} />
          <span className="text-[10px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function DonutChart({ segments, total, label }: {
  segments: { label: string; value: number; color: string; pct: number; offset: number }[]
  total: number
  label?: string
}) {
  const r = 40, circ = 2 * Math.PI * r
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0">
        {segments.map(s => (
          <circle key={s.label} cx="50" cy="50" r={r} fill="none"
            stroke={s.color} strokeWidth="18"
            strokeDasharray={`${(s.pct / 100) * circ} ${circ}`}
            strokeDashoffset={-((s.offset / 100) * circ)}
            transform="rotate(-90 50 50)"
          />
        ))}
        <text x="50" y="47" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1f2937">{total}</text>
        {label && <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#9ca3af">{label}</text>}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {segments.filter(s => s.value > 0).map(s => (
          <div key={s.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs text-gray-600 truncate">{s.label}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs font-semibold text-gray-800">{s.value}</span>
              <span className="text-[10px] text-gray-400">{Math.round(s.pct)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GroupedBar({ label, male, female, other, maxVal }: {
  label: string; male: number; female: number; other: number; maxVal: number
}) {
  const total = male + female + other
  if (total === 0) return null
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700 truncate max-w-[50%] font-medium">{label}</span>
        <span className="text-gray-400">{total} total</span>
      </div>
      <div className="flex gap-0.5 h-4 rounded overflow-hidden">
        {male > 0 && <div className="flex items-center justify-center text-[9px] text-white font-medium" style={{ width: `${(male / maxVal) * 100}%`, minWidth: male > 0 ? 12 : 0, backgroundColor: '#3b82f6' }}>{male > 0 ? male : ''}</div>}
        {female > 0 && <div className="flex items-center justify-center text-[9px] text-white font-medium" style={{ width: `${(female / maxVal) * 100}%`, minWidth: female > 0 ? 12 : 0, backgroundColor: '#ec4899' }}>{female > 0 ? female : ''}</div>}
        {other > 0 && <div className="flex items-center justify-center text-[9px] text-white font-medium" style={{ width: `${(other / maxVal) * 100}%`, minWidth: other > 0 ? 12 : 0, backgroundColor: '#8b5cf6' }}>{other > 0 ? other : ''}</div>}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MembershipAnalyticsPage() {
  const { data: members = [], isLoading } = useMembers()

  const stats = useMemo(() => {
    const total    = members.length
    const active   = members.filter(m => m.status === 'active').length
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0
    const thisYear  = new Date().getFullYear().toString()
    const lastYear  = (new Date().getFullYear() - 1).toString()

    // By type donut
    const typeData = (['regular','associate','honorary','institutional'] as const).map(t => ({
      label: t.charAt(0).toUpperCase() + t.slice(1),
      value: members.filter(m => m.membership_type === t).length,
      color: TYPE_COLORS[t],
    }))
    let off = 0
    const typeDonut = typeData.map(t => {
      const pct = total > 0 ? (t.value / total) * 100 : 0
      const seg = { ...t, pct, offset: off }
      off += pct; return seg
    })

    // By status
    const byStatus = (['active','inactive','suspended','lapsed','deceased'] as const).map(s => ({
      label: s.charAt(0).toUpperCase() + s.slice(1),
      value: members.filter(m => m.status === s).length,
      color: STATUS_COLORS[s],
    }))

    // By gender donut
    const genderMap: Record<string, number> = {}
    for (const m of members) { const g = m.sex || 'Unknown'; genderMap[g] = (genderMap[g] || 0) + 1 }
    const genderData = ['Male','Female','Other','Prefer not to say','Unknown'].map(g => ({
      label: g, value: genderMap[g] || 0, color: GENDER_COLORS[g] ?? '#9ca3af',
    })).filter(g => g.value > 0)
    let goff = 0
    const genderDonut = genderData.map(g => {
      const pct = total > 0 ? (g.value / total) * 100 : 0
      const seg = { ...g, pct, offset: goff }; goff += pct; return seg
    })

    // By region donut
    const regionMap: Record<string, number> = {}
    for (const m of members) {
      const r = (m.country && REGION_MAP[m.country]) ? REGION_MAP[m.country] : 'Other'
      regionMap[r] = (regionMap[r] || 0) + 1
    }
    const regionData = Object.entries(regionMap)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, color: REGION_COLORS[label] ?? '#9ca3af' }))
    let roff = 0
    const regionDonut = regionData.map(r => {
      const pct = total > 0 ? (r.value / total) * 100 : 0
      const seg = { ...r, pct, offset: roff }; roff += pct; return seg
    })

    // By country (top 12)
    const countryMap: Record<string, number> = {}
    for (const m of members) { const c = m.country || 'Unknown'; countryMap[c] = (countryMap[c] || 0) + 1 }

    // Distinct palette for up to 12 countries
    const COUNTRY_PALETTE = [
      '#f59e0b','#3b82f6','#22c55e','#ec4899','#8b5cf6','#14b8a6',
      '#f97316','#06b6d4','#a855f7','#84cc16','#ef4444','#64748b',
    ]
    const byCountry = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([label, value], i) => ({ label, value, color: COUNTRY_PALETTE[i % COUNTRY_PALETTE.length] }))

    // Country donut segments
    let coff = 0
    const countryDonut = byCountry.map(c => {
      const pct = total > 0 ? (c.value / total) * 100 : 0
      const seg = { ...c, pct, offset: coff }; coff += pct; return seg
    })

    // Country × Gender (top 10 countries)
    const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c]) => c)
    const countryGender = topCountries.map(country => {
      const mems = members.filter(m => (m.country || 'Unknown') === country)
      return {
        country,
        male:   mems.filter(m => m.sex === 'Male').length,
        female: mems.filter(m => m.sex === 'Female').length,
        other:  mems.filter(m => m.sex && m.sex !== 'Male' && m.sex !== 'Female').length,
        total:  mems.length,
      }
    })
    const maxCountryTotal = Math.max(...countryGender.map(c => c.total), 1)

    // Admissions by year
    const yearMap: Record<string, number> = {}
    for (const m of members) {
      if (!m.date_admitted) continue
      const y = m.date_admitted.slice(0, 4); yearMap[y] = (yearMap[y] || 0) + 1
    }
    const byYear = Object.keys(yearMap).sort().slice(-8).map(y => ({ label: y, value: yearMap[y] }))
    const admittedThisYear = yearMap[thisYear] || 0
    const admittedLastYear = yearMap[lastYear] || 0

    // Tenure
    const now = new Date()
    const tenureMap: Record<string, number> = { '< 1 yr': 0, '1–3 yrs': 0, '3–5 yrs': 0, '5–10 yrs': 0, '10+ yrs': 0 }
    for (const m of members) {
      if (!m.date_admitted) continue
      const yrs = (now.getTime() - new Date(m.date_admitted).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      if (yrs < 1) tenureMap['< 1 yr']++
      else if (yrs < 3) tenureMap['1–3 yrs']++
      else if (yrs < 5) tenureMap['3–5 yrs']++
      else if (yrs < 10) tenureMap['5–10 yrs']++
      else tenureMap['10+ yrs']++
    }
    const byTenure = Object.entries(tenureMap).map(([label, value]) => ({ label, value }))

    // Newest
    const newest = [...members].filter(m => m.date_admitted)
      .sort((a, b) => (b.date_admitted ?? '').localeCompare(a.date_admitted ?? '')).slice(0, 8)

    return {
      total, active, activeRate, admittedThisYear, admittedLastYear,
      typeDonut, byStatus, genderDonut, regionDonut, regionData, byCountry, countryDonut,
      countryGender, maxCountryTotal, byYear, byTenure, newest,
    }
  }, [members])

  if (isLoading) return <div className="p-16 text-center text-gray-400">Loading…</div>

  const yoyChange = stats.admittedThisYear - stats.admittedLastYear

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Membership Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Demographics, geography, and growth of your membership base</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members',     value: stats.total,              icon: Users,     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100'   },
          { label: 'Active Members',    value: stats.active,             icon: UserCheck, color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-100'  },
          { label: 'Active Rate',       value: `${stats.activeRate}%`,   icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
          { label: 'New This Year',     value: stats.admittedThisYear,   icon: Calendar,  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-100'  },
        ].map(s => (
          <Card key={s.label} className={`p-5 border ${s.border}`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            {s.label === 'New This Year' && (
              <p className={`text-xs mt-1 font-medium ${yoyChange >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {yoyChange >= 0 ? '+' : ''}{yoyChange} vs last year
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Row 1: Type + Status + Gender */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" /> By Membership Type
          </p>
          {stats.total > 0
            ? <DonutChart segments={stats.typeDonut} total={stats.total} label="members" />
            : <p className="text-sm text-gray-400 text-center py-8">No data yet</p>}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" /> By Status
          </p>
          <div className="space-y-2.5">
            {stats.byStatus.filter(s => s.value > 0).map(s => (
              <HorizBar key={s.label} label={s.label} value={s.value} max={stats.total} color={s.color}
                sub={`${stats.total > 0 ? Math.round((s.value / stats.total) * 100) : 0}%`} />
            ))}
            {stats.byStatus.every(s => s.value === 0) && <p className="text-sm text-gray-400 text-center py-6">No data</p>}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-500" /> Gender Distribution
          </p>
          {stats.genderDonut.length > 0
            ? <DonutChart segments={stats.genderDonut} total={stats.total} label="members" />
            : <p className="text-sm text-gray-400 text-center py-8">No gender data recorded</p>}
        </Card>
      </div>

      {/* Regional Distribution — full width */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-500" /> Regional Distribution
        </p>
        {stats.regionDonut.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <DonutChart segments={stats.regionDonut} total={stats.total} label="members" />
            <div className="grid grid-cols-2 gap-2">
              {stats.regionData.filter(r => r.value > 0).map(r => (
                <HorizBar key={r.label} label={r.label} value={r.value} max={stats.total} color={r.color} />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No country data recorded</p>
        )}
      </Card>

      {/* Members by Country — full width with pie chart */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-500" /> Members by Country (Top 12)
        </p>
        {stats.byCountry.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Pie / Donut */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-3">Distribution</p>
              <DonutChart segments={stats.countryDonut} total={stats.total} label="members" />
            </div>
            {/* Horizontal bars */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-3">Count</p>
              <div className="space-y-2">
                {stats.byCountry.map(c => (
                  <HorizBar key={c.label} label={c.label} value={c.value} max={stats.byCountry[0].value} color={c.color}
                    sub={`${stats.total > 0 ? Math.round((c.value / stats.total) * 100) : 0}%`} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No country data recorded</p>
        )}
      </Card>

      {/* Country by Gender + Admissions Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Country by Gender (Top 10)
          </p>
          <div className="flex gap-4 mb-4">
            {[['Male','#3b82f6'],['Female','#ec4899'],['Other','#8b5cf6']].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />
                <span className="text-xs text-gray-500">{l}</span>
              </div>
            ))}
          </div>
          {stats.countryGender.length > 0 ? (
            <div className="space-y-2.5">
              {stats.countryGender.map(c => (
                <GroupedBar key={c.country} label={c.country} male={c.male} female={c.female} other={c.other} maxVal={stats.maxCountryTotal} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No data recorded</p>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" /> Admissions by Year
          </p>
          {stats.byYear.length > 0
            ? <BarChart data={stats.byYear} color="#22c55e" />
            : <p className="text-sm text-gray-400 text-center py-8">No admission dates recorded</p>}
        </Card>
      </div>

      {/* Row 4: Tenure */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-500" /> Membership Tenure
        </p>
        {stats.byTenure.some(t => t.value > 0)
          ? <BarChart data={stats.byTenure} color="#14b8a6" />
          : <p className="text-sm text-gray-400 text-center py-8">No tenure data</p>}
      </Card>

      {/* Recently Admitted */}
      <Card className="p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-500" /> Recently Admitted
        </p>
        {stats.newest.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No members with admission dates</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Name','Member #','Type','Country','Gender','Status','Date Admitted'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-xs font-medium text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.newest.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800 whitespace-nowrap">{m.first_name} {m.last_name}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{m.member_number || '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ backgroundColor: TYPE_COLORS[m.membership_type] + '20', color: TYPE_COLORS[m.membership_type] }}>
                        {m.membership_type}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600 text-xs">{m.country || '—'}</td>
                    <td className="py-2.5 pr-4 text-gray-600 text-xs">{m.sex || '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ backgroundColor: STATUS_COLORS[m.status] + '20', color: STATUS_COLORS[m.status] }}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-600 whitespace-nowrap">{m.date_admitted ? formatDate(m.date_admitted) : '—'}</td>
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
