'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  Building2, ZoomIn, ZoomOut, Maximize2,
  ChevronDown, ChevronUp, X, Search, Download
} from 'lucide-react'
import { Card } from '@/components/ui'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import type { OrgChartNode } from './OrgChartPanel'

const OrgChartPanel = dynamic(() => import('./OrgChartPanel'), { ssr: false })

function computeLevel(id: string, depts: any[], memo = new Map<string, number>()): number {
  if (memo.has(id)) return memo.get(id)!
  const dept = depts.find((d: any) => d.id === id)
  if (!dept || !dept.parent_id) { memo.set(id, 0); return 0 }
  const level = 1 + computeLevel(dept.parent_id, depts, memo)
  memo.set(id, level)
  return level
}

export default function DepartmentHierarchyPage() {
  const { data: departments = [], isLoading: deptLoading } = useDepartments()
  const { data: employees = [], isLoading: empLoading } = useEmployees({})
  const isLoading = deptLoading || empLoading

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const [memberSearch, setMemberSearch] = useState('')
  const chartRef = useRef<any>(null)

  const nodes = useMemo<OrgChartNode[]>(() => {
    if (!departments.length) return []
    const levelMemo = new Map<string, number>()
    return departments.map((dept: any) => {
      const deptEmps = (employees as any[]).filter(
        (e: any) => e.department_id === dept.id && e.status === 'active'
      )
      const head = dept.head_id
        ? (employees as any[]).find((e: any) => e.id === dept.head_id)
        : null
      return {
        id: dept.id,
        parentNodeId: dept.parent_id ?? null,
        name: dept.name,
        description: dept.description ?? null,
        headName: head ? `${head.first_name} ${head.last_name}` : null,
        headAvatar: head?.avatar_url ?? null,
        headTitle: head?.job_title?.title ?? null,
        employeeCount: deptEmps.length,
        level: computeLevel(dept.id, departments as any[], levelMemo),
      }
    })
  }, [departments, employees])

  const selectedDept = useMemo(
    () => (departments as any[]).find((d: any) => d.id === selectedDeptId) ?? null,
    [departments, selectedDeptId]
  )

  const deptMembers = useMemo(() => {
    if (!selectedDeptId) return []
    return (employees as any[]).filter(
      (e: any) => e.department_id === selectedDeptId && e.status === 'active'
    )
  }, [employees, selectedDeptId])

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return deptMembers
    const q = memberSearch.toLowerCase()
    return deptMembers.filter((e: any) =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
      (e.job_title?.title ?? '').toLowerCase().includes(q)
    )
  }, [deptMembers, memberSearch])

  const handleNodeClick = useCallback((id: string) => {
    setSelectedDeptId(id)
    setMemberSearch('')
  }, [])

  const rootCount = (departments as any[]).filter((d: any) => !d.parent_id).length
  const activeEmpCount = (employees as any[]).filter((e: any) => e.status === 'active').length
  const maxDepth = departments.length
    ? Math.max(0, ...(departments as any[]).map((d: any) => computeLevel(d.id, departments as any[])))
    : 0

  function EmpAvatar({ emp }: { emp: any }) {
    const initials = `${emp.first_name?.[0] ?? ''}${emp.last_name?.[0] ?? ''}`.toUpperCase()
    return emp.avatar_url ? (
      <img
        src={emp.avatar_url}
        alt={`${emp.first_name} ${emp.last_name}`}
        className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm flex-shrink-0">
        {initials}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-5 flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Department Hierarchy</h1>
        <p className="text-gray-500 mt-0.5 text-sm">Interactive org chart — click any node to view members</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: 'Total Departments', value: departments.length, color: 'text-gray-900' },
          { label: 'Root Departments',  value: rootCount,          color: 'text-blue-600' },
          { label: 'Max Depth',         value: maxDepth + 1,       color: 'text-purple-600' },
          { label: 'Active Employees',  value: activeEmpCount,     color: 'text-green-600' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Chart card */}
        <Card className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0 flex-wrap">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1">View</span>
            <button onClick={() => chartRef.current?.zoomIn()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => chartRef.current?.zoomOut()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => chartRef.current?.fit()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="Fit to screen">
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button onClick={() => chartRef.current?.expandAll()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              <ChevronDown className="w-3.5 h-3.5" /> Expand All
            </button>
            <button onClick={() => chartRef.current?.collapseAll()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              <ChevronUp className="w-3.5 h-3.5" /> Collapse All
            </button>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <button onClick={() => chartRef.current?.exportImg({ full: true })} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Chart canvas */}
          <div className="flex-1 overflow-hidden">
            {nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Building2 className="w-12 h-12" />
                <p className="text-sm">No departments to display</p>
              </div>
            ) : (
              <OrgChartPanel nodes={nodes} onNodeClick={handleNodeClick} chartRef={chartRef} />
            )}
          </div>
        </Card>

        {/* Detail panel */}
        {selectedDept && (
          <div className="w-80 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
            <Card className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{selectedDept.name}</h3>
                    <p className="text-xs text-gray-500">{deptMembers.length} active member{deptMembers.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDeptId(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Description */}
              {selectedDept.description && (
                <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
                  <p className="text-xs text-gray-500">{selectedDept.description}</p>
                </div>
              )}

              {/* Dept head */}
              {selectedDept.head_id && (() => {
                const head = (employees as any[]).find((e: any) => e.id === selectedDept.head_id)
                if (!head) return null
                return (
                  <div className="px-4 py-3 border-b border-gray-100 bg-orange-50 flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-orange-600 font-semibold mb-2">Department Head</p>
                    <div className="flex items-center gap-3">
                      <EmpAvatar emp={head} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{head.first_name} {head.last_name}</p>
                        {head.job_title?.title && <p className="text-xs text-gray-500 truncate">{head.job_title.title}</p>}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Search */}
              <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search members…"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
                  />
                </div>
              </div>

              {/* Members list */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
                {filteredMembers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    {deptMembers.length === 0 ? 'No active members' : 'No results'}
                  </p>
                ) : (
                  filteredMembers.map((emp: any) => (
                    <div
                      key={emp.id}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border transition-colors ${
                        emp.id === selectedDept.head_id
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <EmpAvatar emp={emp} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-xs font-semibold text-gray-900 truncate">{emp.first_name} {emp.last_name}</p>
                          {emp.id === selectedDept.head_id && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold flex-shrink-0">Head</span>
                          )}
                        </div>
                        {emp.job_title?.title && (
                          <p className="text-[11px] text-gray-500 truncate">{emp.job_title.title}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
