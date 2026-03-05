'use client'

import { Building2, Users } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { useDepartments } from '@/hooks/useDepartments'

export default function OrganizationalChartPage() {
  const { data: departments = [], isLoading } = useDepartments()

  // Build hierarchy for chart display
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

  const renderOrgNode = (dept: any, level = 0) => {
    const hasChildren = dept.children && dept.children.length > 0
    const colors = ['bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600', 'bg-green-100 text-green-600', 'bg-orange-100 text-orange-600']
    const colorClass = colors[level % colors.length]

    return (
      <div key={dept.id} className="flex flex-col items-center">
        {/* Department Node */}
        <Card className="p-4 min-w-[200px] hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{dept.name}</h3>
              {dept.description && (
                <p className="text-xs text-gray-500 truncate">{dept.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-gray-100 text-gray-700 text-xs">
              Level {level + 1}
            </Badge>
            {hasChildren && (
              <Badge className="bg-blue-100 text-blue-700 text-xs flex items-center gap-1">
                <Users className="w-3 h-3" />
                {dept.children.length}
              </Badge>
            )}
          </div>
        </Card>

        {/* Children */}
        {hasChildren && (
          <div className="relative mt-8">
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-0 w-0.5 h-8 bg-gray-300 -translate-x-1/2 -translate-y-8"></div>
            
            <div className="flex gap-8 justify-center">
              {dept.children.map((child: any, idx: number) => (
                <div key={child.id} className="relative">
                  {/* Connecting Lines */}
                  {dept.children.length > 1 && (
                    <>
                      {/* Horizontal Line */}
                      <div className="absolute left-1/2 -top-8 w-full h-0.5 bg-gray-300" style={{
                        width: idx === 0 ? '50%' : idx === dept.children.length - 1 ? '50%' : '100%',
                        left: idx === 0 ? '50%' : idx === dept.children.length - 1 ? '0%' : '0%'
                      }}></div>
                      {/* Vertical connector */}
                      <div className="absolute left-1/2 -top-8 w-0.5 h-8 bg-gray-300 -translate-x-1/2"></div>
                    </>
                  )}
                  {renderOrgNode(child, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading organizational chart...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organizational Chart</h1>
        <p className="text-gray-600 mt-1">
          Visual representation of organizational structure
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Departments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{departments.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Root Departments</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{hierarchy.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Sub-Departments</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{departments.filter(d => d.parent_id).length}</p>
        </Card>
      </div>

      <Card className="p-8 overflow-x-auto">
        {hierarchy.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizational structure yet</h3>
            <p className="text-gray-600">Create departments to see the organizational chart</p>
          </div>
        ) : (
          <div className="flex gap-12 justify-center min-w-max">
            {hierarchy.map(dept => renderOrgNode(dept))}
          </div>
        )}
      </Card>
    </div>
  )
}
