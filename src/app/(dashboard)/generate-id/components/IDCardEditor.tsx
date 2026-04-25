'use client'

import { useState, useRef, useCallback } from 'react'
import Draggable from 'react-draggable'
import { RotateCcw, Save, Eye, EyeOff, Move, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui'
import {
  CARD_W,
  CARD_H,
  type CardElementLayout,
  type ElementStyle,
} from '../hooks/useIDCardLayout'
import type { EmployeeWithRelations } from '@/services/employee.service'

interface IDCardEditorProps {
  side: 'front' | 'back'
  layout: CardElementLayout[]
  employee: EmployeeWithRelations & { [key: string]: any }
  onUpdateElement: (id: string, patch: Partial<ElementStyle>) => void
  onSave: () => void
  onReset: () => void
  bgImage?: string | null
  onUploadBg: (dataUrl: string | null) => void
  overlayImage?: string | null
  onUploadOverlay: (dataUrl: string | null) => void
}

function getElementLabel(id: string, employee: EmployeeWithRelations & { [key: string]: any }, customText?: string): string {
  if (customText !== undefined) return customText
  switch (id) {
    case 'lastName': return (employee.last_name || '').toUpperCase() || 'LAST NAME'
    case 'firstName': return (employee.first_name || '').toUpperCase() || 'FIRST NAME'
    case 'jobTitle': return (employee.job_title?.title || '').toUpperCase() || 'JOB TITLE'
    case 'employeeId': return `ID # ${employee.employee_id || '—'}`
    case 'emergencyContact': return `${employee.emergency_contact_name || '—'} | ${employee.emergency_contact_phone || employee.phone || '—'}`
    case 'tinNumber': return `TIN No.: ${employee.tin_number || '—'}`
    case 'sssNumber': return `SSS No.: ${employee.sss_number || '—'}`
    case 'pagibigNumber': return `PAG-IBIG No.: ${employee.pagibig_number || '—'}`
    case 'philhealthNumber': return `Philhealth No.: ${employee.philhealth_number || '—'}`
    case 'birthday': {
      const dob = employee.date_of_birth
        ? new Date(employee.date_of_birth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
        : '—'
      return `Birthday: ${dob}`
    }
    default: return id
  }
}

export function IDCardEditor({
  side,
  layout,
  employee,
  onUpdateElement,
  onSave,
  onReset,
  bgImage,
  onUploadBg,
  overlayImage,
  onUploadOverlay,
}: IDCardEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const nodeRefs = useRef<Record<string, React.RefObject<HTMLDivElement>>>({})
  const bgInputRef = useRef<HTMLInputElement>(null)
  const overlayInputRef = useRef<HTMLInputElement>(null)

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onUploadBg(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [onUploadBg])

  const handleOverlayUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onUploadOverlay(ev.target?.result as string)
      // Auto-show the overlay element when image is uploaded
      onUpdateElement('overlay', { hidden: false })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [onUploadOverlay, onUpdateElement])

  // Ensure a nodeRef exists for each element (required by react-draggable with StrictMode)
  layout.forEach(el => {
    if (!nodeRefs.current[el.id]) {
      nodeRefs.current[el.id] = { current: null } as React.RefObject<HTMLDivElement>
    }
  })

  const selectedEl = layout.find(el => el.id === selectedId) ?? null

  const handleSave = () => {
    onSave()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const defaultBgSrc = side === 'front' ? '/FrontID.png' : '/BackID.png'
  const bgSrc = bgImage ?? defaultBgSrc

  return (
    <div className="flex gap-4 items-start">
      {/* Canvas */}
      <div className="flex flex-col items-center gap-3">
        <div
          style={{
            width: CARD_W,
            height: CARD_H,
            position: 'relative',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            cursor: 'default',
            userSelect: 'none',
          }}
          onClick={(e) => {
            // Deselect when clicking canvas background
            if (e.target === e.currentTarget) setSelectedId(null)
          }}
        >
          {/* Background */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgSrc}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            draggable={false}
          />

          {/* Draggable elements */}
          {layout.map(el => {
            if (el.style.hidden) return null
            const isSelected = el.id === selectedId
            const nodeRef = nodeRefs.current[el.id]

            if (el.type === 'photo') {
              return (
                <Draggable
                  key={el.id}
                  nodeRef={nodeRef}
                  position={{ x: el.style.x, y: el.style.y }}
                  bounds="parent"
                  onStop={(_, data) => onUpdateElement(el.id, { x: data.x, y: data.y })}
                  onStart={() => setSelectedId(el.id)}
                >
                  <div
                    ref={nodeRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: el.style.width,
                      height: el.style.height,
                      cursor: 'grab',
                      outline: isSelected ? '2px dashed #f97316' : '2px dashed transparent',
                      outlineOffset: 2,
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id) }}
                  >
                    {employee.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={employee.avatar_url}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', pointerEvents: 'none' }}
                        draggable={false}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 36, fontWeight: 700, color: '#9ca3af', pointerEvents: 'none',
                      }}>
                        {(employee.first_name?.[0] || '').toUpperCase()}
                        {(employee.last_name?.[0] || '').toUpperCase()}
                      </div>
                    )}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: -18, left: 0,
                        background: '#f97316', color: '#fff',
                        fontSize: 10, padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                      }}>
                        Photo
                      </div>
                    )}
                  </div>
                </Draggable>
              )
            }

            if (el.type === 'divider') {
              return (
                <Draggable
                  key={el.id}
                  nodeRef={nodeRef}
                  position={{ x: el.style.x, y: el.style.y }}
                  bounds="parent"
                  onStop={(_, data) => onUpdateElement(el.id, { x: data.x, y: data.y })}
                  onStart={() => setSelectedId(el.id)}
                >
                  <div
                    ref={nodeRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: el.style.width ?? 140,
                      height: 10,
                      cursor: 'grab',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id) }}
                  >
                    <div style={{
                      width: '100%',
                      height: el.style.height ?? 2,
                      backgroundColor: el.style.color ?? '#111',
                      outline: isSelected ? '1px dashed #f97316' : 'none',
                      outlineOffset: 3,
                    }} />
                  </div>
                </Draggable>
              )
            }

            if (el.type === 'signature') {
              return (
                <Draggable
                  key={el.id}
                  nodeRef={nodeRef}
                  position={{ x: el.style.x, y: el.style.y }}
                  bounds="parent"
                  onStop={(_, data) => onUpdateElement(el.id, { x: data.x, y: data.y })}
                  onStart={() => setSelectedId(el.id)}
                >
                  <div
                    ref={nodeRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: el.style.width ?? 120,
                      height: el.style.height ?? 40,
                      cursor: 'grab',
                      outline: isSelected ? '2px dashed #f97316' : '2px dashed transparent',
                      outlineOffset: 2,
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id) }}
                  >
                    {employee.signature_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={employee.signature_url}
                        alt="signature"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                        draggable={false}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', border: '1px dashed #aaa',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: '#aaa', pointerEvents: 'none',
                      }}>
                        No signature
                      </div>
                    )}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: -18, left: 0,
                        background: '#f97316', color: '#fff',
                        fontSize: 10, padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                      }}>
                        E-Signature
                      </div>
                    )}
                  </div>
                </Draggable>
              )
            }

            if (el.type === 'overlay') {
              return (
                <Draggable
                  key={el.id}
                  nodeRef={nodeRef}
                  position={{ x: el.style.x, y: el.style.y }}
                  bounds="parent"
                  onStop={(_, data) => onUpdateElement(el.id, { x: data.x, y: data.y })}
                  onStart={() => setSelectedId(el.id)}
                >
                  <div
                    ref={nodeRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: el.style.width ?? CARD_W,
                      height: el.style.height ?? CARD_H,
                      cursor: 'grab',
                      outline: isSelected ? '2px dashed #f97316' : '2px dashed transparent',
                      outlineOffset: 2,
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id) }}
                  >
                    {overlayImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={overlayImage}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                        draggable={false}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', border: '2px dashed #d1d5db',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, color: '#9ca3af', pointerEvents: 'none',
                      }}>
                        No overlay uploaded
                      </div>
                    )}
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: -18, left: 0,
                        background: '#f97316', color: '#fff',
                        fontSize: 10, padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                      }}>
                        Background Overlay
                      </div>
                    )}
                  </div>
                </Draggable>
              )
            }

            // text element
            const text = getElementLabel(el.id, employee, el.style.customText)
            return (
              <Draggable
                key={el.id}
                nodeRef={nodeRef}
                position={{ x: el.style.x, y: el.style.y }}
                bounds="parent"
                onStop={(_, data) => onUpdateElement(el.id, { x: data.x, y: data.y })}
                onStart={() => setSelectedId(el.id)}
              >
                <div
                  ref={nodeRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: el.style.width ?? 'auto',
                    fontSize: el.style.fontSize,
                    fontWeight: el.style.fontWeight,
                    color: el.style.color,
                    textAlign: el.style.textAlign ?? 'left',
                    letterSpacing: el.style.letterSpacing,
                    lineHeight: el.style.lineHeight,
                    whiteSpace: el.style.width ? 'normal' : 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'grab',
                    outline: isSelected ? '1px dashed #f97316' : '1px dashed transparent',
                    outlineOffset: 2,
                    padding: '0 2px',
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(el.id) }}
                >
                  {text}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: -18, left: 0,
                      background: '#f97316', color: '#fff',
                      fontSize: 10, padding: '1px 5px', borderRadius: 3, whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}>
                      {el.label}
                    </div>
                  )}
                </div>
              </Draggable>
            )
          })}
        </div>

        {/* Canvas hint */}
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Move className="w-3 h-3" /> Click to select · Drag to reposition
        </p>
      </div>

      {/* Properties panel */}
      <div className="flex flex-col gap-3 min-w-[200px]">
        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onReset} className="flex-1 text-xs py-1.5">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
          <Button onClick={handleSave} className="flex-1 text-xs py-1.5">
            <Save className="w-3.5 h-3.5 mr-1" />
            {saved ? 'Saved!' : 'Save'}
          </Button>
        </div>

        {/* Background image upload */}
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-gray-600">Background Image</div>
          <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => bgInputRef.current?.click()} className="flex-1 text-xs py-1.5">
              <ImagePlus className="w-3.5 h-3.5 mr-1" /> Upload
            </Button>
            {bgImage && (
              <Button variant="danger" onClick={() => onUploadBg(null)} className="text-xs py-1.5 px-3">
                Remove
              </Button>
            )}
          </div>
          {bgImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bgImage} alt="bg preview" className="w-full rounded border border-gray-200" style={{ maxHeight: 60, objectFit: 'cover' }} />
          )}
        </div>

        {/* Background overlay image upload */}
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-gray-600">Background Overlay</div>
          <p className="text-xs text-gray-400">Image layered over the card (e.g. frame, watermark). Show/hide &amp; drag it from the Elements list.</p>
          <input ref={overlayInputRef} type="file" accept="image/*" className="hidden" onChange={handleOverlayUpload} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => overlayInputRef.current?.click()} className="flex-1 text-xs py-1.5">
              <ImagePlus className="w-3.5 h-3.5 mr-1" /> Upload
            </Button>
            {overlayImage && (
              <Button variant="danger" onClick={() => onUploadOverlay(null)} className="text-xs py-1.5 px-3">
                Remove
              </Button>
            )}
          </div>
          {overlayImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={overlayImage} alt="overlay preview" className="w-full rounded border border-gray-200" style={{ maxHeight: 60, objectFit: 'cover' }} />
          )}
        </div>

        {/* Element list */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 border-b border-gray-200">
            Elements
          </div>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {layout.map(el => (
              <button
                key={el.id}
                onClick={() => setSelectedId(el.id === selectedId ? null : el.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                  el.id === selectedId ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="font-medium truncate">{el.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateElement(el.id, { hidden: !el.style.hidden })
                  }}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  title={el.style.hidden ? 'Show' : 'Hide'}
                >
                  {el.style.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* Selected element properties */}
        {selectedEl && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 border-b border-gray-200">
              {selectedEl.label} — Properties
            </div>
            <div className="p-3 space-y-3">
              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">X</label>
                  <input
                    type="number"
                    value={Math.round(selectedEl.style.x)}
                    onChange={e => onUpdateElement(selectedEl.id, { x: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Y</label>
                  <input
                    type="number"
                    value={Math.round(selectedEl.style.y)}
                    onChange={e => onUpdateElement(selectedEl.id, { y: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>

              {/* Width */}
              {selectedEl.style.width !== undefined && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Width</label>
                  <input
                    type="number"
                    value={selectedEl.style.width}
                    onChange={e => onUpdateElement(selectedEl.id, { width: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                  />
                </div>
              )}

              {/* Height (photo/divider) */}
              {selectedEl.style.height !== undefined && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Height</label>
                  <input
                    type="number"
                    value={selectedEl.style.height}
                    onChange={e => onUpdateElement(selectedEl.id, { height: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                  />
                </div>
              )}

              {/* Text-only properties */}
              {selectedEl.type === 'text' && (
                <>
                  {/* Editable custom text (e.g. validDate) */}
                  {selectedEl.style.customText !== undefined && (
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Text Content</label>
                      <input
                        type="text"
                        value={selectedEl.style.customText}
                        onChange={e => onUpdateElement(selectedEl.id, { customText: e.target.value })}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                        placeholder="e.g. Valid Until: 12/31/2027"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Font Size</label>
                    <input
                      type="number"
                      min={6}
                      max={60}
                      value={selectedEl.style.fontSize ?? 12}
                      onChange={e => onUpdateElement(selectedEl.id, { fontSize: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500">Bold</label>
                    <button
                      onClick={() =>
                        onUpdateElement(selectedEl.id, {
                          fontWeight: selectedEl.style.fontWeight === 'normal' ? '900' : 'normal',
                        })
                      }
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        selectedEl.style.fontWeight !== 'normal'
                          ? 'bg-orange text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      B
                    </button>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedEl.style.color ?? '#111111'}
                        onChange={e => onUpdateElement(selectedEl.id, { color: e.target.value })}
                        className="w-8 h-8 border border-gray-200 rounded cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={selectedEl.style.color ?? '#111111'}
                        onChange={e => onUpdateElement(selectedEl.id, { color: e.target.value })}
                        className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Align</label>
                    <div className="flex gap-1">
                      {(['left', 'center', 'right'] as const).map(align => (
                        <button
                          key={align}
                          onClick={() => onUpdateElement(selectedEl.id, { textAlign: align })}
                          className={`flex-1 py-1 text-xs rounded transition-colors capitalize ${
                            (selectedEl.style.textAlign ?? 'left') === align
                              ? 'bg-orange text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Divider color */}
              {selectedEl.type === 'divider' && (
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Color</label>
                  <input
                    type="color"
                    value={selectedEl.style.color ?? '#111111'}
                    onChange={e => onUpdateElement(selectedEl.id, { color: e.target.value })}
                    className="w-8 h-8 border border-gray-200 rounded cursor-pointer p-0.5"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedEl && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Click an element on the card to edit its properties
          </p>
        )}
      </div>
    </div>
  )
}
