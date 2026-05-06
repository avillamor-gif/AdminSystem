'use client'

import { useState, useEffect } from 'react'
import { Save, Building2, Globe, Phone, MapPin, FileText, Share2 } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { useOrgProfile, useUpdateOrgProfile } from '@/hooks/useOrgProfile'
import type { OrgProfileUpdate } from '@/services/orgProfile.service'

const SECTION = 'p-6 space-y-4'
const GRID2   = 'grid grid-cols-1 md:grid-cols-2 gap-4'
const GRID3   = 'grid grid-cols-1 md:grid-cols-3 gap-4'

function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
      <div className="p-2 bg-orange/10 rounded-lg flex-shrink-0">
        <Icon className="w-5 h-5 text-orange-500" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', disabled = false }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
      />
    </div>
  )
}

const BLANK: Required<OrgProfileUpdate> = {
  name: '', short_name: '', tagline: '', description: '', logo_url: '',
  registration_no: '', tax_id: '', date_established: '', org_type: '',
  email: '', phone: '', fax: '', website: '',
  address: '', city: '', province: '', postal_code: '', country: 'Philippines',
  facebook_url: '', twitter_url: '', linkedin_url: '',
}

export default function OrganizationProfilePage() {
  const { data: profile, isLoading } = useOrgProfile()
  const updateMutation = useUpdateOrgProfile()
  const [form, setForm] = useState<Required<OrgProfileUpdate>>(BLANK)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        name:            profile.name            ?? '',
        short_name:      profile.short_name      ?? '',
        tagline:         profile.tagline         ?? '',
        description:     profile.description     ?? '',
        logo_url:        profile.logo_url        ?? '',
        registration_no: profile.registration_no ?? '',
        tax_id:          profile.tax_id          ?? '',
        date_established:profile.date_established?? '',
        org_type:        profile.org_type        ?? '',
        email:           profile.email           ?? '',
        phone:           profile.phone           ?? '',
        fax:             profile.fax             ?? '',
        website:         profile.website         ?? '',
        address:         profile.address         ?? '',
        city:            profile.city            ?? '',
        province:        profile.province        ?? '',
        postal_code:     profile.postal_code     ?? '',
        country:         profile.country         ?? 'Philippines',
        facebook_url:    profile.facebook_url    ?? '',
        twitter_url:     profile.twitter_url     ?? '',
        linkedin_url:    profile.linkedin_url    ?? '',
      })
      setIsDirty(false)
    }
  }, [profile])

  const set = (key: keyof OrgProfileUpdate) => (value: string) => {
    setForm(f => ({ ...f, [key]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    await updateMutation.mutateAsync(form)
    setIsDirty(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
          <p className="text-gray-600 mt-1">Identity, contact details, and registration information for IBON International</p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || updateMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>

      {isDirty && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          You have unsaved changes
        </div>
      )}

      {/* Identity */}
      <Card className={SECTION}>
        <SectionHeader icon={Building2} title="Organization Identity" description="Name, branding and brief description" />
        <div className={GRID2}>
          <Field label="Full Organization Name" value={form.name} onChange={set('name')} placeholder="IBON International" />
          <Field label="Short Name / Acronym" value={form.short_name} onChange={set('short_name')} placeholder="IBON" />
        </div>
        <Field label="Tagline" value={form.tagline} onChange={set('tagline')} placeholder="e.g. Research, Education and Information" />
        <TextArea label="About / Description" value={form.description} onChange={set('description')} placeholder="Brief description of the organization's mission and mandate" rows={4} />
        <Field label="Logo URL" value={form.logo_url} onChange={set('logo_url')} placeholder="https://..." />
      </Card>

      {/* Registration */}
      <Card className={SECTION}>
        <SectionHeader icon={FileText} title="Registration & Legal" description="Official registration numbers and legal classification" />
        <div className={GRID3}>
          <Field label="Registration Number" value={form.registration_no} onChange={set('registration_no')} placeholder="SEC / DOLE Reg No." />
          <Field label="Tax Identification Number (TIN)" value={form.tax_id} onChange={set('tax_id')} placeholder="000-000-000-000" />
          <Field label="Organization Type" value={form.org_type} onChange={set('org_type')} placeholder="Non-profit NGO" />
        </div>
        <div className={GRID2}>
          <Field label="Date Established" value={form.date_established} onChange={set('date_established')} type="date" />
        </div>
      </Card>

      {/* Contact */}
      <Card className={SECTION}>
        <SectionHeader icon={Phone} title="Contact Information" description="Primary contact details for the organization" />
        <div className={GRID3}>
          <Field label="Official Email" value={form.email} onChange={set('email')} placeholder="info@iboninternational.org" type="email" />
          <Field label="Phone" value={form.phone} onChange={set('phone')} placeholder="+63 2 8xxx xxxx" />
          <Field label="Fax" value={form.fax} onChange={set('fax')} placeholder="+63 2 8xxx xxxx" />
        </div>
        <Field label="Website" value={form.website} onChange={set('website')} placeholder="https://www.iboninternational.org" />
      </Card>

      {/* Address */}
      <Card className={SECTION}>
        <SectionHeader icon={MapPin} title="Address" description="Official registered address" />
        <TextArea label="Street Address" value={form.address} onChange={set('address')} placeholder="Building, Street, Barangay" rows={2} />
        <div className={GRID3}>
          <Field label="City / Municipality" value={form.city} onChange={set('city')} placeholder="Quezon City" />
          <Field label="Province / Region" value={form.province} onChange={set('province')} placeholder="Metro Manila" />
          <Field label="Postal Code" value={form.postal_code} onChange={set('postal_code')} placeholder="1100" />
        </div>
        <div className={GRID2}>
          <Field label="Country" value={form.country} onChange={set('country')} placeholder="Philippines" />
        </div>
      </Card>

      {/* Social */}
      <Card className={SECTION}>
        <SectionHeader icon={Share2} title="Social Media" description="Official social media pages" />
        <div className="space-y-3">
          <Field label="Facebook" value={form.facebook_url} onChange={set('facebook_url')} placeholder="https://facebook.com/iboninternational" />
          <Field label="Twitter / X" value={form.twitter_url} onChange={set('twitter_url')} placeholder="https://twitter.com/iboninternational" />
          <Field label="LinkedIn" value={form.linkedin_url} onChange={set('linkedin_url')} placeholder="https://linkedin.com/company/iboninternational" />
        </div>
      </Card>
    </div>
  )
}
