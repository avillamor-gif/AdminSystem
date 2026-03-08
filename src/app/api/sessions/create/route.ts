import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase()
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/.test(ua)) return 'mobile'
  return 'desktop'
}

export async function POST(request: NextRequest) {
  try {
    // Verify the caller is authenticated
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Deactivate any existing active sessions for this user to avoid duplicates
    // (same browser login = refresh existing rather than pile up)
    await adminClient
      .from('active_sessions')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Derive metadata from request headers
    const userAgent = request.headers.get('user-agent') || ''
    const deviceType = detectDeviceType(userAgent)

    // Best-effort IP — works behind Vercel/Cloudflare proxy
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : request.headers.get('x-real-ip') || null

    // Session expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const sessionToken = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    const { data, error } = await adminClient
      .from('active_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        device_type: deviceType,
        location: null, // We don't do geo-IP lookup; left null
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Failed to create session record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch (err: any) {
    console.error('Session create route error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
