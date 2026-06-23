'use client'

import { useState, useEffect } from 'react'
import { Check, MapPin, AlertCircle } from 'lucide-react'
import { Card, Button, CountrySelect } from '@/components/ui'
import { useMembers, useUpdateMember } from '@/hooks/useGovernance'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/services/governance.service'

interface BackupRow {
  member_id: string
  first_name: string
  last_name: string
  original_country: string
}

export default function FixCountriesPage() {
  const { data: allMembers = [], isLoading } = useMembers()
  const updateMember = useUpdateMember()

  // Members with no country set
  const missing = allMembers.filter(m => !m.country)

  // Load backup hints from member_country_backup
  const [backupMap, setBackupMap] = useState<Record<string, string>>({})
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('member_country_backup' as any)
        .select('member_id, original_country')
      if (data) {
        const map: Record<string, string> = {}
        for (const r of data as BackupRow[]) map[r.member_id] = r.original_country
        setBackupMap(map)
      }
    }
    load()
  }, [])

  // Per-row country state
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  function setCountry(id: string, country: string) {
    setSelections(p => ({ ...p, [id]: country }))
    setSaved(p => ({ ...p, [id]: false }))
  }

  async function save(member: Member) {
    const country = selections[member.id]
    if (!country) return
    await updateMember.mutateAsync({ id: member.id, data: { country } })
    setSaved(p => ({ ...p, [member.id]: true }))
  }

  async function saveAll() {
    const toSave = missing.filter(m => selections[m.id] && !saved[m.id])
    for (const m of toSave) await save(m)
  }

  const pendingCount  = missing.filter(m => selections[m.id] && !saved[m.id]).length
  const allDone       = missing.length > 0 && missing.every(m => saved[m.id] || !!m.country)

  if (isLoading) return <div className="p-16 text-center text-gray-400">Loading…</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-purple-500" /> Fix Member Countries
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Assign the correct country to members whose country field is blank.
          The <span className="text-amber-600 font-medium">Original value</span> column shows what was there before it was cleared.
        </p>
      </div>

      {missing.length === 0 || allDone ? (
        <Card className="p-10 text-center">
          <Check className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">All members have a country assigned!</p>
          <p className="text-gray-400 text-sm mt-1">Nothing left to fix.</p>
        </Card>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span><strong>{missing.length}</strong> member{missing.length !== 1 ? 's' : ''} without a country · <strong>{pendingCount}</strong> ready to save</span>
            </div>
            <Button onClick={saveAll} disabled={pendingCount === 0 || updateMember.isPending}>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Save All ({pendingCount})
            </Button>
          </div>

          {/* Member rows */}
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Original Value</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase w-64">Set Country</th>
                  <th className="px-5 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {missing.map(m => (
                  <tr key={m.id} className={saved[m.id] ? 'bg-green-50' : 'hover:bg-gray-50'}>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{m.first_name} {m.last_name}</p>
                      <p className="text-xs text-gray-400">{m.email || m.member_number || '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      {backupMap[m.id] ? (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                          {backupMap[m.id]}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {saved[m.id] ? (
                        <div className="flex items-center gap-1.5 text-green-600 text-sm">
                          <Check className="w-4 h-4" /> {selections[m.id]}
                        </div>
                      ) : (
                        <CountrySelect
                          value={selections[m.id] || ''}
                          onChange={v => setCountry(m.id, v)}
                        />
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!saved[m.id] && (
                        <Button
                          variant="secondary"
                          onClick={() => save(m)}
                          disabled={!selections[m.id] || updateMember.isPending}
                        >
                          Save
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}
