import { createAdminClient } from '@/lib/supabase/admin'
import Image from 'next/image'
import { notFound } from 'next/navigation'

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    available:    { label: 'Available',    cls: 'bg-green-100 text-green-800' },
    assigned:     { label: 'Assigned',     cls: 'bg-blue-100 text-blue-800' },
    maintenance:  { label: 'Maintenance',  cls: 'bg-yellow-100 text-yellow-800' },
    retired:      { label: 'Retired',      cls: 'bg-gray-100 text-gray-600' },
    lost:         { label: 'Lost',         cls: 'bg-red-100 text-red-700' },
    damaged:      { label: 'Damaged',      cls: 'bg-orange-100 text-orange-700' },
    borrowed:     { label: 'Borrowed',     cls: 'bg-purple-100 text-purple-700' },
  }
  const s = map[status ?? ''] ?? { label: status ?? 'Unknown', cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${s.cls}`}>
      {s.label}
    </span>
  )
}

function ConditionBadge({ condition }: { condition: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    excellent: { label: 'Excellent', cls: 'bg-emerald-100 text-emerald-800' },
    good:      { label: 'Good',      cls: 'bg-green-100 text-green-800' },
    fair:      { label: 'Fair',      cls: 'bg-yellow-100 text-yellow-800' },
    poor:      { label: 'Poor',      cls: 'bg-red-100 text-red-700' },
  }
  const c = map[condition ?? ''] ?? { label: condition ?? '—', cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>
      {c.label}
    </span>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 mr-4">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right">{value}</span>
    </div>
  )
}

function formatDate(d: string | null | undefined) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return null
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AssetViewPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  // Fetch asset
  const { data: asset, error } = await supabase
    .from('assets')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !asset) notFound()

  // Fetch related records in parallel
  const [catRes, brandRes, vendorRes, locationRes, employeeRes] = await Promise.all([
    asset.category_id
      ? supabase.from('asset_categories').select('name').eq('id', asset.category_id).single()
      : Promise.resolve({ data: null }),
    asset.brand_id
      ? supabase.from('asset_brands').select('name').eq('id', asset.brand_id).single()
      : Promise.resolve({ data: null }),
    asset.vendor_id
      ? supabase.from('asset_vendors').select('name').eq('id', asset.vendor_id).single()
      : Promise.resolve({ data: null }),
    asset.location_id
      ? supabase.from('asset_locations').select('name').eq('id', asset.location_id).single()
      : Promise.resolve({ data: null }),
    asset.assigned_to
      ? supabase.from('employees').select('first_name, last_name, email').eq('id', asset.assigned_to).single()
      : Promise.resolve({ data: null }),
  ])

  const category = catRes.data as { name: string } | null
  const brand    = brandRes.data as { name: string } | null
  const vendor   = vendorRes.data as { name: string } | null
  const location = locationRes.data as { name: string } | null
  const employee = employeeRes.data as { first_name: string; last_name: string; email: string } | null

  // Build images array
  const images: string[] = Array.isArray(asset.image_urls) && asset.image_urls.length > 0
    ? asset.image_urls
    : asset.image_url ? [asset.image_url] : []

  // Depreciation — current book value
  let bookValue: string | null = null
  let annualDepreciation: string | null = null
  let totalDepreciated: string | null = null
  let depreciationPct: number | null = null

  if (asset.purchase_price && asset.purchase_date && asset.useful_life_years) {
    const yearsElapsed = (Date.now() - new Date(asset.purchase_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    const salvage = asset.salvage_value ?? 0
    const depreciableAmount = asset.purchase_price - salvage

    if (asset.depreciation_method === 'double_declining') {
      // Double Declining Balance
      const rate = (2 / asset.useful_life_years)
      let bv = asset.purchase_price
      for (let y = 0; y < Math.min(yearsElapsed, asset.useful_life_years); y++) {
        const dep = bv * rate
        bv = Math.max(salvage, bv - dep)
      }
      bookValue = formatCurrency(bv)
      totalDepreciated = formatCurrency(asset.purchase_price - bv)
      depreciationPct = Math.round(((asset.purchase_price - bv) / asset.purchase_price) * 100)
    } else {
      // Straight-line (default)
      const annual = depreciableAmount / asset.useful_life_years
      const bv = Math.max(salvage, asset.purchase_price - annual * yearsElapsed)
      bookValue = formatCurrency(bv)
      annualDepreciation = formatCurrency(annual)
      totalDepreciated = formatCurrency(asset.purchase_price - bv)
      depreciationPct = Math.round(((asset.purchase_price - bv) / asset.purchase_price) * 100)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#ff7e15] px-4 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg overflow-hidden bg-white p-1 shrink-0">
          <Image src="/ibon-icon.png" alt="IBON" width={32} height={32} className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">IBON International Admin System</p>
          <p className="text-white/70 text-xs">Asset Detail</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 pb-10">

        {/* Image carousel */}
        {images.length > 0 ? (
          <div className="rounded-2xl overflow-hidden bg-white shadow">
            {images.length === 1 ? (
              <img src={images[0]} alt={asset.name} className="w-full aspect-[4/3] object-cover" />
            ) : (
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-0 scrollbar-hide">
                {images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${asset.name} ${i + 1}`}
                    className="w-full shrink-0 snap-start aspect-[4/3] object-cover"
                    style={{ minWidth: '100%' }}
                  />
                ))}
              </div>
            )}
            {images.length > 1 && (
              <p className="text-xs text-center text-gray-400 py-2">← Swipe for more photos ({images.length})</p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl bg-white shadow flex items-center justify-center aspect-[4/3] text-gray-300">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Title + status */}
        <div className="bg-white rounded-2xl shadow px-5 py-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{asset.name}</h1>
            <StatusBadge status={asset.status} />
          </div>
          <div className="flex items-center gap-3">
            {asset.asset_tag && (
              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{asset.asset_tag}</span>
            )}
            {asset.condition && <ConditionBadge condition={asset.condition} />}
          </div>
          {asset.notes && (
            <p className="text-sm text-gray-500 pt-1">{asset.notes}</p>
          )}
        </div>

        {/* Assignment */}
        {employee && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Assigned To</p>
            <p className="text-base font-bold text-blue-900">{employee.first_name} {employee.last_name}</p>
            {asset.assigned_date && (
              <p className="text-sm text-blue-600">Since {formatDate(asset.assigned_date)}</p>
            )}
          </div>
        )}

        {/* Details */}
        <div className="bg-white rounded-2xl shadow px-5 py-2">
          <Row label="Category"      value={category?.name} />
          <Row label="Brand"         value={brand?.name} />
          <Row label="Model"         value={asset.model} />
          <Row label="Serial No."    value={asset.serial_number} />
          <Row label="Location"      value={location?.name ?? asset.location} />
          <Row label="Vendor"        value={vendor?.name} />
        </div>

        {/* Purchase & warranty */}
        {(asset.purchase_date || asset.purchase_price || asset.warranty_end_date) && (
          <div className="bg-white rounded-2xl shadow px-5 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Purchase &amp; Warranty</p>
            <Row label="Purchase Date"    value={formatDate(asset.purchase_date)} />
            <Row label="Purchase Price"   value={formatCurrency(asset.purchase_price)} />
            <Row label="Warranty Starts"  value={formatDate(asset.warranty_start_date)} />
            <Row label="Warranty Expires" value={formatDate(asset.warranty_end_date)} />
          </div>
        )}

        {/* Depreciation / Current Value */}
        {bookValue && (
          <div className="bg-white rounded-2xl shadow px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current Value</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{bookValue}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {asset.depreciation_method === 'double_declining' ? 'Double Declining Balance' : 'Straight-Line'} depreciation
                </p>
              </div>
              {depreciationPct !== null && (
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  depreciationPct < 30 ? 'bg-green-100 text-green-700' :
                  depreciationPct < 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {depreciationPct}% depreciated
                </span>
              )}
            </div>
            {depreciationPct !== null && (
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    depreciationPct < 30 ? 'bg-green-400' :
                    depreciationPct < 60 ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(depreciationPct, 100)}%` }}
                />
              </div>
            )}
            <div className="border-t border-gray-100 pt-2 space-y-0">
              {annualDepreciation && <Row label="Annual Depreciation" value={annualDepreciation} />}
              {totalDepreciated   && <Row label="Total Depreciated"   value={totalDepreciated} />}
              {asset.salvage_value ? <Row label="Salvage Value" value={formatCurrency(asset.salvage_value)} /> : null}
              {asset.useful_life_years ? <Row label="Useful Life" value={`${asset.useful_life_years} years`} /> : null}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pt-2">
          IBON International Asset Management · {asset.asset_tag}
        </p>
      </div>
    </div>
  )
}
