'use client'

import { useEffect, useRef } from 'react'

export interface EmpOrgNode {
  id: string
  parentNodeId: string | null
  firstName: string
  lastName: string
  jobTitle: string | null
  department: string | null
  avatarUrl: string | null
  status: string
  directReports: number
}

interface EmployeeOrgPanelProps {
  nodes: EmpOrgNode[]
  onNodeClick: (id: string) => void
  chartRef: React.MutableRefObject<any>
  layout?: 'top' | 'left' | 'bottom' | 'right'
}

function nodeHtml(d: { data: EmpOrgNode }) {
  const n = d.data
  const initials = `${n.firstName?.[0] ?? ''}${n.lastName?.[0] ?? ''}`.toUpperCase()
  const avatarHtml = n.avatarUrl
    ? `<img src="${n.avatarUrl}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2.5px solid #fff;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.12)" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#f97316,#fb923c);border:2.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;flex-shrink:0;box-shadow:0 2px 8px rgba(249,115,22,0.3)">${initials}</div>`

  const statusDot = n.status === 'active'
    ? `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#22c55e;margin-right:4px;flex-shrink:0"></span>`
    : `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#d1d5db;margin-right:4px;flex-shrink:0"></span>`

  return `
    <div style="
      font-family:Inter,system-ui,sans-serif;
      width:220px;
      background:#fff;
      border-radius:14px;
      box-shadow:0 2px 16px rgba(0,0,0,0.08);
      border:1.5px solid #f1f5f9;
      cursor:pointer;
      overflow:hidden;
      transition:box-shadow .15s;
    ">
      <div style="padding:14px 14px 10px;display:flex;align-items:center;gap:12px;">
        ${avatarHtml}
        <div style="min-width:0;flex:1;">
          <div style="font-size:13px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            ${n.firstName} ${n.lastName}
          </div>
          <div style="font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">
            ${n.jobTitle ?? '<span style="color:#d1d5db;font-style:italic">No title</span>'}
          </div>
          ${n.department ? `<div style="font-size:10px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">${n.department}</div>` : ''}
        </div>
      </div>
      <div style="padding:6px 14px 10px;display:flex;align-items:center;gap:6px;border-top:1px solid #f8fafc">
        ${statusDot}
        <span style="font-size:10px;color:#6b7280;text-transform:capitalize">${n.status}</span>
        ${n.directReports > 0
          ? `<span style="margin-left:auto;font-size:10px;color:#f97316;font-weight:600;background:#fff7ed;padding:2px 8px;border-radius:20px;border:1px solid #fed7aa">${n.directReports} report${n.directReports !== 1 ? 's' : ''}</span>`
          : ''}
      </div>
    </div>
  `
}

export default function EmployeeOrgPanel({ nodes, onNodeClick, chartRef, layout = 'top' }: EmployeeOrgPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onClickRef = useRef(onNodeClick)
  onClickRef.current = onNodeClick

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return
    let cancelled = false

    const run = async () => {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      if (cancelled || !containerRef.current) return

      const mod = await import('d3-org-chart/build/d3-org-chart.min.js' as any)
      const OrgChart = mod.OrgChart ?? mod.default?.OrgChart
      if (!OrgChart || cancelled || !containerRef.current) return

      if (chartRef.current) {
        try { chartRef.current.clear() } catch (_) {}
        chartRef.current = null
      }

      chartRef.current = new OrgChart()
      chartRef.current
        .container(containerRef.current)
        .data(nodes)
        .layout(layout)
        .nodeWidth(() => 224)
        .nodeHeight(() => 108)
        .childrenMargin(() => 40)
        .compactMarginBetween(() => 20)
        .compactMarginPair(() => 20)
        .siblingsMargin(() => 16)
        .nodeContent((d: any) => nodeHtml(d))
        .onNodeClick((d: any) => onClickRef.current(d.id))
        .render()
        .fit()
    }

    run()
    return () => { cancelled = true }
  }, [nodes, layout, chartRef])

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />
}
