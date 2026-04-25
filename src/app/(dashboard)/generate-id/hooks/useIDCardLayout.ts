'use client'

import { useState, useCallback } from 'react'

export interface ElementStyle {
  x: number
  y: number
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | '900'
  color?: string
  width?: number
  height?: number
  textAlign?: 'left' | 'center' | 'right'
  letterSpacing?: number
  lineHeight?: number
  hidden?: boolean
  customText?: string
}

export type CardElementType = 'text' | 'photo' | 'divider' | 'group' | 'signature'

export interface CardElementLayout {
  id: string
  label: string
  type: CardElementType
  style: ElementStyle
}

// Card dimensions
export const CARD_W = 300
export const CARD_H = 476

export const DEFAULT_FRONT_LAYOUT: CardElementLayout[] = [
  {
    id: 'lastName',
    label: 'Last Name',
    type: 'text',
    style: { x: 22, y: 114, fontSize: 26, fontWeight: '900', color: '#111', lineHeight: 1.1 },
  },
  {
    id: 'firstName',
    label: 'First Name',
    type: 'text',
    style: { x: 22, y: 146, fontSize: 26, fontWeight: '900', color: '#111', lineHeight: 1.15 },
  },
  {
    id: 'divider',
    label: 'Divider Line',
    type: 'divider',
    style: { x: 22, y: 182, width: 140, height: 2, color: '#111' },
  },
  {
    id: 'jobTitle',
    label: 'Job Title',
    type: 'text',
    style: { x: 22, y: 192, fontSize: 12, fontWeight: 'bold', color: '#111', letterSpacing: 0.3, width: 140 },
  },
  {
    id: 'employeeId',
    label: 'Employee ID',
    type: 'text',
    style: { x: 22, y: 210, fontSize: 11, color: '#444', width: 140 },
  },
  {
    id: 'photo',
    label: 'Photo',
    type: 'photo',
    style: { x: 170, y: 224, width: 116, height: 144 },
  },
  {
    id: 'signature',
    label: 'E-Signature',
    type: 'signature',
    style: { x: 22, y: 230, width: 120, height: 40 },
  },
]

export const DEFAULT_BACK_LAYOUT: CardElementLayout[] = [
  {
    id: 'emergencyContact',
    label: 'Emergency Contact',
    type: 'text',
    style: { x: 50, y: 109, fontSize: 13, fontWeight: '900', color: '#111', textAlign: 'center', width: 200 },
  },
  {
    id: 'tinNumber',
    label: 'TIN No.',
    type: 'text',
    style: { x: 75, y: 175, fontSize: 12, color: '#222', textAlign: 'center', width: 150 },
  },
  {
    id: 'sssNumber',
    label: 'SSS No.',
    type: 'text',
    style: { x: 75, y: 193, fontSize: 12, color: '#222', textAlign: 'center', width: 150 },
  },
  {
    id: 'pagibigNumber',
    label: 'PAG-IBIG No.',
    type: 'text',
    style: { x: 75, y: 211, fontSize: 12, color: '#222', textAlign: 'center', width: 150 },
  },
  {
    id: 'philhealthNumber',
    label: 'PhilHealth No.',
    type: 'text',
    style: { x: 75, y: 229, fontSize: 12, color: '#222', textAlign: 'center', width: 150 },
  },
  {
    id: 'birthday',
    label: 'Birthday',
    type: 'text',
    style: { x: 75, y: 247, fontSize: 12, color: '#222', textAlign: 'center', width: 150 },
  },
  {
    id: 'validDate',
    label: 'ID Valid Date',
    type: 'text',
    style: { x: 75, y: 270, fontSize: 12, color: '#222', textAlign: 'center', width: 150, customText: 'Valid Until: MM/DD/YYYY' },
  },
]

const STORAGE_KEY_FRONT = 'id_card_layout_front_v1'
const STORAGE_KEY_BACK = 'id_card_layout_back_v1'
const STORAGE_KEY_BG_FRONT = 'id_card_bg_front_v1'
const STORAGE_KEY_BG_BACK = 'id_card_bg_back_v1'

function loadBg(key: string): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(key) } catch { return null }
}

function loadLayout(key: string, defaults: CardElementLayout[]): CardElementLayout[] {
  if (typeof window === 'undefined') return defaults
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      const parsed = JSON.parse(saved) as CardElementLayout[]
      // Merge: keep saved positions/styles, but add any new default elements missing from saved layout
      const savedIds = new Set(parsed.map(el => el.id))
      const missing = defaults.filter(el => !savedIds.has(el.id))
      return [...parsed, ...missing]
    }
  } catch {}
  return defaults
}

export function useIDCardLayout() {
  const [frontLayout, setFrontLayout] = useState<CardElementLayout[]>(() =>
    loadLayout(STORAGE_KEY_FRONT, DEFAULT_FRONT_LAYOUT)
  )
  const [backLayout, setBackLayout] = useState<CardElementLayout[]>(() =>
    loadLayout(STORAGE_KEY_BACK, DEFAULT_BACK_LAYOUT)
  )
  const [bgFront, setBgFront] = useState<string | null>(() => loadBg(STORAGE_KEY_BG_FRONT))
  const [bgBack, setBgBack] = useState<string | null>(() => loadBg(STORAGE_KEY_BG_BACK))

  const setCustomBg = useCallback((side: 'front' | 'back', dataUrl: string | null) => {
    if (side === 'front') {
      setBgFront(dataUrl)
      if (dataUrl) localStorage.setItem(STORAGE_KEY_BG_FRONT, dataUrl)
      else localStorage.removeItem(STORAGE_KEY_BG_FRONT)
    } else {
      setBgBack(dataUrl)
      if (dataUrl) localStorage.setItem(STORAGE_KEY_BG_BACK, dataUrl)
      else localStorage.removeItem(STORAGE_KEY_BG_BACK)
    }
  }, [])

  const updateElement = useCallback(
    (side: 'front' | 'back', id: string, patch: Partial<ElementStyle>) => {
      const setter = side === 'front' ? setFrontLayout : setBackLayout
      setter(prev =>
        prev.map(el => el.id === id ? { ...el, style: { ...el.style, ...patch } } : el)
      )
    },
    []
  )

  const saveLayout = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_FRONT, JSON.stringify(frontLayout))
    localStorage.setItem(STORAGE_KEY_BACK, JSON.stringify(backLayout))
  }, [frontLayout, backLayout])

  const resetLayout = useCallback(() => {
    setFrontLayout(DEFAULT_FRONT_LAYOUT)
    setBackLayout(DEFAULT_BACK_LAYOUT)
    setBgFront(null)
    setBgBack(null)
    localStorage.removeItem(STORAGE_KEY_FRONT)
    localStorage.removeItem(STORAGE_KEY_BACK)
    localStorage.removeItem(STORAGE_KEY_BG_FRONT)
    localStorage.removeItem(STORAGE_KEY_BG_BACK)
  }, [])

  return { frontLayout, backLayout, bgFront, bgBack, setCustomBg, updateElement, saveLayout, resetLayout }
}
