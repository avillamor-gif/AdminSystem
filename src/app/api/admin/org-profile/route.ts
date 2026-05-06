import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ORG_PROFILE_ID = '00000000-0000-0000-0000-000000000001'

const ALLOWED_FIELDS = [
  'name', 'short_name', 'tagline', 'description', 'logo_url',
  'registration_no', 'tax_id', 'date_established', 'org_type',
  'email', 'phone', 'fax', 'website',
  'address', 'city', 'province', 'postal_code', 'country',
  'facebook_url', 'twitter_url', 'linkedin_url',
]

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const admin = createAdminClient()

    const payload: Record<string, unknown> = {}
    for (const key of ALLOWED_FIELDS) {
      if (key in body) payload[key] = body[key] === '' ? null : body[key]
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('org_profile')
      .update(payload as never)
      .eq('id', ORG_PROFILE_ID)
      .select('*')
      .single()

    if (error) {
      console.error('[org-profile PATCH]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
