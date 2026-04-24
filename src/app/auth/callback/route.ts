import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase()
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/.test(ua)) return 'mobile'
  return 'desktop'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('redirect') ?? searchParams.get('next') ?? '/'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://adminsystem.iboninternational.org'

  if (code) {
    const supabase = createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && sessionData?.user) {
      // Record the session (best-effort)
      try {
        const adminClient = createAdminClient()
        const user = sessionData.user

        await adminClient
          .from('active_sessions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('is_active', true)

        const userAgent = request.headers.get('user-agent') || ''
        const forwardedFor = request.headers.get('x-forwarded-for')
        const ipAddress = forwardedFor
          ? forwardedFor.split(',')[0].trim()
          : request.headers.get('x-real-ip') || null

        await adminClient.from('active_sessions').insert({
          user_id: user.id,
          session_token: `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: detectDeviceType(userAgent),
          location: null,
          started_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
        })
      } catch (e) {
        console.warn('Could not record OAuth session:', e)
      }

      return NextResponse.redirect(`${siteUrl}${next}`)
    }
  }

  // Return to login with error if something went wrong
  return NextResponse.redirect(`${siteUrl}/login?error=oauth_error`)
}

