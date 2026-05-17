'use client'

import { useState } from 'react'
import { Search, Star, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui'
import { useRecruitmentCandidates, useUpdateRecruitmentCandidate } from '@/hooks'

export default function TalentPoolPage() {
  const [search, setSearch] = useState('')
  const { data: candidates = [], isLoading } = useRecruitmentCandidates({ is_talent_pool: true })
  const updateMutation = useUpdateRecruitmentCandidate()

  const filtered = candidates.filter(c => !search || `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(search.toLowerCase()))

  async function removeFromPool(id: string) {
    await updateMutation.mutateAsync({ id, data: { is_talent_pool: false } })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talent Pool</h1>
          <p className="text-sm text-gray-500 mt-1">Promising candidates saved for future positions</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>{candidates.length} candidates in pool</span>
        </div>
      </div>

      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" placeholder="Search talent pool..." value={search} onChange={e => setSearch(e.target.value)} /></div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle>Talent Pool ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-16 text-center text-gray-400">Loading...</div> :
          filtered.length === 0 ? (
            <div className="py-16 text-center"><UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No candidates in talent pool</p><p className="text-xs text-gray-400 mt-1">Mark candidates as "Talent Pool" in Candidate Management</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Current Role</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Source</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-gray-600">Experience</th>
                  <th className="px-5 py-3.5 text-right font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900 flex items-center gap-2"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />{c.first_name} {c.last_name}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.email}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.current_position ? `${c.current_position}${c.current_employer ? ` @ ${c.current_employer}` : ''}` : '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 capitalize">{c.source?.replace(/_/g, ' ') ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600">{c.years_experience != null ? `${c.years_experience} yrs` : '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => removeFromPool(c.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">Remove from pool</button>
                    </td>
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
        <h1 className="text-2xl font-bold text-gray-900">Talent Pool</h1>
        <p className="text-gray-600 mt-1">
          Manage talent pool and passive candidates
        </p>
      </div>

      <Card className="p-6">
        <p className="text-gray-600">Talent Pool configuration coming soon...</p>
      </Card>
    </div>
  )
}
