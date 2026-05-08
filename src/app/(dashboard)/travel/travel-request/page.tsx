'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Send, AlertTriangle, Plus, Trash2, BookOpen, Route, Wrench, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useCreateTravelRequest, useSubmitTravelRequest, useUpdateTravelRequest } from '@/hooks/useTravel'
import { useCurrentEmployee } from '@/hooks/useEmployees'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────

interface DestinationRow {
  date_from: string
  date_to: string
  destination: string
  purpose: string
  importance_of_participation: string
  hotel_provided: boolean
  activity_funded: boolean
  activity_funded_by: string
}

interface ItineraryLeg {
  date: string
  from_location: string
  to_location: string
  departure_time: string
  arrival_time: string
  is_official: boolean
  funded_by: string
}

interface CataloguePub {
  id: string
  publication_id: string
  publication_title: string
  publication_type: string
  publisher: string | null
  available_copies: number
  est_weight_kg: number | null
}

interface PublicationRow {
  // search state
  search: string
  dropdownOpen: boolean
  // selected catalogue entry
  publication_id: string
  title: string
  publisher: string
  available_copies: number
  // user input
  unit_weight_kg: string   // weight per single copy (from catalogue)
  est_weight_kg: string    // total weight = unit_weight_kg × request_copies
  request_copies: string
}

interface CatalogueAsset {
  id: string
  name: string
  asset_tag: string | null
  category: string
  model: string | null
  status: string
}

interface EquipmentRow {
  // search state
  search: string
  dropdownOpen: boolean
  // selected asset
  asset_id: string
  asset_name: string
  asset_tag: string
  category: string
  model: string
  // user input
  expected_return_date: string
  purpose: string
}

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  estimated_cost: z.coerce.number().min(0, 'Cost must be a positive number'),
  currency: z.string().default('PHP'),
  budget_code: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = ['PHP', 'USD', 'EUR', 'SGD', 'JPY']

const emptyDestination = (): DestinationRow => ({
  date_from: '', date_to: '', destination: '', purpose: '', importance_of_participation: '', hotel_provided: false, activity_funded: false, activity_funded_by: ''
})
const emptyLeg = (): ItineraryLeg => ({
  date: '', from_location: '', to_location: '', departure_time: '', arrival_time: '',
  is_official: true, funded_by: ''
})
const emptyPublication = (): PublicationRow => ({
  search: '', dropdownOpen: false,
  publication_id: '', title: '', publisher: '', available_copies: 0, unit_weight_kg: '', est_weight_kg: '', request_copies: '1',
})
const emptyEquipment = (): EquipmentRow => ({
  search: '', dropdownOpen: false,
  asset_id: '', asset_name: '', asset_tag: '', category: '', model: '',
  expected_return_date: '', purpose: '',
})

// ── Component ────────────────────────────────────────────────────────────────

export default function NewTravelRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('id')
  const { data: currentEmployee } = useCurrentEmployee()
  const createMutation = useCreateTravelRequest()
  const updateMutation = useUpdateTravelRequest()
  const submitMutation = useSubmitTravelRequest()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [budgetPlanFile, setBudgetPlanFile] = useState<File | null>(null)
  const [budgetPlanUploading, setBudgetPlanUploading] = useState(false)
  const [existingDraftId, setExistingDraftId] = useState<string | null>(draftId)

  // Destination rows
  const [destinationRows, setDestinationRows] = useState<DestinationRow[]>([emptyDestination()])
  // Travel itinerary legs
  const [itineraryLegs, setItineraryLegs] = useState<ItineraryLeg[]>([emptyLeg()])
  // Publications requested
  const [publications, setPublications] = useState<PublicationRow[]>([emptyPublication()])
  const [catalogue, setCatalogue] = useState<CataloguePub[]>([])
  const pubDropdownRefs = useRef<(HTMLDivElement | null)[]>([])

  // Load existing draft if ?id= is provided
  useEffect(() => {
    if (!draftId) return
    async function loadDraft() {
      const supabase = createClient()
      const { data } = await supabase.from('travel_requests').select('*').eq('id', draftId).single()
      if (!data) return
      // Restore form values
      setValue('estimated_cost', data.estimated_cost ?? 0)
      setValue('currency', data.currency ?? 'PHP')
      setValue('budget_code', data.budget_code ?? '')
      // Restore JSONB arrays
      if (Array.isArray(data.destinations_detail) && data.destinations_detail.length > 0) {
        setDestinationRows(data.destinations_detail.map((d: any) => ({
          date_from: d.dates?.split('–')[0]?.trim() ?? '',
          date_to: d.dates?.split('–')[1]?.trim() ?? '',
          destination: d.destination ?? '',
          purpose: d.purpose ?? '',
          hotel_provided: d.hotel_provided ?? false,
          activity_funded: d.activity_funded ?? false,
          activity_funded_by: d.activity_funded_by ?? '',
        })))
      }
      if (Array.isArray(data.itinerary) && data.itinerary.length > 0) {
        setItineraryLegs(data.itinerary.map((l: any) => ({
          date: l.date ?? '',
          from_location: l.from_location ?? '',
          to_location: l.to_location ?? '',
          departure_time: l.departure_time ?? '',
          arrival_time: l.arrival_time ?? '',
          is_official: l.is_official ?? true,
          funded_by: l.funded_by ?? '',
        })))
      }
      if (Array.isArray(data.publications_requested) && data.publications_requested.length > 0) {
        setPublications(data.publications_requested.map((p: any) => ({
          ...emptyPublication(),
          publication_id: p.publication_id ?? '',
          title: p.title ?? '',
          publisher: p.publisher ?? '',
          available_copies: p.available_copies ?? 0,
          unit_weight_kg: p.unit_weight_kg != null ? String(p.unit_weight_kg) : '',
          est_weight_kg: String(p.est_weight_kg ?? ''),
          request_copies: String(p.request_copies ?? 1),
          search: p.title ?? '',
        })))
      }
      if (Array.isArray(data.equipment_requested) && data.equipment_requested.length > 0) {
        setEquipmentRows(data.equipment_requested.map((r: any) => ({
          ...emptyEquipment(),
          asset_id: r.asset_id ?? '',
          asset_name: r.asset_name ?? '',
          asset_tag: r.asset_tag ?? '',
          category: r.category ?? '',
          model: r.model ?? '',
          expected_return_date: r.expected_return_date ?? '',
          purpose: r.purpose ?? '',
          search: r.asset_name ?? '',
        })))
      }
    }
    loadDraft()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId])

  // Load publication catalogue once
  useEffect(() => {
    async function loadCatalogue() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('publication_requests')
        .select('id, publication_id, publication_title, publication_type, publisher, quantity, est_weight_kg')
        .eq('request_type', 'catalogue')
        .eq('status', 'approved')
        .order('publication_title', { ascending: true })
      if (error || !data) return
      setCatalogue(
        data.map((r: any) => ({
          id: r.id,
          publication_id: r.publication_id ?? r.id,
          publication_title: r.publication_title,
          publication_type: r.publication_type ?? 'other',
          publisher: r.publisher ?? null,
          available_copies: r.quantity ?? 0,
          est_weight_kg: r.est_weight_kg ?? null,
        }))
      )
    }
    loadCatalogue()
  }, [])

  // Close any open publication dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      pubDropdownRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target as Node)) {
          setPublications(prev => prev.map((p, idx) => idx === i ? { ...p, dropdownOpen: false } : p))
        }
      })
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Equipment requested
  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([emptyEquipment()])
  const [assetCatalogue, setAssetCatalogue] = useState<CatalogueAsset[]>([])
  const equipDropdownRefs = useRef<(HTMLDivElement | null)[]>([])

  // Load available assets once
  useEffect(() => {
    async function loadAssets() {
      const supabase = createClient()
      const { data: assets, error } = await supabase
        .from('assets')
        .select('id, name, asset_tag, model, status, category_id')
        .eq('status', 'available')
        .order('name', { ascending: true })
      if (error || !assets) return
      const categoryIds = [...new Set(assets.map((a: any) => a.category_id).filter(Boolean))]
      let categoryMap: Record<string, string> = {}
      if (categoryIds.length > 0) {
        const { data: cats } = await supabase
          .from('asset_categories')
          .select('id, name')
          .in('id', categoryIds)
        if (cats) categoryMap = Object.fromEntries(cats.map((c: any) => [c.id, c.name]))
      }
      setAssetCatalogue(
        assets.map((a: any) => ({
          id: a.id,
          name: a.name,
          asset_tag: a.asset_tag ?? null,
          category: a.category_id ? categoryMap[a.category_id] ?? '' : '',
          model: a.model ?? null,
          status: a.status,
        }))
      )
    }
    loadAssets()
  }, [])

  // Close any open equipment dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      equipDropdownRefs.current.forEach((ref, i) => {
        if (ref && !ref.contains(e.target as Node)) {
          setEquipmentRows(prev => prev.map((r, idx) => idx === i ? { ...r, dropdownOpen: false } : r))
        }
      })
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency: 'PHP',
    },
  })

  // ── Destination row helpers ──
  const updateDestRow = (i: number, field: keyof DestinationRow, val: string | boolean) =>
    setDestinationRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  // ── Itinerary leg helpers ──
  const updateLeg = (i: number, field: keyof ItineraryLeg, val: string | boolean) =>
    setItineraryLegs(legs => legs.map((l, idx) => idx === i ? { ...l, [field]: val } : l))

  // ── Publication row helpers ──
  const updatePub = (i: number, field: keyof PublicationRow, val: string | number | boolean) =>
    setPublications(pubs => pubs.map((p, idx) => idx === i ? { ...p, [field]: val } : p))

  const selectCataloguePub = (i: number, pub: CataloguePub) =>
    setPublications(pubs => pubs.map((p, idx) => idx === i ? {
      ...p,
      publication_id: pub.publication_id,
      title: pub.publication_title,
      publisher: pub.publisher ?? '',
      available_copies: pub.available_copies,
      unit_weight_kg: pub.est_weight_kg != null ? String(pub.est_weight_kg) : '',
      est_weight_kg: pub.est_weight_kg != null ? String(pub.est_weight_kg) : '',
      search: pub.publication_title,
      dropdownOpen: false,
      request_copies: '1',
    } : p))

  const clearCataloguePub = (i: number) =>
    setPublications(pubs => pubs.map((p, idx) => idx === i ? {
      ...emptyPublication(), dropdownOpen: true,
    } : p))

  // ── Equipment row helpers ──
  const updateEquip = (i: number, field: keyof EquipmentRow, val: string | boolean) =>
    setEquipmentRows(rows => rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const selectCatalogueAsset = (i: number, asset: CatalogueAsset) =>
    setEquipmentRows(rows => rows.map((r, idx) => idx === i ? {
      ...r,
      asset_id: asset.id,
      asset_name: asset.name,
      asset_tag: asset.asset_tag ?? '',
      category: asset.category,
      model: asset.model ?? '',
      search: asset.name,
      dropdownOpen: false,
    } : r))

  const clearCatalogueAsset = (i: number) =>
    setEquipmentRows(rows => rows.map((r, idx) => idx === i ? {
      ...emptyEquipment(), dropdownOpen: true,
    } : r))

  // ── Build payload ──
  const buildPayload = (data: FormData) => ({
    employee_id: currentEmployee!.id,
    estimated_cost: data.estimated_cost,
    currency: data.currency,
    budget_code: data.budget_code || null,
    destination: destinationRows.find(r => r.destination.trim())?.destination || null,
    destinations_detail: destinationRows
      .filter(r => r.destination.trim())
      .map(r => ({
        dates: r.date_from && r.date_to ? `${r.date_from} – ${r.date_to}` : (r.date_from || r.date_to || ''),
        destination: r.destination,
        purpose: r.purpose,
        hotel_provided: r.hotel_provided,
        activity_funded: r.activity_funded,
        activity_funded_by: r.activity_funded_by,
      })),
    itinerary: itineraryLegs.filter(l => l.from_location.trim() || l.to_location.trim()),
    publications_requested: publications
      .filter(p => p.publication_id)
      .map(p => ({
        publication_id: p.publication_id,
        title: p.title,
        publisher: p.publisher,
        available_copies: p.available_copies,
        unit_weight_kg: parseFloat(p.unit_weight_kg) || null,
        est_weight_kg: (() => { const u = parseFloat(p.unit_weight_kg); const c = Number(p.request_copies) || 1; return !isNaN(u) && u > 0 ? u * c : (parseFloat(p.est_weight_kg) || null) })(),
        request_copies: Number(p.request_copies) || 1,
      })),
    equipment_requested: equipmentRows
      .filter(r => r.asset_id || r.search.trim())
      .map(r => ({
        asset_id: r.asset_id || null,
        asset_name: r.asset_name || r.search,
        asset_tag: r.asset_tag || null,
        category: r.category || null,
        model: r.model || null,
        expected_return_date: r.expected_return_date || null,
        purpose: r.purpose,
      })),
  })

  const uploadBudgetPlan = async (travelRequestId: string, requestNumber: string) => {
    if (!budgetPlanFile || !currentEmployee) return
    setBudgetPlanUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', budgetPlanFile)
      fd.append('travelRequestId', travelRequestId)
      fd.append('requestNumber', requestNumber)
      fd.append('employeeName', `${currentEmployee.first_name} ${currentEmployee.last_name}`)
      const res = await fetch('/api/travel/upload-budget-plan', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        console.error('Budget plan upload failed:', err)
      }
    } finally {
      setBudgetPlanUploading(false)
    }
  }

  const onSaveDraft = async () => {
    if (!currentEmployee) return
    setSubmitError(null)
    // Use getValues() to bypass Zod validation — drafts can have incomplete data
    const raw = getValues()
    const draftData: FormData = {
      estimated_cost: Number(raw.estimated_cost) || 0,
      currency: raw.currency || 'PHP',
      budget_code: raw.budget_code,
    }
    try {
      let savedId: string
      let savedNumber: string
      if (existingDraftId) {
        // Update existing draft
        const updated = await updateMutation.mutateAsync({ id: existingDraftId, updates: buildPayload(draftData) as any })
        savedId = existingDraftId
        savedNumber = (updated as any).request_number ?? ''
      } else {
        const created = await createMutation.mutateAsync(buildPayload(draftData))
        savedId = created.id
        savedNumber = created.request_number ?? ''
        setExistingDraftId(savedId)
      }
      await uploadBudgetPlan(savedId, savedNumber)
      router.push('/travel/my-requests')
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to save draft. Please try again.')
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!currentEmployee) return
    setSubmitError(null)
    try {
      let savedId: string
      let savedNumber: string
      if (existingDraftId) {
        const updated = await updateMutation.mutateAsync({ id: existingDraftId, updates: buildPayload(data) as any })
        savedId = existingDraftId
        savedNumber = (updated as any).request_number ?? ''
      } else {
        const created = await createMutation.mutateAsync(buildPayload(data))
        savedId = created.id
        savedNumber = created.request_number ?? ''
      }
      await uploadBudgetPlan(savedId, savedNumber)
      await submitMutation.mutateAsync({
        id: savedId,
        employeeId: currentEmployee.id,
        employeeName: `${currentEmployee.first_name} ${currentEmployee.last_name}`,
        department: (currentEmployee as any).department?.name ?? undefined,
      })
      router.push('/travel/my-requests')
    } catch (e: any) {
      setSubmitError(e?.message ?? 'Failed to submit request. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Travel Request</h1>
          <p className="text-gray-600 mt-1">Submit a business travel authorization request for approval</p>
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {submitError}
        </div>
      )}

      <form className="space-y-6">

        {/* ── Section 1: Destinations & Purposes Table ────────────────────── */}
        <Card>
          <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                Travel Authorization
              </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Name of Traveler */}
            <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
              <label className="block text-sm font-medium text-orange-700 mb-1">Name of Traveler</label>
              <input
                className="w-full border border-orange-200 rounded-md px-3 py-2.5 text-sm bg-white font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name}` : ''}
                readOnly
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                The above person is authorized to travel for the following dates, destinations and purposes.
              </p>
              <button
                type="button"
                onClick={() => setDestinationRows(r => [...r, emptyDestination()])}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium shrink-0 ml-4"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            {destinationRows.map((row, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                {destinationRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDestinationRows(r => r.filter((_, idx) => idx !== i))}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Row 1 — Date(s), Destination, Purpose */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date(s)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        value={row.date_from}
                        onChange={e => updateDestRow(i, 'date_from', e.target.value)}
                      />
                      <span className="text-gray-400 shrink-0">–</span>
                      <input
                        type="date"
                        className="w-1/2 border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        min={row.date_from || undefined}
                        value={row.date_to}
                        onChange={e => updateDestRow(i, 'date_to', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Manila"
                      value={row.destination}
                      onChange={e => updateDestRow(i, 'destination', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose(s)</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Board Meeting"
                      value={row.purpose}
                      onChange={e => updateDestRow(i, 'purpose', e.target.value)}
                    />
                  </div>
                </div>

                {/* Importance of Participation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Importance of Participation</label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Describe the importance of this participation..."
                    value={row.importance_of_participation ?? ''}
                    onChange={e => updateDestRow(i, 'importance_of_participation', e.target.value)}
                  />
                </div>

                {/* Row 2 — Hotel Provided, Activity Funded, Who Funds */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Provided?</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={row.hotel_provided ? 'Y' : 'N'}
                      onChange={e => updateDestRow(i, 'hotel_provided', e.target.value === 'Y')}
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Activity Funded?</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={row.activity_funded ? 'Y' : 'N'}
                      onChange={e => updateDestRow(i, 'activity_funded', e.target.value === 'Y')}
                    >
                      <option value="Y">Yes</option>
                      <option value="N">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Who Funds?</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g. IIA / Personal"
                      value={row.activity_funded_by}
                      onChange={e => updateDestRow(i, 'activity_funded_by', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Section 3: Travel Itinerary (Flight Reference) ───────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Route className="w-4 h-4 text-orange-500" />
                Travel Itinerary
              </CardTitle>
              <button
                type="button"
                onClick={() => setItineraryLegs(l => [...l, emptyLeg()])}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Leg
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Reference for flight bookings — list each transport leg.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {itineraryLegs.map((leg, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                {itineraryLegs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItineraryLegs(l => l.filter((_, idx) => idx !== i))}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Row 1 — Date, From, To, Departure, Arrival */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      type="date"
                      value={leg.date}
                      onChange={e => updateLeg(i, 'date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Davao"
                      value={leg.from_location}
                      onChange={e => updateLeg(i, 'from_location', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Manila"
                      value={leg.to_location}
                      onChange={e => updateLeg(i, 'to_location', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      type="time"
                      value={leg.departure_time}
                      onChange={e => updateLeg(i, 'departure_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      type="time"
                      value={leg.arrival_time}
                      onChange={e => updateLeg(i, 'arrival_time', e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 2 — Official or Personal, Who Funds Airfare */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Official or Personal</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      value={leg.is_official ? 'official' : 'personal'}
                      onChange={e => updateLeg(i, 'is_official', e.target.value === 'official')}
                    >
                      <option value="official">Official</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Who Funds Airfare</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g. IIA / Personal"
                      value={leg.funded_by}
                      onChange={e => updateLeg(i, 'funded_by', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Section 4: Books / Publications ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-500" />
                Request for Books / Publications for the Activity
              </CardTitle>
              <button
                type="button"
                onClick={() => setPublications(p => [...p, emptyPublication()])}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Publication
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Search and select from the publications catalogue. Copies available are shown from current catalogue stock.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {publications.map((pub, i) => {
              const filteredCatalogue = pub.search && !pub.publication_id
                ? catalogue.filter(c => c.publication_title.toLowerCase().includes(pub.search.toLowerCase()))
                : catalogue
              const availableQty = pub.available_copies
              const requestedQty = Number(pub.request_copies) || 0
              const remainingQty = Math.max(0, availableQty - requestedQty)
              const isLowStock = availableQty > 0 && remainingQty / availableQty <= 0.2
              return (
                <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-4 relative">
                  {publications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPublications(p => p.filter((_, idx) => idx !== i))}
                      className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Select Publication — matches /publications/request exactly */}
                  <div ref={el => { pubDropdownRefs.current[i] = el }}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Publication *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={pub.search}
                        onChange={e => {
                          const val = e.target.value
                          setPublications(prev => prev.map((p, idx) =>
                            idx === i
                              ? { ...emptyPublication(), search: val, dropdownOpen: true }
                              : p
                          ))
                        }}
                        onFocus={() => updatePub(i, 'dropdownOpen', true)}
                        placeholder={catalogue.length === 0 ? 'Loading publications…' : 'Type to search…'}
                        autoComplete="off"
                        className="w-full border border-gray-300 rounded-md px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                      />
                      {pub.publication_id
                        ? (
                          <button
                            type="button"
                            onClick={() => clearCataloguePub(i)}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                          >✕</button>
                        ) : (
                          <svg className="w-4 h-4 absolute right-2.5 top-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )
                      }
                      {pub.dropdownOpen && catalogue.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                          {filteredCatalogue.length === 0
                            ? <li className="px-3 py-3 text-sm text-gray-400">No publications found</li>
                            : filteredCatalogue.map(c => (
                              <li
                                key={c.id}
                                onMouseDown={() => selectCataloguePub(i, c)}
                                className={`px-3 py-2.5 text-sm cursor-pointer flex items-center justify-between gap-2 ${
                                  pub.publication_id === c.publication_id
                                    ? 'bg-orange-50 text-orange-800 font-medium'
                                    : 'hover:bg-gray-50 text-gray-800'
                                }`}
                              >
                                <span>
                                  {c.publication_title}
                                  <span className="ml-2 text-xs text-gray-400 capitalize">({c.publication_type})</span>
                                </span>
                                <span className={`text-xs font-medium shrink-0 ${c.available_copies === 0 ? 'text-red-500' : 'text-green-600'}`}>
                                  {c.available_copies === 0 ? 'Out of stock' : `${c.available_copies} avail.`}
                                </span>
                              </li>
                            ))
                          }
                        </ul>
                      )}
                    </div>
                    {pub.publication_id && (pub.publisher) && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span>Publisher: <strong>{pub.publisher}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Available Copy + Est. Weight + Request Copy */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Available Copy</label>
                      <input
                        readOnly
                        value={pub.publication_id ? remainingQty : ''}
                        placeholder="—"
                        className={`w-full border rounded-md px-3 py-2.5 text-sm cursor-not-allowed ${
                          !pub.publication_id ? 'bg-gray-50 border-gray-200 text-gray-400' :
                          remainingQty === 0 ? 'bg-red-50 border-red-300 text-red-600 font-semibold' :
                          isLowStock ? 'bg-orange-50 border-orange-300 text-orange-600 font-semibold' :
                          'bg-gray-50 border-gray-200 text-gray-700 font-medium'
                        }`}
                      />
                      {pub.publication_id && remainingQty === 0 && requestedQty > 0 && (
                        <p className="text-xs text-red-500 mt-1">Will empty stock</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Request Copy *</label>
                      <input
                        type="number"
                        min={1}
                        max={pub.available_copies || undefined}
                        value={pub.request_copies}
                        disabled={!pub.publication_id}
                        onChange={e => updatePub(i, 'request_copies', e.target.value)}
                        className={`w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 ${
                          !pub.publication_id ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Est. Total Weight (kg)</label>
                      <input
                        readOnly
                        value={(() => { const u = parseFloat(pub.unit_weight_kg); const c = Number(pub.request_copies) || 1; return !isNaN(u) && u > 0 ? parseFloat((u * c).toFixed(3)).toString() : (pub.est_weight_kg || '') })()}
                        placeholder="—"
                        className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm bg-gray-50 text-gray-700 font-medium cursor-not-allowed"
                      />
                      {pub.unit_weight_kg && (
                        <p className="text-xs text-gray-400 mt-1">{pub.unit_weight_kg} kg/pc × {pub.request_copies || 1} {Number(pub.request_copies) === 1 ? 'copy' : 'copies'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* ── Section 5: Equipment ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-500" />
                Request for Equipment
              </CardTitle>
              <button
                type="button"
                onClick={() => setEquipmentRows(r => [...r, emptyEquipment()])}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">List any equipment or tools needed for this trip or activity.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {equipmentRows.map((row, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3 relative">
                {equipmentRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setEquipmentRows(r => r.filter((_, idx) => idx !== i))}
                    className="absolute top-3 right-3 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Select Equipment */}
                <div
                  ref={el => { equipDropdownRefs.current[i] = el }}
                  className="relative"
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Equipment / Asset</label>
                  <div className="relative">
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Search available assets…"
                      value={row.search}
                      onChange={e => {
                        updateEquip(i, 'search', e.target.value)
                        updateEquip(i, 'dropdownOpen', true)
                        if (!e.target.value.trim()) clearCatalogueAsset(i)
                      }}
                      onFocus={() => updateEquip(i, 'dropdownOpen', true)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => row.asset_id ? clearCatalogueAsset(i) : updateEquip(i, 'dropdownOpen', !row.dropdownOpen)}
                    >
                      {row.asset_id
                        ? <span className="text-xs">✕</span>
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      }
                    </button>
                  </div>
                  {row.dropdownOpen && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                      {assetCatalogue
                        .filter(a =>
                          !row.search.trim() ||
                          a.name.toLowerCase().includes(row.search.toLowerCase()) ||
                          (a.asset_tag ?? '').toLowerCase().includes(row.search.toLowerCase()) ||
                          (a.model ?? '').toLowerCase().includes(row.search.toLowerCase())
                        )
                        .map(asset => (
                          <li
                            key={asset.id}
                            className="px-3 py-2.5 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0"
                            onMouseDown={e => { e.preventDefault(); selectCatalogueAsset(i, asset) }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-800">{asset.name}</span>
                              {asset.category && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 shrink-0">{asset.category}</span>
                              )}
                            </div>
                            {(asset.asset_tag || asset.model) && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {[asset.asset_tag && `Tag: ${asset.asset_tag}`, asset.model && `Model: ${asset.model}`].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </li>
                        ))}
                      {assetCatalogue.filter(a =>
                        !row.search.trim() ||
                        a.name.toLowerCase().includes(row.search.toLowerCase()) ||
                        (a.asset_tag ?? '').toLowerCase().includes(row.search.toLowerCase()) ||
                        (a.model ?? '').toLowerCase().includes(row.search.toLowerCase())
                      ).length === 0 && (
                        <li className="px-3 py-3 text-sm text-gray-400 text-center">No available assets found</li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Auto-filled asset meta */}
                {row.asset_id && (
                  <p className="text-xs text-gray-400">
                    {[row.category && `Category: ${row.category}`, row.model && `Model: ${row.model}`, row.asset_tag && `Tag: ${row.asset_tag}`].filter(Boolean).join(' · ')}
                  </p>
                )}

                {/* Expected Return Date + Purpose */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      type="date"
                      value={row.expected_return_date}
                      onChange={e => updateEquip(i, 'expected_return_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose / Remarks</label>
                    <input
                      className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g. For presentation"
                      value={row.purpose}
                      onChange={e => updateEquip(i, 'purpose', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Section 6: Budget ────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Estimated Cost <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('estimated_cost')}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={errors.estimated_cost ? 'border-red-400' : ''}
                />
                {errors.estimated_cost && <p className="text-red-500 text-xs mt-1">{errors.estimated_cost.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                <select
                  {...register('currency')}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget Code <span className="text-gray-400 font-normal">(optional)</span></label>
                <Input {...register('budget_code')} placeholder="e.g. MKT-2024" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget Plan <span className="text-gray-400 font-normal">(Excel file, optional)</span></label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="truncate">{budgetPlanFile ? budgetPlanFile.name : 'Click to attach .xlsx / .xls'}</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      className="hidden"
                      onChange={e => setBudgetPlanFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {budgetPlanFile && (
                    <button type="button" onClick={() => setBudgetPlanFile(null)} className="text-xs text-red-500 hover:text-red-700">
                      Remove
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-400">Will be uploaded to Google Workspace for approver review &amp; editing.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Notes ───────────────────────────────────────────────────────── */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 space-y-1">
          <p className="font-semibold">Notes:</p>
          <p>(1) File a vacation leave request (attach to this form) for dates covered by the trip that are not official / beyond official business travel dates.</p>
          <p>(2) File for additional leave credit request (upon return from travel) for weekends worked during travel.</p>
        </div>

        {/* ── Approval chain display ───────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Requested by', sublabel: 'Traveler\'s Name', value: currentEmployee ? `${currentEmployee.first_name} ${currentEmployee.last_name}` : '—' },
            { label: 'Endorsed by', sublabel: 'Supervisor', value: '' },
            { label: 'Approved by', sublabel: 'Executive Director', value: '' },
          ].map(({ label, sublabel, value }) => (
            <div key={label} className="rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-xs font-semibold text-gray-700 mb-4">{label}:</p>
              <div className="min-h-[32px] flex items-end justify-center border-b border-gray-300 pb-1 mb-1">
                <span className="text-sm text-gray-800">{value}</span>
              </div>
              <p className="text-xs font-medium text-gray-600">{sublabel}</p>
            </div>
          ))}
        </div>

        {/* ── Actions ─────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="secondary" onClick={() => router.push('/travel/my-requests')}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveDraft}
            disabled={createMutation.isPending || budgetPlanUploading}
          >
            <Save className="w-4 h-4 mr-2" />
            {budgetPlanUploading ? 'Uploading...' : 'Save as Draft'}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || submitMutation.isPending || budgetPlanUploading}
          >
            <Send className="w-4 h-4 mr-2" />
            {budgetPlanUploading ? 'Uploading Budget Plan...' : createMutation.isPending || submitMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        </div>
      </form>
    </div>
  )
}
