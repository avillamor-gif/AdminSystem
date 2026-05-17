'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useJobPostings, useRecruitmentCandidates, useRecruitmentApplications, useRecruitmentInterviews, useRecruitmentOffers } from '@/hooks'
import { Briefcase, Users, FileText, Calendar, TrendingUp, Award } from 'lucide-react'

const STAGES = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected']
const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-blue-500', screening: 'bg-purple-500', interview: 'bg-yellow-500',
  assessment: 'bg-orange-500', offer: 'bg-teal-500', hired: 'bg-green-500', rejected: 'bg-red-400',
}

export default function RecruitmentAnalyticsPage() {
  const { data: postings = [] } = useJobPostings()
  const { data: candidates = [] } = useRecruitmentCandidates()
  const { data: applications = [] } = useRecruitmentApplications()
  const { data: interviews = [] } = useRecruitmentInterviews()
  const { data: offers = [] } = useRecruitmentOffers()

  const openPostings = postings.filter(p => p.status === 'open').length
  const hiredCount = applications.filter(a => a.stage === 'hired').length
  const acceptedOffers = offers.filter(o => o.status === 'accepted').length
  const completedInterviews = interviews.filter(i => i.status === 'completed').length

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.stage === s).length
    return acc
  }, {} as Record<string, number>)
  const maxCount = Math.max(...Object.values(stageCounts), 1)

  // Source breakdown
  const sourceCounts = candidates.reduce((acc, c) => {
    const src = c.source ?? 'other'
    acc[src] = (acc[src] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Top job postings by applications
  const postingAppCounts = postings.map(p => ({
    title: p.title,
    count: applications.filter(a => a.job_posting_id === p.id).length,
  })).sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruitment Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Insights and metrics across the recruitment pipeline</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Open Positions', value: openPostings, icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Candidates', value: candidates.length, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Active Applications', value: applications.filter(a => a.status === 'active').length, icon: FileText, color: 'text-orange-600 bg-orange-50' },
          { label: 'Interviews Completed', value: completedInterviews, icon: Calendar, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Offers Accepted', value: acceptedOffers, icon: Award, color: 'text-teal-600 bg-teal-50' },
          { label: 'Total Hires', value: hiredCount, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}><CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
              <div><div className="text-2xl font-bold text-gray-900">{value}</div><div className="text-sm text-gray-500">{label}</div></div>
            </div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Stage Funnel */}
        <Card>
          <CardHeader><CardTitle>Recruitment Funnel</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {STAGES.map(stage => (
                <div key={stage}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{stage}</span>
                    <span className="font-semibold text-gray-900">{stageCounts[stage]}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${STAGE_COLORS[stage]} rounded-full transition-all`} style={{ width: `${(stageCounts[stage] / maxCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Candidate Sources */}
        <Card>
          <CardHeader><CardTitle>Candidate Sources</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(sourceCounts).length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([src, count]) => {
                  const total = candidates.length || 1
                  return (
                    <div key={src}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-gray-700">{src.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-gray-900">{count} ({Math.round(count / total * 100)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(count / total) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Postings */}
      <Card>
        <CardHeader><CardTitle>Top Job Postings by Applications</CardTitle></CardHeader>
        <CardContent className="p-0">
          {postingAppCounts.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Job Title</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {postingAppCounts.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-gray-900">{p.title}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{p.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruitment Analytics</h1>
        <p className="text-gray-600 mt-1">
          View recruitment metrics and analytics
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Recruitment Analytics configuration coming soon...</p>
      </Card>
    </div>
  )
}
