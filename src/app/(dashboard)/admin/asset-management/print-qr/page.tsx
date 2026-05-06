'use client'

import { useState, useEffect, useRef } from 'react'
import { useAssets, type Asset } from '@/hooks/useAssets'
import { Printer, CheckSquare, Square, ChevronDown, Search, LayoutGrid } from 'lucide-react'
import QRCode from 'qrcode'
import Image from 'next/image'

type Size = 'large' | 'small'

// ── Size config ───────────────────────────────────────────────────────────────
// large : 2 cols × 4 rows = 8 per A4  (~95mm × 65mm each)
// small : 4 cols × 8 rows = 32 per A4 (~45mm × 32mm each)
const SIZE_CONFIG: Record<Size, { cols: number; labelW: string; labelH: string; qrSize: number; fontSize: string; tagSize: string }> = {
  large: { cols: 2, labelW: '95mm', labelH: '65mm', qrSize: 140, fontSize: '9pt',  tagSize: '8pt'  },
  small: { cols: 4, labelW: '45mm', labelH: '32mm', qrSize:  64, fontSize: '6pt',  tagSize: '5.5pt' },
}

// ── QR cache ──────────────────────────────────────────────────────────────────
function useQRCodes(assets: Asset[], origin: string) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!assets.length || !origin) return
    let cancelled = false
    ;(async () => {
      const entries: [string, string][] = await Promise.all(
        assets.map(async a => {
          const url = await QRCode.toDataURL(`${origin}/asset-view/${a.id}`, {
            width: 200, margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          })
          return [a.id, url] as [string, string]
        })
      )
      if (!cancelled) setQrMap(Object.fromEntries(entries))
    })()
    return () => { cancelled = true }
  }, [assets, origin])
  return qrMap
}

// ── Label ─────────────────────────────────────────────────────────────────────
function Label({ asset, qrUrl, size }: { asset: Asset; qrUrl: string; size: Size }) {
  const cfg = SIZE_CONFIG[size]
  return (
    <div
      className="label-item flex flex-col items-center justify-center border border-dashed border-gray-300 overflow-hidden bg-white"
      style={{ width: cfg.labelW, height: cfg.labelH, padding: size === 'large' ? '4mm' : '1.5mm', boxSizing: 'border-box' }}
    >
      {qrUrl ? (
        <img src={qrUrl} alt={asset.asset_tag ?? asset.name} style={{ width: cfg.qrSize, height: cfg.qrSize, display: 'block' }} />
      ) : (
        <div style={{ width: cfg.qrSize, height: cfg.qrSize, background: '#f3f4f6' }} />
      )}
      <p style={{ fontSize: cfg.fontSize, fontWeight: 700, textAlign: 'center', margin: '1mm 0 0', lineHeight: 1.2, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {asset.name}
      </p>
      {asset.asset_tag && (
        <p style={{ fontSize: cfg.tagSize, color: '#6b7280', fontFamily: 'monospace', textAlign: 'center', margin: '0.5mm 0 0' }}>
          {asset.asset_tag}
        </p>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PrintQRPage() {
  const { data: allAssets = [], isLoading } = useAssets({})
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [size, setSize] = useState<Size>('large')
  const [origin, setOrigin] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setOrigin(window.location.origin) }, [])

  const filtered = allAssets.filter(a =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.asset_tag ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const selectedAssets = allAssets.filter(a => selected.has(a.id))
  const qrMap = useQRCodes(selectedAssets.length ? selectedAssets : allAssets, origin)

  const toggleOne = (id: string) => setSelected(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const toggleAll = () => {
    if (selected.size === filtered.length && filtered.every(a => selected.has(a.id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(a => a.id)))
    }
  }
  const selectAll = () => setSelected(new Set(allAssets.map(a => a.id)))
  const clearAll  = () => setSelected(new Set())

  const toPrint = selected.size > 0
    ? allAssets.filter(a => selected.has(a.id))
    : allAssets

  const cfg = SIZE_CONFIG[size]
  const colCount = cfg.cols

  const handlePrint = () => {
    const style = `
      @page { size: A4 portrait; margin: 10mm; }
      body { margin: 0; }
      .no-print { display: none !important; }
      .print-area { display: block !important; }
      .label-grid {
        display: grid;
        grid-template-columns: repeat(${colCount}, ${cfg.labelW});
        gap: 2mm;
        justify-content: center;
      }
      .label-item { page-break-inside: avoid; }
    `
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Asset QR Codes</title>
<style>${style}</style></head>
<body>${printRef.current?.innerHTML ?? ''}</body></html>`
    const win = window.open('', '_blank', 'width=794,height=1123')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 800)
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Toolbar ── */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-gray-200 p-0.5 shrink-0">
            <Image src="/ibon-icon.png" alt="IBON" width={28} height={28} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Bulk QR Print</h1>
            <p className="text-xs text-gray-500">{toPrint.length} asset{toPrint.length !== 1 ? 's' : ''} · {Math.ceil(toPrint.length / (colCount === 2 ? 8 : 32))} page{Math.ceil(toPrint.length / (colCount === 2 ? 8 : 32)) !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Size toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setSize('large')}
            className={`px-3 py-1.5 font-medium transition-colors ${size === 'large' ? 'bg-[#ff7e15] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Large <span className="text-xs opacity-70">(8/page)</span>
          </button>
          <button
            onClick={() => setSize('small')}
            className={`px-3 py-1.5 font-medium transition-colors ${size === 'small' ? 'bg-[#ff7e15] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Small <span className="text-xs opacity-70">(32/page)</span>
          </button>
        </div>

        {/* Print button */}
        <button
          onClick={handlePrint}
          disabled={isLoading || Object.keys(qrMap).length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff7e15] hover:bg-[#e66e0e] text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print {selected.size > 0 ? `${selected.size} Selected` : 'All'}
        </button>
      </div>

      <div className="no-print flex gap-6 px-6 py-5 max-w-7xl mx-auto">

        {/* ── Asset selector panel ── */}
        <div className="w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search assets…"
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7e15]/30"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
                  {allFilteredSelected
                    ? <CheckSquare className="w-3.5 h-3.5 text-[#ff7e15]" />
                    : <Square className="w-3.5 h-3.5" />
                  }
                  {allFilteredSelected ? 'Deselect all' : 'Select all'}
                </button>
                <div className="flex gap-2 text-xs">
                  <button onClick={selectAll}  className="text-[#ff7e15] hover:underline">All</button>
                  <button onClick={clearAll}   className="text-gray-400 hover:underline">None</button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No assets found</div>
              ) : (
                filtered.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => toggleOne(asset.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected.has(asset.id) ? 'bg-orange-50' : ''}`}
                  >
                    {selected.has(asset.id)
                      ? <CheckSquare className="w-4 h-4 text-[#ff7e15] shrink-0" />
                      : <Square className="w-4 h-4 text-gray-300 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{asset.name}</p>
                      {asset.asset_tag && <p className="text-xs font-mono text-gray-400">{asset.asset_tag}</p>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              Print preview — {size === 'large' ? '2 columns × 4 rows (Large)' : '4 columns × 8 rows (Small)'} · A4
              {Object.keys(qrMap).length < toPrint.length && (
                <span className="ml-2 text-amber-500">Generating QR codes…</span>
              )}
            </p>

            {/* Hidden print container */}
            <div ref={printRef} style={{ display: 'none' }}>
              <div
                className="label-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${colCount}, ${cfg.labelW})`,
                  gap: '2mm',
                  justifyContent: 'center',
                }}
              >
                {toPrint.map(asset => (
                  <Label key={asset.id} asset={asset} qrUrl={qrMap[asset.id] ?? ''} size={size} />
                ))}
              </div>
            </div>

            {/* Visible preview grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.min(colCount * 2, 8)}, 1fr)`,
                gap: '6px',
              }}
            >
              {toPrint.slice(0, 64).map(asset => (
                <div key={asset.id} className="flex flex-col items-center border border-dashed border-gray-200 rounded p-1.5 bg-gray-50">
                  {qrMap[asset.id] ? (
                    <img src={qrMap[asset.id]} alt={asset.name} className="w-full aspect-square object-contain" />
                  ) : (
                    <div className="w-full aspect-square bg-gray-200 rounded animate-pulse" />
                  )}
                  <p className="text-[9px] text-gray-600 font-medium text-center mt-0.5 leading-tight line-clamp-1 w-full">{asset.name}</p>
                  {asset.asset_tag && <p className="text-[8px] text-gray-400 font-mono">{asset.asset_tag}</p>}
                </div>
              ))}
              {toPrint.length > 64 && (
                <div className="flex items-center justify-center border border-dashed border-gray-200 rounded p-2 text-xs text-gray-400">
                  +{toPrint.length - 64} more
                </div>
              )}
            </div>

            {toPrint.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-400">
                No assets to print. Select some from the left or they'll all be included.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
