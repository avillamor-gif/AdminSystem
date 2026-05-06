'use client'

import { useEffect, useRef } from 'react'

export interface OrgChartNode {
  id: string
  parentNodeId: string | null
  name: string
  description?: string | null
  headName?: string | null
  headAvatar?: string | null
  headTitle?: string | null
  employeeCount: number
  level: number
}

interface OrgChartPanelProps {
  nodes: OrgChartNode[]
  onNodeClick: (id: string) => void
  chartRef: React.MutableRefObject<any>
}

const LEVEL_PALETTE = [
  { header: '#3b82f6', light: '#eff6ff', text: '#1d4ed8' }, // blue
  { header: '#8b5cf6', light: '#f5f3ff', text: '#6d28d9' }, // purple
  { header: '#10b981', light: '#ecfdf5', text: '#065f46' }, // green
  { header: '#f97316', light: '#fff7ed', text: '#c2410c' }, // orange
]

function nodeHtml(d: { data: OrgChartNode }) {
  const n = d.data
  const pal = LEVEL_PALETTE[n.level % LEVEL_PALETTE.length]
  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()

  const avatarHtml = n.headAvatar
    ? `<img src="${n.headAvatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:2px solid white;flex-shrink:0" />`
    : n.headName
    ? `<div style="width:28px;height:28px;border-radius:50%;background:${pal.header}22;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${pal.header};flex-shrink:0">${initials(n.headName)}</div>`
    : ''

  return `
    <div style="
      font-family: Inter, system-ui, sans-serif;
      width: 240px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.10);
      border: 1.5px solid ${pal.header}33;
      background: #fff;
      cursor: pointer;
      transition: box-shadow .15s;
    ">
      <div style="background:${pal.header};padding:10px 14px;display:flex;align-items:center;gap:8px;">
        <div style="background:rgba(255,255,255,0.25);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="color:white;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.name}</div>
          <div style="color:rgba(255,255,255,0.75);font-size:11px">Level ${n.level + 1}</div>
        </div>
        <div style="background:rgba(255,255,255,0.2);color:white;font-size:11px;font-weight:600;padding:2px 8px;border-radius:20px;flex-shrink:0">${n.employeeCount}</div>
      </div>
      ${n.headName ? `
      <div style="padding:10px 14px;display:flex;align-items:center;gap:8px;border-top:1px solid ${pal.header}22">
        ${avatarHtml}
        <div style="min-width:0;">
          <div style="font-size:12px;font-weight:600;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.headName}</div>
          ${n.headTitle ? `<div style="font-size:11px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.headTitle}</div>` : ''}
        </div>
      </div>
      ` : `<div style="padding:8px 14px;font-size:11px;color:#9ca3af;font-style:italic">No department head assigned</div>`}
    </div>
  `
}

export default function OrgChartPanel({ nodes, onNodeClick, chartRef }: OrgChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onNodeClickRef = useRef(onNodeClick)
  onNodeClickRef.current = onNodeClick

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return
    let cancelled = false

    const run = async () => {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      if (cancelled || !containerRef.current) return

      const { OrgChart } = await import('d3-org-chart')
      if (cancelled || !containerRef.current) return

      if (chartRef.current) {
        try { chartRef.current.clear() } catch (_) {}
        chartRef.current = null
      }

      chartRef.current = new OrgChart()
      chartRef.current
        .container(containerRef.current)
        .data(nodes)
        .nodeWidth(() => 244)
        .nodeHeight((d: any) => (d.data.headName ? 102 : 72))
        .childrenMargin(() => 50)
        .compactMarginBetween(() => 30)
        .compactMarginPair(() => 30)
        .siblingsMargin(() => 20)
        .nodeContent((d: any) => nodeHtml(d))
        .onNodeClick((d: any) => onNodeClickRef.current(d.id))
        .render()
        .fit()
    }

    run()
    return () => { cancelled = true }
  }, [nodes, chartRef])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '600px' }}
    />
  )
}
