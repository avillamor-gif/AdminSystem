'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import toast from 'react-hot-toast'

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

interface CataloguePub {
  id: string
  publication_id: string
  publication_title: string
  publication_type: string
  publisher: string | null
  isbn: string | null
  quantity: number
  total_printed: number | null
}

export default function RequestPublicationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const publicationIdParam = searchParams.get('publication_id')
  const { data: currentEmployee } = useCurrentEmployee()

  const [catalogue, setCatalogue] = useState<CataloguePub[]>([])
  const [loadingCatalogue, setLoadingCatalogue] = useState(true)

  const [pubSearch, setPubSearch] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedPub, setSelectedPub] = useState<CataloguePub | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [quantity, setQuantity] = useState(1)
  const [purpose, setPurpose] = useState('')
  const [urgency, setUrgency] = useState('medium')
  const [deadline, setDeadline] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load catalogue directly from Supabase
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('publication_requests')
        .select('id, publication_id, publication_title, publication_type, publisher, isbn, quantity, notes')
        .eq('request_type', 'catalogue')
        .eq('status', 'approved')
        .order('publication_title', { ascending: true })

      if (error) { console.error('Failed to load catalogue:', error); setLoadingCatalogue(false); return }

      const parsed: CataloguePub[] = (data ?? []).map((r: any) => {
        const totalMatch = (r.notes ?? '').match(/^Total Printed:\s*(\d+)/m)
        return {
          id: r.id,
          publication_id: r.publication_id,
          publication_title: r.publication_title,
          publication_type: r.publication_type ?? 'other',
          publisher: r.publisher,
          isbn: r.isbn,
          quantity: r.quantity ?? 0,
          total_printed: totalMatch ? Number(totalMatch[1]) : null,
        }
      })

      setCatalogue(parsed)
      setLoadingCatalogue(false)

      if (publicationIdParam) {
        const match = parsed.find(p => p.publication_id === publicationIdParam)
        if (match) { setSelectedPub(match); setPubSearch(match.publication_title) }
      }
    }
    load()
  }, [publicationIdParam])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredCatalogue = pubSearch && !selectedPub
    ? catalogue.filter(p => p.publication_title.toLowerCase().includes(pubSearch.toLowerCase()))
    : catalogue

  const selectPub = (pub: CataloguePub) => {
    setSelectedPub(pub); setPubSearch(pub.publication_title); setQuantity(1); setDropdownOpen(false)
  }

  const clearPub = () => {
    setSelectedPub(null); setPubSearch(''); setQuantity(1); setDropdownOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPub) { toast.error('Please select a publication'); return }
    if (!purpose.trim()) { toast.error('Purpose is required'); return }
    if ((selectedPub.quantity ?? 0) === 0) { toast.error('No copies available'); return }
    if (!currentEmployee?.id) { toast.error('Could not identify your employee record. Please refresh.'); return }

    setSubmitting(true)
    const supabase = createClient()

    const requestNumber = `REQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`

    const { error: createError } = await supabase
      .from('publication_requests')
      .insert({
        request_number: requestNumber,
        employee_id: currentEmployee.id,
        publication_id: selectedPub.publication_id,
        publication_title: selectedPub.publication_title,
        publication_type: selectedPub.publication_type,
        publisher: selectedPub.publisher ?? null,
        isbn: selectedPub.isbn ?? null,
        quantity: quantity,
        purpose: purpose.trim(),
        notes: notes.trim() || null,
        deadline: deadline || null,
        priority: urgency,
        request_type: 'copy',
        status: 'submitted',
      })

    if (createError) {
      console.error('Create request error:', createError)
      toast.error(`Failed to submit: ${createError.message}`)
      setSubmitting(false)
      return
    }

    // Deduct from catalogue inventory
    const { error: updateError } = await supabase
      .from('publication_requests')
      .update({ quantity: Math.max(0, selectedPub.quantity - quantity), updated_at: new Date().toISOString() })
      .eq('id', selectedPub.id)

    if (updateError) {
      console.error('Inventory update error:', updateError)
      toast.error('Request saved but inventory could not be updated. Please notify admin.')
    } else {
      toast.success('Request submitted successfully!')
    }

    setSubmitting(false)
    router.push('/publications/my-requests')
  }

  const availableQty = selectedPub?.quantity ?? 0
  const remainingQty = Math.max(0, availableQty - quantity)
  const totalPrinted = selectedPub?.total_printed ?? null
  const isLowStock = totalPrinted && totalPrinted > 0 ? remainingQty / totalPrinted <= 0.2 : remainingQty <= 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Publication</h1>
        <p className="text-gray-600 mt-1">Submit a request to receive a copy of a publication from the library</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Publication Information</h2>
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Select Publication 60% */}
            <div className="sm:w-[60%]" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Publication *</label>
              <div className="relative">
                <input
                  type="text"
                  value={pubSearch}
                  onChange={e => { setPubSearch(e.target.value); setSelectedPub(null); setDropdownOpen(true); setQuantity(1) }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder={loadingCatalogue ? 'Loading publications...' : 'Type to search...'}
                  disabled={loadingCatalogue}
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
                {selectedPub
                  ? <button type="button" onClick={clearPub} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  : <svg className="w-4 h-4 absolute right-2.5 top-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                }
                {dropdownOpen && !loadingCatalogue && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {filteredCatalogue.length === 0
                      ? <li className="px-3 py-3 text-sm text-gray-400">No publications found</li>
                      : filteredCatalogue.map(pub => (
                          <li
                            key={pub.id}
                            onMouseDown={() => selectPub(pub)}
                            className={`px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between gap-2 ${
                              selectedPub?.id === pub.id ? 'bg-orange-50 text-orange-800 font-medium' : 'hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <span>
                              {pub.publication_title}
                              <span className="ml-2 text-xs text-gray-400 capitalize">({pub.publication_type})</span>
                            </span>
                            <span className={`text-xs font-medium shrink-0 ${pub.quantity === 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {pub.quantity === 0 ? 'Out of stock' : `${pub.quantity} avail.`}
                            </span>
                          </li>
                        ))
                    }
                  </ul>
                )}
              </div>
              {selectedPub && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  {selectedPub.publisher && <span>Publisher: <strong>{selectedPub.publisher}</strong></span>}
                  {selectedPub.isbn && <span>ISBN: <strong>{selectedPub.isbn}</strong></span>}
                </div>
              )}
            </div>

            {/* Qty Available 20% */}
            <div className="sm:w-[20%]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Copy</label>
              <input
                readOnly
                value={selectedPub ? remainingQty : ''}
                placeholder="—"
                className={`w-full border rounded-md px-3 py-2.5 text-sm cursor-not-allowed ${
                  !selectedPub ? 'bg-gray-50 border-gray-200 text-gray-400' :
                  remainingQty === 0 ? 'bg-red-50 border-red-300 text-red-600 font-semibold' :
                  isLowStock ? 'bg-orange-50 border-orange-300 text-orange-600 font-semibold' :
                  'bg-gray-50 border-gray-200 text-gray-700 font-medium'
                }`}
              />
              {selectedPub && remainingQty === 0 && quantity > 0 && <p className="text-xs text-red-500 mt-1">Will empty stock</p>}
            </div>

            {/* Request Copy 20% */}
            <div className="sm:w-[20%]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Copy *</label>
              <input
                type="number"
                min={1}
                max={availableQty || 1}
                value={quantity}
                onChange={e => setQuantity(Math.min(Math.max(1, Number(e.target.value)), availableQty || 1))}
                disabled={!selectedPub || availableQty === 0}
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Request Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <textarea
                required
                rows={4}
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Describe why you need this publication..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required By</label>
                <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional information..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700"
            disabled={submitting || !selectedPub || availableQty === 0}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  )
}
