'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  ZoomIn, ZoomOut, Maximize2, ChevronDown, ChevronUp,
  Download, X, Search, Users, Building2, Mail, Phone,
  LayoutTemplate, Settings, Plus, Pencil, Trash2, GripVertical
} from 'lucide-react'
import { Card, Modal, ModalHeader, ModalBody, ModalFooter, Button, ConfirmModal } from '@/components/ui'
import { useDepartments } from '@/hooks/useDepartments'
import { useEmployees } from '@/hooks/useEmployees'
import {
  useGovernanceNodes,
  useCreateGovernanceNode,
  useUpdateGovernanceNode,
  useDeleteGovernanceNode,
} from '@/hooks/useGovernanceNodes'
import type { GovernanceNode } from '@/services/governanceNode.service'
import type { EmpOrgNode } from './EmployeeOrgPanel'

const EmployeeOrgPanel = dynamic(() => import('./EmployeeOrgPanel'), { ssr: false })

type Layout = 'top' | 'left' | 'bottom' | 'right'

const LAYOUTS: { value: Layout; label: string }[] = [
  { value: 'top',    label: 'Top → Down' },
  { value: 'left',   label: 'Left → Right' },
  { value: 'bottom', label: 'Bottom → Up' },
  { value: 'right',  label: 'Right → Left' },
]

const COLOR_PRESETS = [
  { label: 'Navy',    value: '#1e3a5f' },
  { label: 'Blue',    value: '#1d4ed8' },
  { label: 'Indigo',  value: '#4338ca' },
  { label: 'Purple',  value: '#7c3aed' },
  { label: 'Teal',    value: '#0f766e' },
  { label: 'Green',   value: '#15803d' },
  { label: 'Crimson', value: '#b91c1c' },
  { label: 'Slate',   value: '#334155' },
]

// ─── Governance Form Modal ────────────────────────────────────────────────────
interface GovFormModalProps {
  open: boolean
  onClose: () => void
  editing: GovernanceNode | null
  siblings: GovernanceNode[]
}
function GovFormModal({ open, onClose, editing, siblings }: GovFormModalProps) {
  const createMut = useCreateGovernanceNode()
  const updateMut = useUpdateGovernanceNode()

  const [name, setName] = useState(editing?.name ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [parentId, setParentId] = useState(editing?.parent_id ?? '')
  const [color, setColor] = useState(editing?.color ?? '#1e3a5f')
  const [sortOrder, setSortOrder] = useState(String(editing?.sort_order ?? siblings.length))

  // Reset when editing changes
  useMemo(() => {
    setName(editing?.name ?? '')
    setDescription(editing?.description ?? '')
    setParentId(editing?.parent_id ?? '')
    setColor(editing?.color ?? '#1e3a5f')
    setSortOrder(String(editing?.sort_order ?? siblings.length))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open])

  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      parent_id: parentId || null,
      color,
      sort_order: parseInt(sortOrder) || 0,
    }
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createMut.mutateAsync(payload)
    }
    onClose()
  }

  // Only show other nodes as parent options (can't be own parent)
  const parentOptions = siblings.filter(n => n.id !== editing?.id)

  return (
    <Modal open={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={onClose}>
          {editing ? 'Edit Governance Tier' : 'Add Governance Tier'}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Board of Trustees"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Short description shown on the chart card"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reports To (parent tier)</label>
              <select
                value={parentId}
                onChange={e => setParentId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              >
                <option value="">— Top level (no parent) —</option>
                {parentOptions.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Card Color</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLOR_PRESETS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    title={p.label}
                    onClick={() => setColor(p.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === p.value ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ background: p.value }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  title="Custom color"
                  className="w-7 h-7 rounded-full border border-gray-200 cursor-pointer overflow-hidden p-0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-[11px] text-gray-400 mt-1">Lower number = higher in chain (0 = topmost)</p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : editing ? 'Save Changes' : 'Add Tier'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

// ─── Manage Governance Modal ──────────────────────────────────────────────────
function ManageGovernanceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: govNodes = [] } = useGovernanceNodes()
  const deleteMut = useDeleteGovernanceNode()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<GovernanceNode | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GovernanceNode | null>(null)

  // Build display name with parent chain
  const getDisplayPath = (node: GovernanceNode): string => {
    if (!node.parent_id) return node.name
    const parent = govNodes.find(n => n.id === node.parent_id)
    return parent ? `${parent.name} → ${node.name}` : node.name
  }

  return (
    <>
      <Modal open={open} onClose={onClose} size="lg">
        <ModalHeader onClose={onClose}>Manage Governance Tiers</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-500 mb-4">
            Governance tiers (e.g. General Assembly, Board of Trustees) appear above all employees in the organizational chart, showing the full leadership hierarchy.
          </p>
          {govNodes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No governance tiers yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {govNodes.map(node => (
                <div key={node.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 group">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: node.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{node.name}</p>
                    {node.description && <p className="text-xs text-gray-500 truncate">{node.description}</p>}
                    <p className="text-[10px] text-gray-400 mt-0.5">{getDisplayPath(node)} · Order: {node.sort_order}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(node); setFormOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-white hover:shadow text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(node)}
                      className="p-1.5 rounded-lg hover:bg-white hover:shadow text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true) }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Tier
          </Button>
        </ModalFooter>
      </Modal>

      <GovFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        editing={editing}
        siblings={govNodes}
      />

      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteMut.mutateAsync(deleteTarget.id)
            setDeleteTarget(null)
          }}
          title="Delete Governance Tier"
          message={`Are you sure you want to delete "${deleteTarget.name}"? Any tiers that report to it will become top-level.`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </>
  )
}

export default function OrganizationalChartPage() {
  const { data: departments = [] } = useDepartments()
  const { data: employees = [], isLoading } = useEmployees({})
  const { data: govNodes = [] } = useGovernanceNodes()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [layout, setLayout] = useState<Layout>('top')
  const [manageGovOpen, setManageGovOpen] = useState(false)
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
    // Re-null any parentNodeId whose parent was filtered out — d3-org-chart
    // silently fails if a parentNodeId references a node not in the dataset.
    const filteredIds = new Set(result.map(n => n.id))
    const fixed = result.map(n => ({
      ...n,
      parentNodeId: n.parentNodeId && filteredIds.has(n.parentNodeId) ? n.parentNodeId : null,
    }))
    // d3-org-chart requires exactly ONE root. If multiple roots exist (multiple
    // employees with no parent in the filtered set), create a virtual root node
    // and attach all orphans to it.
    const roots = fixed.filter(n => !n.parentNodeId)
    if (roots.length > 1) {
      const virtualRoot: EmpOrgNode = {
        id: '__virtual_root__',
        parentNodeId: null,
        firstName: 'Organization',
        lastName: '',
        jobTitle: null,
        department: null,
        avatarUrl: null,
        status: 'active',
        directReports: roots.length,
      }
      return [
        virtualRoot,
        ...fixed.map(n => n.parentNodeId === null ? { ...n, parentNodeId: '__virtual_root__' } : n),
      ]
    }
    return fixed
  }, [nodes, search, deptFilter, employees])

  // Merge governance tiers above the employee tree
  const allChartNodes = useMemo<EmpOrgNode[]>(() => {
    if (govNodes.length === 0) return filteredNodes

    // Convert governance nodes to EmpOrgNode-compatible shape
    const govChain: EmpOrgNode[] = govNodes.map(g => ({
      id: `gov_${g.id}`,
      parentNodeId: g.parent_id ? `gov_${g.parent_id}` : null,
      firstName: g.name,
      lastName: '',
      jobTitle: g.description,
      department: null,
      avatarUrl: null,
      status: 'active',
      directReports: 0,
      isGovernance: true,
      govColor: g.color,
    }))

    // Find the leaf governance node (the bottom-most tier, closest to employees).
    // Leaf = a governance node whose ID is NOT referenced as a parent by any other.
    const govParentIds = new Set(
      govNodes.filter(g => g.parent_id !== null).map(g => `gov_${g.parent_id}`)
    )
    const leafGov = govChain.find(g => !govParentIds.has(g.id)) ?? govChain[govChain.length - 1]

    if (!leafGov) return filteredNodes

    // Attach all top-level employee/virtual nodes to the leaf governance node
    const attached = filteredNodes.map(n =>
      n.parentNodeId === null ? { ...n, parentNodeId: leafGov.id } : n
    )

    return [...govChain, ...attached]
  }, [govNodes, filteredNodes])

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
            <div className="w-px h-5 bg-gray-200 mx-0.5" />
            <button
              onClick={() => setManageGovOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200"
              title="Add/edit governance tiers (e.g. General Assembly, Board of Trustees)"
            >
              <Settings className="w-3.5 h-3.5" /> Governance
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
                key={`${layout}-${deptFilter}-${search}-${govNodes.length}`}
                nodes={allChartNodes}
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

      <ManageGovernanceModal open={manageGovOpen} onClose={() => setManageGovOpen(false)} />
    </div>
  )
}
