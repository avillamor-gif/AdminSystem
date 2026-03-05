'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Building2, Users } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { useDepartments } from '@/hooks/useDepartments'

export default function DepartmentHierarchyPage() {
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())
  const { data: departments = [], isLoading } = useDepartments()

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedDepts)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedDepts(newExpanded)
  }

  // Build hierarchy
  const buildHierarchy = () => {
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
  }

  const hierarchy = buildHierarchy()

  const renderDepartmentNode = (dept: any, level = 0) => {
    const hasChildren = dept.children && dept.children.length > 0
    const isExpanded = expandedDepts.has(dept.id)

    return (
      <div key={dept.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg cursor-pointer ${
            level > 0 ? 'ml-' + (level * 6) : ''
          }`}
          onClick={() => hasChildren && toggleExpand(dept.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
          
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            level === 0 ? 'bg-blue-100' : level === 1 ? 'bg-purple-100' : level === 2 ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            <Building2 className={`w-4 h-4 ${
              level === 0 ? 'text-blue-600' : level === 1 ? 'text-purple-600' : level === 2 ? 'text-green-600' : 'text-orange-600'
            }`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{dept.name}</span>
              <Badge className="bg-gray-100 text-gray-600 text-xs">
                Level {level + 1}
              </Badge>
              {hasChildren && (
                <Badge className="bg-blue-100 text-blue-600 text-xs flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {dept.children.length}
                </Badge>
              )}
            </div>
            {dept.description && (
              <p className="text-sm text-gray-500 truncate">{dept.description}</p>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-4">
            {dept.children.map((child: any) => renderDepartmentNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading department hierarchy...</div>
      </div>
    )
  }

  const totalDepts = departments.length
  const maxDepth = Math.max(...departments.map(d => {
    let depth = 0
    let currentId = d.parent_id
    while (currentId) {
      depth++
      const parent = departments.find(p => p.id === currentId)
      currentId = parent?.parent_id ?? null
      if (depth > 10) break // Safety limit
    }
    return depth
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Department Hierarchy</h1>
        <p className="text-gray-600 mt-1">
          Visualize organizational department structure and relationships
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <p className="text-sm text-gray-600">Expanded</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{expandedDepts.size}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-1">
          {hierarchy.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No departments yet</h3>
              <p className="text-gray-600">Create departments to see the hierarchy</p>
            </div>
          ) : (
            hierarchy.map(dept => renderDepartmentNode(dept))
          )}
        </div>
      </Card>
    </div>
  )
}
