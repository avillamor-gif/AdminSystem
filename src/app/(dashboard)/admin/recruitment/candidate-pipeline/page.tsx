'use client'

import { useRecruitmentApplications, useUpdateRecruitmentApplication, useJobPostings, useRecruitmentCandidates } from '@/hooks'
import { useState } from 'react'
import { Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Search } from 'lucide-react'

const STAGES = [
  { key: 'applied', label: 'Applied', color: 'border-blue-400 bg-blue-50' },
  { key: 'screening', label: 'Screening', color: 'border-purple-400 bg-purple-50' },
  { key: 'interview', label: 'Interview', color: 'border-yellow-400 bg-yellow-50' },
  { key: 'assessment', label: 'Assessment', color: 'border-orange-400 bg-orange-50' },
  { key: 'offer', label: 'Offer', color: 'border-teal-400 bg-teal-50' },
  { key: 'hired', label: 'Hired', color: 'border-green-400 bg-green-50' },
]

export default function CandidatePipelinePage() {
  const [jobFilter, setJobFilter] = useState('')
  const [search, setSearch] = useState('')
  const { data: applications = [], isLoading } = useRecruitmentApplications(jobFilter ? { job_posting_id: jobFilter } : undefined)
  const { data: postings = [] } = useJobPostings()
  const { data: candidates = [] } = useRecruitmentCandidates()
  const updateMutation = useUpdateRecruitmentApplication()

  const candidateMap = Object.fromEntries(candidates.map(c => [c.id, `${c.first_name} ${c.last_name}`]))

  const activeApps = applications.filter(a => !['rejected', 'withdrawn'].includes(a.stage))
    .filter(a => !search || (candidateMap[a.candidate_id ?? ''] ?? '').toLowerCase().includes(search.toLowerCase()))

  async function moveStage(id: string, stage: string) {
    await updateMutation.mutateAsync({ id, data: { stage: stage as any } })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidate Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">Visual pipeline view of all active candidates</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select value={jobFilter} onChange={e => setJobFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Positions</option>
          {postings.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageApps = activeApps.filter(a => a.stage === stage.key)
            return (
              <div key={stage.key} className={`flex-shrink-0 w-64 rounded-xl border-t-4 ${stage.color} bg-white shadow-sm`}>
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{stage.label}</span>
                  <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{stageApps.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-[200px]">
                  {stageApps.map(app => (
                    <div key={app.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-xs hover:shadow-sm transition-shadow">
                      <p className="text-sm font-medium text-gray-900">{candidateMap[app.candidate_id ?? ''] ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{app.applied_date ?? '—'}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {STAGES.filter(s => s.key !== stage.key).slice(0, 2).map(s => (
                          <button key={s.key} onClick={() => moveStage(app.id, s.key)}
                            className="text-xs text-gray-500 hover:text-green-700 underline transition-colors">
                            → {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {stageApps.length === 0 && <p className="text-xs text-gray-400 text-center mt-4">No candidates</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidate Pipeline</h1>
        <p className="text-gray-600 mt-1">
          Manage recruitment pipeline stages
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Candidate Pipeline configuration coming soon...</p>
      </Card>
    </div>
  )
}
