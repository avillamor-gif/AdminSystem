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

export type CardElementType = 'text' | 'photo' | 'divider' | 'group' | 'signature' | 'overlay'

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
    style: { x: 22, y: 114, fontSize: 26, fontWeight: '900', color: '#111', lineHeight: 1.1, width: 256 },
  },
  {
    id: 'firstName',
    label: 'First Name',
    type: 'text',
    style: { x: 22, y: 146, fontSize: 26, fontWeight: '900', color: '#111', lineHeight: 1.15, width: 256 },
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
  {
    id: 'overlay',
    label: 'Background Overlay',
    type: 'overlay',
    style: { x: 0, y: 0, width: CARD_W, height: CARD_H },
  },
]

export const DEFAULT_BACK_LAYOUT: CardElementLayout[] = [
  {
    id: 'emergencyContact',
    label: 'Emergency Contact',
    type: 'text',
    style: { x: 30, y: 109, fontSize: 13, fontWeight: '900', color: '#111', textAlign: 'center', width: 240 },
  },
  {
    id: 'tinNumber',
    label: 'TIN No.',
    type: 'text',
    style: { x: 40, y: 175, fontSize: 12, color: '#222', textAlign: 'center', width: 220 },
  },
  {
    id: 'sssNumber',
    label: 'SSS No.',
    type: 'text',
    style: { x: 40, y: 193, fontSize: 12, color: '#222', textAlign: 'center', width: 220 },
  },
  {
    id: 'pagibigNumber',
    label: 'PAG-IBIG No.',
    type: 'text',
    style: { x: 40, y: 211, fontSize: 12, color: '#222', textAlign: 'center', width: 220 },
  },
  {
    id: 'philhealthNumber',
    label: 'PhilHealth No.',
    type: 'text',
    style: { x: 40, y: 229, fontSize: 12, color: '#222', textAlign: 'center', width: 220 },
  },
  {
    id: 'birthday',
    label: 'Birthday',
    type: 'text',
    style: { x: 40, y: 247, fontSize: 12, color: '#222', textAlign: 'center', width: 220 },
  },
  {
    id: 'validDate',
    label: 'ID Valid Date',
    type: 'text',
    style: { x: 40, y: 270, fontSize: 12, color: '#222', textAlign: 'center', width: 220, customText: 'Valid Until: MM/DD/YYYY' },
  },
  {
    id: 'overlay',
    label: 'Background Overlay',
    type: 'overlay',
    style: { x: 0, y: 0, width: CARD_W, height: CARD_H },
  },
]

const STORAGE_KEY_FRONT = 'id_card_layout_front_v2'
const STORAGE_KEY_BACK = 'id_card_layout_back_v2'
const STORAGE_KEY_BG_GALLERY_FRONT = 'id_card_bg_gallery_front_v1'
const STORAGE_KEY_BG_GALLERY_BACK = 'id_card_bg_gallery_back_v1'
const STORAGE_KEY_OVERLAY_FRONT = 'id_card_overlay_front_v1'
const STORAGE_KEY_OVERLAY_BACK = 'id_card_overlay_back_v1'

export interface BgGallery {
  images: string[]
  selectedIndex: number
}

const DEFAULT_GALLERY: BgGallery = { images: [], selectedIndex: 0 }

function loadBg(key: string): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(key) } catch { return null }
}

function loadGallery(key: string): BgGallery {
  if (typeof window === 'undefined') return DEFAULT_GALLERY
  try {
    const saved = localStorage.getItem(key)
    if (saved) return JSON.parse(saved) as BgGallery
  } catch {}
  return DEFAULT_GALLERY
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
  const [bgGalleryFront, setBgGalleryFront] = useState<BgGallery>(() => loadGallery(STORAGE_KEY_BG_GALLERY_FRONT))
  const [bgGalleryBack, setBgGalleryBack] = useState<BgGallery>(() => loadGallery(STORAGE_KEY_BG_GALLERY_BACK))
  const [overlayFront, setOverlayFront] = useState<string | null>(() => loadBg(STORAGE_KEY_OVERLAY_FRONT))
  const [overlayBack, setOverlayBack] = useState<string | null>(() => loadBg(STORAGE_KEY_OVERLAY_BACK))

  // Derived active bg per side
  const bgFront = bgGalleryFront.images[bgGalleryFront.selectedIndex] ?? null
  const bgBack  = bgGalleryBack.images[bgGalleryBack.selectedIndex] ?? null

  const saveGallery = useCallback((key: string, gallery: BgGallery) => {
    localStorage.setItem(key, JSON.stringify(gallery))
  }, [])

  const addBg = useCallback((side: 'front' | 'back', dataUrl: string) => {
    const key = side === 'front' ? STORAGE_KEY_BG_GALLERY_FRONT : STORAGE_KEY_BG_GALLERY_BACK
    const setter = side === 'front' ? setBgGalleryFront : setBgGalleryBack
    setter(prev => {
      const next: BgGallery = { images: [...prev.images, dataUrl], selectedIndex: prev.images.length }
      saveGallery(key, next)
      return next
    })
  }, [saveGallery])

  const selectBg = useCallback((side: 'front' | 'back', index: number) => {
    const key = side === 'front' ? STORAGE_KEY_BG_GALLERY_FRONT : STORAGE_KEY_BG_GALLERY_BACK
    const setter = side === 'front' ? setBgGalleryFront : setBgGalleryBack
    setter(prev => {
      const next: BgGallery = { ...prev, selectedIndex: index }
      saveGallery(key, next)
      return next
    })
  }, [saveGallery])

  const removeBg = useCallback((side: 'front' | 'back', index: number) => {
    const key = side === 'front' ? STORAGE_KEY_BG_GALLERY_FRONT : STORAGE_KEY_BG_GALLERY_BACK
    const setter = side === 'front' ? setBgGalleryFront : setBgGalleryBack
    setter(prev => {
      const images = prev.images.filter((_, i) => i !== index)
      const selectedIndex = Math.min(prev.selectedIndex, Math.max(0, images.length - 1))
      const next: BgGallery = { images, selectedIndex }
      saveGallery(key, next)
      return next
    })
  }, [saveGallery])

  const setCustomOverlay = useCallback((side: 'front' | 'back', dataUrl: string | null) => {
    if (side === 'front') {
      setOverlayFront(dataUrl)
      if (dataUrl) localStorage.setItem(STORAGE_KEY_OVERLAY_FRONT, dataUrl)
      else localStorage.removeItem(STORAGE_KEY_OVERLAY_FRONT)
    } else {
      setOverlayBack(dataUrl)
      if (dataUrl) localStorage.setItem(STORAGE_KEY_OVERLAY_BACK, dataUrl)
      else localStorage.removeItem(STORAGE_KEY_OVERLAY_BACK)
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
    setBgGalleryFront(DEFAULT_GALLERY)
    setBgGalleryBack(DEFAULT_GALLERY)
    setOverlayFront(null)
    setOverlayBack(null)
    localStorage.removeItem(STORAGE_KEY_FRONT)
    localStorage.removeItem(STORAGE_KEY_BACK)
    localStorage.removeItem(STORAGE_KEY_BG_GALLERY_FRONT)
    localStorage.removeItem(STORAGE_KEY_BG_GALLERY_BACK)
    localStorage.removeItem(STORAGE_KEY_OVERLAY_FRONT)
    localStorage.removeItem(STORAGE_KEY_OVERLAY_BACK)
  }, [])

  return {
    frontLayout, backLayout,
    bgFront, bgBack,
    bgGalleryFront, bgGalleryBack,
    addBg, selectBg, removeBg,
    overlayFront, overlayBack, setCustomOverlay,
    updateElement, saveLayout, resetLayout,
  }
}
