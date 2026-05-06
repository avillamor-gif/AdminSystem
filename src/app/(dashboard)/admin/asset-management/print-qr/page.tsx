'use client'

import { useState, useEffect, useRef } from 'react'
import { useAssets, type Asset } from '@/hooks/useAssets'
import { Printer, CheckSquare, Square, ChevronDown, Search, LayoutGrid } from 'lucide-react'
import QRCode from 'qrcode'
import Image from 'next/image'

type Size = 'large' | 'small'

// ── Size config ───────────────────────────────────────────────────────────────
// large : 2 cols × 5 rows = 10 per A4  (~90mm × 55mm each)
// small : 4 cols × 8 rows = 32 per A4 (~45mm × 27mm each)
const SIZE_CONFIG: Record<Size, { cols: number; labelW: string; labelH: string; qrSize: number }> = {
  large: { cols: 2, labelW: '90mm', labelH: '55mm', qrSize: 160 },
  small: { cols: 4, labelW: '45mm', labelH: '27mm', qrSize: 96  },
}

// ── Logo singleton — load once, reuse for all QR codes ───────────────────────
let cachedLogo: HTMLImageElement | null = null
function loadLogo(): Promise<HTMLImageElement> {
  if (cachedLogo) return Promise.resolve(cachedLogo)
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { cachedLogo = img; resolve(img) }
    img.onerror = reject
    img.src = '/ibon-icon.png'
  })
}

// Yield to browser between heavy tasks
const yieldToBrowser = () => new Promise<void>(r => setTimeout(r, 0))

// ── QR with logo (canvas) ────────────────────────────────────────────────────
async function generateQRWithLogo(url: string, size: number, logo: HTMLImageElement): Promise<string> {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, url, {
    width: size, margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas.toDataURL()
  const logoSize = Math.round(size * 0.22)
  const cx = (canvas.width - logoSize) / 2
  const cy = (canvas.height - logoSize) / 2
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(cx - 3, cy - 3, logoSize + 6, logoSize + 6)
  ctx.drawImage(logo, cx, cy, logoSize, logoSize)
  return canvas.toDataURL('image/png')
}

// ── QR cache — parallel batches of 8 ─────────────────────────────────────────
const BATCH_SIZE = 8
function useQRCodes(assets: Asset[], origin: string, size: Size) {
  const [qrMap, setQrMap] = useState<Record<string, string>>({})
  const qrSize = SIZE_CONFIG[size].qrSize
  useEffect(() => {
    if (!assets.length || !origin) return
    setQrMap({})
    let cancelled = false
    ;(async () => {
      let logo: HTMLImageElement
      try { logo = await loadLogo() } catch { return }
      // Process in parallel batches so the browser stays responsive
      for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        if (cancelled) break
        const batch = assets.slice(i, i + BATCH_SIZE)
        const results = await Promise.allSettled(
          batch.map(a => generateQRWithLogo(`${origin}/asset-view/${a.id}`, qrSize, logo).then(url => ({ id: a.id, url })))
        )
        if (cancelled) break
        const updates: Record<string, string> = {}
        for (const r of results) {
          if (r.status === 'fulfilled') updates[r.value.id] = r.value.url
        }
        setQrMap(prev => ({ ...prev, ...updates }))
        await yieldToBrowser() // yield once per batch
      }
    })()
    return () => { cancelled = true }
  }, [assets, origin, qrSize])
  return qrMap
}

// ── Label — QR only, no text ─────────────────────────────────────────────────
function Label({ asset, qrUrl, size }: { asset: Asset; qrUrl: string; size: Size }) {
  const cfg = SIZE_CONFIG[size]
  const pad = size === 'large' ? '3mm' : '1.5mm'
  return (
    <div
      className="label-item flex items-center justify-center border border-dashed border-gray-300 bg-white overflow-hidden"
      style={{ width: cfg.labelW, height: cfg.labelH, padding: pad, boxSizing: 'border-box' }}
    >
      {qrUrl ? (
        <img src={qrUrl} alt={asset.asset_tag ?? asset.name} style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }} />
      ) : (
        <div style={{ width: '60%', aspectRatio: '1', background: '#f3f4f6', borderRadius: 4 }} />
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
  // Only generate QR codes for selected assets — never auto-generate for all
  const qrMap = useQRCodes(selectedAssets, origin, size)

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

  const toPrint = selectedAssets

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
            <p className="text-xs text-gray-500">
              {toPrint.length === 0
                ? 'Select assets to print'
                : `${toPrint.length} selected · ${Math.ceil(toPrint.length / (colCount === 2 ? 10 : 32))} page${Math.ceil(toPrint.length / (colCount === 2 ? 10 : 32)) !== 1 ? 's' : ''}`
              }
            </p>
          </div>
        </div>

        {/* Size toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setSize('large')}
            className={`px-3 py-1.5 font-medium transition-colors ${size === 'large' ? 'bg-[#ff7e15] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Large <span className="text-xs opacity-70">(10/page)</span>
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
          disabled={isLoading || toPrint.length === 0 || Object.keys(qrMap).length < toPrint.length}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff7e15] hover:bg-[#e66e0e] text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print {toPrint.length > 0 ? `${toPrint.length} Selected` : '—'}
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
              Print preview — {size === 'large' ? '2 columns × 5 rows · Large (QR only)' : '4 columns × 8 rows · Small (QR only)'} · A4
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
