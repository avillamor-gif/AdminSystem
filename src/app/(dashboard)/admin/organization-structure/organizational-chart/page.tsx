'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp,
  Download, X, Search, Users, Building2, Mail, Phone,
  LayoutTemplate
} from 'lucide-react'
import { Card } from '@/components/ui'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import type { EmpOrgNode } from './EmployeeOrgPanel'

const EmployeeOrgPanel = dynamic(() => import('./EmployeeOrgPanel'), { ssr: false })

type Layout = 'top' | 'left' | 'bottom' | 'right'

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: 'top',    label: 'Top → Down' },
  { value: 'left',   label: 'Left → Right' },
  { value: 'bottom', label: 'Bottom → Up' },
  { value: 'right',  label: 'Right → Left' },
]

export default function OrganizationalChartPage() {
  const { data: departments = [] } = useDepartments()
  const { data: employees = [], isLoading } = useEmployees({})

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [layout, setLayout] = useState<Layout>('top')
  const chartRef = useRef<any>(null)

  // Build flat node list for d3-org-chart (employee manager tree)
  const nodes = useMemo<EmpOrgNode[]>(() => {
    const emps = (employees as any[]).filter((e: any) =>
      e.status === 'active' || e.status === 'on_leave'
    )
    const empIds = new Set(emps.map((e: any) => e.id))

    return emps.map((e: any) => {
      const directReports = emps.filter((r: any) => r.manager_id === e.id).length
      // Only link to parent if parent is also in the dataset (avoid orphan links)
      const parentId = e.manager_id && empIds.has(e.manager_id) ? e.manager_id : null
      return {
        id: e.id,
        parentNodeId: parentId,
        firstName: e.first_name,
        lastName: e.last_name,
        jobTitle: e.job_title?.title ?? null,
        department: e.department?.name ?? null,
        avatarUrl: e.avatar_url ?? null,
        status: e.status,
        directReports,
      }
    })
  }, [employees])

  // Filter nodes for search/dept (rebuild chart on filter change)
  const filteredNodes = useMemo<EmpOrgNode[]>(() => {
    let result = nodes
    if (deptFilter) {
      const deptEmpIds = new Set(
        (employees as any[])
          .filter((e: any) => e.department_id === deptFilter)
          .map((e: any) => e.id)
      )
      result = result.filter(n => deptEmpIds.has(n.id))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(n =>
        `${n.firstName} ${n.lastName}`.toLowerCase().includes(q) ||
        (n.jobTitle ?? '').toLowerCase().includes(q) ||
        (n.department ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [nodes, search, deptFilter, employees])

  const selectedEmp = useMemo(
    () => selectedId ? (employees as any[]).find((e: any) => e.id === selectedId) : null,
    [employees, selectedId]
  )

  const directReports = useMemo(
    () => selectedId
      ? (employees as any[]).filter((e: any) => e.manager_id === selectedId && (e.status === 'active' || e.status === 'on_leave'))
      : [],
    [employees, selectedId]
  )

  const manager = useMemo(
    () => selectedEmp?.manager_id
      ? (employees as any[]).find((e: any) => e.id === selectedEmp.manager_id)
      : null,
    [employees, selectedEmp]
  )

  const handleNodeClick = useCallback((id: string) => setSelectedId(id), [])

  const totalActive = (employees as any[]).filter((e: any) => e.status === 'active').length
  const totalManagers = nodes.filter(n => n.directReports > 0).length
  const topLevel = nodes.filter(n => !n.parentNodeId).length

  function MiniAvatar({ emp, size = 'md' }: { emp: any; size?: 'sm' | 'md' | 'lg' }) {
    const px = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs'
    const initials = `${emp.first_name?.[0] ?? ''}${emp.last_name?.[0] ?? ''}`.toUpperCase()
    return emp.avatar_url ? (
      <img src={emp.avatar_url} className={`${px} rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0`} alt="" />
    ) : (
      <div className={`${px} rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center font-bold text-white ring-2 ring-white shadow-sm flex-shrink-0`}>
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organizational Chart</h1>
        <p className="text-gray-500 mt-0.5 text-sm">Employee reporting structure — click any card to view details</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        {[
          { label: 'Total Employees', value: employees.length,  color: 'text-gray-900' },
          { label: 'Active',          value: totalActive,        color: 'text-green-600' },
          { label: 'Managers',        value: totalManagers,      color: 'text-blue-600' },
          { label: 'Top-Level',       value: topLevel,           color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Chart area + side panel */}
      <div className="flex gap-4 flex-1 min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0 flex-wrap gap-y-2">
            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50 w-44"
              />
            </div>

            {/* Dept filter */}
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-600"
            >
              <option value="">All Departments</option>
              {(departments as any[]).map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {/* Layout */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden ml-1">
              <span className="px-2 text-gray-400"><LayoutTemplate className="w-3.5 h-3.5" /></span>
              {LAYOUTS.map(l => (
                <button
                  key={l.value}
                  onClick={() => setLayout(l.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${layout === l.value ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button onClick={() => chartRef.current?.zoomIn()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => chartRef.current?.zoomOut()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
            <button onClick={() => chartRef.current?.fit()} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600" title="Fit"><Maximize2 className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button onClick={() => chartRef.current?.expandAll()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">
              <ChevronDown className="w-3.5 h-3.5" /> Expand All
            </button>
            <button onClick={() => chartRef.current?.collapseAll()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">
              <ChevronUp className="w-3.5 h-3.5" /> Collapse All
            </button>
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button onClick={() => chartRef.current?.exportImg({ full: true })} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Chart */}
          <div className="flex-1 overflow-hidden" style={{ minHeight: 480 }}>
            {filteredNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Users className="w-12 h-12" />
                <p className="text-sm">{search || deptFilter ? 'No employees match your filters' : 'No employees to display'}</p>
              </div>
            ) : (
              <EmployeeOrgPanel
                key={`${layout}-${deptFilter}-${search}`}
                nodes={filteredNodes}
                onNodeClick={handleNodeClick}
                chartRef={chartRef}
                layout={layout}
              />
            )}
          </div>
        </Card>

        {/* Detail panel */}
        {selectedEmp && (
          <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
            <Card className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="flex items-start justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Employee Profile</p>
                <button onClick={() => setSelectedId(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile */}
              <div className="px-4 py-4 flex flex-col items-center text-center border-b border-gray-100 flex-shrink-0">
                <MiniAvatar emp={selectedEmp} size="lg" />
                <h3 className="mt-3 font-bold text-gray-900 text-base">{selectedEmp.first_name} {selectedEmp.last_name}</h3>
                {selectedEmp.job_title?.title && (
                  <p className="text-sm text-orange-600 font-medium mt-0.5">{selectedEmp.job_title.title}</p>
                )}
                {selectedEmp.department?.name && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 justify-center">
                    <Building2 className="w-3 h-3" /> {selectedEmp.department.name}
                  </p>
                )}
                <span className={`mt-2 text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                  selectedEmp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {selectedEmp.status}
                </span>
              </div>

              {/* Contact */}
              <div className="px-4 py-3 space-y-1.5 border-b border-gray-100 flex-shrink-0">
                {selectedEmp.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{selectedEmp.email}</span>
                  </div>
                )}
                {selectedEmp.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{selectedEmp.phone}</span>
                  </div>
                )}
              </div>

              {/* Manager */}
              {manager && (
                <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Reports To</p>
                  <div
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedId(manager.id)}
                  >
                    <MiniAvatar emp={manager} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{manager.first_name} {manager.last_name}</p>
                      {manager.job_title?.title && <p className="text-[11px] text-gray-500 truncate">{manager.job_title.title}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Reports */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
                  Direct Reports ({directReports.length})
                </p>
                {directReports.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No direct reports</p>
                ) : (
                  <div className="space-y-1.5">
                    {directReports.map((r: any) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setSelectedId(r.id)}
                      >
                        <MiniAvatar emp={r} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-900 truncate">{r.first_name} {r.last_name}</p>
                          {r.job_title?.title && <p className="text-[11px] text-gray-500 truncate">{r.job_title.title}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
