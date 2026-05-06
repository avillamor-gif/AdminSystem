'use client'

import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Building2 } from 'lucide-react'
import { Card } from '@/components/ui'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'

const LEVEL_COLORS = [
  { bg: 'bg-blue-100',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-purple-100', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  { bg: 'bg-green-100',  icon: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  { bg: 'bg-orange-100', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
]
const color = (level: number) => LEVEL_COLORS[level % LEVEL_COLORS.length]

export default function DepartmentHierarchyPage() {
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set())
  const { data: departments = [], isLoading: deptLoading } = useDepartments()
  const { data: employees = [], isLoading: empLoading } = useEmployees({})

  const isLoading = deptLoading || empLoading

  const toggleExpand = (id: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleMembers = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedMembers(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const hierarchy = useMemo(() => {
    const deptMap = new Map(departments.map(d => [d.id, { ...d, children: [] as any[] }]))
    const roots: any[] = []
    departments.forEach(dept => {
      const node = deptMap.get(dept.id)!
      if (dept.parent_id && deptMap.has(dept.parent_id)) {
        deptMap.get(dept.parent_id)!.children.push(node)
      } else {
        roots.push(node)
      }
    })
    return roots
  }, [departments])

  const renderDepartmentNode = (dept: any, level = 0) => {
    const hasChildren = dept.children && dept.children.length > 0
    const isExpanded = expandedDepts.has(dept.id)
    const showMembers = expandedMembers.has(dept.id)
    const c = color(level)

    const deptEmployees = (employees as any[]).filter((e: any) => e.department_id === dept.id && e.status === 'active')
    const head = dept.head_id ? (employees as any[]).find((e: any) => e.id === dept.head_id) : null

    return (
      <div key={dept.id} className="select-none">
        <div
          className="flex items-start gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ marginLeft: level * 28 }}
          onClick={() => hasChildren && toggleExpand(dept.id)}
        >
          <div className="mt-1 flex-shrink-0 w-4">
            {hasChildren
              ? isExpanded
                ? <ChevronDown className="w-4 h-4 text-gray-500" />
                : <ChevronRight className="w-4 h-4 text-gray-500" />
              : null}
          </div>

          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg}`}>
            <Building2 className={`w-4 h-4 ${c.icon}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{dept.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>Level {level + 1}</span>
              {hasChildren && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {dept.children.length} sub-dept{dept.children.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {dept.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{dept.description}</p>
            )}

            {head && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                  {head.avatar_url ? (
                    <img src={head.avatar_url} alt={head.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-orange-200 flex items-center justify-center text-orange-700 text-[9px] font-bold">
                      {head.first_name?.[0]}{head.last_name?.[0]}
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-orange-700">{head.first_name} {head.last_name}</span>
                <span className="text-xs text-gray-400">· Dept Head</span>
              </div>
            )}

            {deptEmployees.length > 0 && (
              <button
                onClick={(e) => toggleMembers(dept.id, e)}
                className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <div className="flex -space-x-1.5">
                  {deptEmployees.slice(0, 5).map((emp: any) => (
                    <div key={emp.id} className="w-6 h-6 rounded-full ring-2 ring-white overflow-hidden flex-shrink-0">
                      {emp.avatar_url ? (
                        <img src={emp.avatar_url} alt={emp.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-[9px] font-bold">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                      )}
                    </div>
                  ))}
                  {deptEmployees.length > 5 && (
                    <div className="w-6 h-6 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-gray-500 text-[9px] font-bold flex-shrink-0">
                      +{deptEmployees.length - 5}
                    </div>
                  )}
                </div>
                <span>{deptEmployees.length} employee{deptEmployees.length !== 1 ? 's' : ''}</span>
                {showMembers ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}

            {showMembers && deptEmployees.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {deptEmployees.map((emp: any) => {
                  const title = emp.job_title?.title ?? null
                  const isHead = emp.id === dept.head_id
                  return (
                    <div key={emp.id} className={`flex items-center gap-2 p-2 rounded-lg border ${isHead ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt={`${emp.first_name} ${emp.last_name}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center text-orange-700 text-xs font-bold">
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <p className="text-xs font-semibold text-gray-900 truncate">{emp.first_name} {emp.last_name}</p>
                          {isHead && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium flex-shrink-0">Head</span>}
                        </div>
                        {title && <p className="text-[11px] text-gray-500 truncate">{title}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="relative" style={{ marginLeft: level * 28 + 16 }}>
            <div className="absolute left-5 top-0 bottom-2 w-px bg-gray-200" />
            <div className="pl-4">
              {dept.children.map((child: any) => renderDepartmentNode(child, level + 1))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  const totalDepts = departments.length
  const totalEmployees = (employees as any[]).filter((e: any) => e.status === 'active').length
  const maxDepth = departments.length ? Math.max(0, ...departments.map(d => {
    let depth = 0, currentId = d.parent_id
    while (currentId) {
      depth++
      currentId = departments.find(p => p.id === currentId)?.parent_id ?? null
      if (depth > 10) break
    }
    return depth
  })) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Department Hierarchy</h1>
        <p className="text-gray-600 mt-1">Departments, their structure, and the employees within each unit</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Departments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalDepts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Root Departments</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{hierarchy.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Max Depth</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{maxDepth + 1}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Employees</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalEmployees}</p>
        </Card>
      </div>

      <Card className="p-6">
        {hierarchy.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
            <p className="text-gray-500">Create departments in Company Structure to see the hierarchy here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {hierarchy.map(dept => renderDepartmentNode(dept))}
          </div>
        )}
      </Card>
    </div>
  )
}
