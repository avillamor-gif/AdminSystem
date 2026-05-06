import { createClient } from '@/lib/supabase/client'

// ── Org Profile ───────────────────────────────────────────────────────────────

export interface OrgProfile {
  id: string
  name: string | null
  short_name: string | null
  tagline: string | null
  description: string | null
  logo_url: string | null
  registration_no: string | null
  tax_id: string | null
  date_established: string | null
  org_type: string | null
  email: string | null
  phone: string | null
  fax: string | null
  website: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  country: string | null
  facebook_url: string | null
  twitter_url: string | null
  linkedin_url: string | null
  updated_at: string
}

export type OrgProfileUpdate = Partial<Omit<OrgProfile, 'id' | 'updated_at'>>

// ── General Settings ──────────────────────────────────────────────────────────

export interface GeneralSetting {
  key: string
  value: string | null
  label: string | null
  description: string | null
  updated_at: string
}

export type GeneralSettingsMap = Record<string, string>

const ORG_PROFILE_ID = '00000000-0000-0000-0000-000000000001'

export const orgProfileService = {
  async get(): Promise<OrgProfile | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('org_profile')
      .select('*')
      .eq('id', ORG_PROFILE_ID)
      .maybeSingle()
    if (error) throw error
    return data as OrgProfile | null
  },

  async update(updates: OrgProfileUpdate): Promise<OrgProfile> {
    const res = await fetch('/api/admin/org-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to update organization profile')
    }
    return res.json()
  },
}

export const generalSettingsService = {
  async getAll(): Promise<GeneralSetting[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('general_settings')
      .select('*')
      .order('key')
    if (error) throw error
    return (data ?? []) as GeneralSetting[]
  },

  async updateKey(key: string, value: string): Promise<void> {
    const res = await fetch('/api/admin/general-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to update setting')
    }
  },
}
