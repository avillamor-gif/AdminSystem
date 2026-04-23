import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_TIMEOUT_MS = 24 * 60 * 1000 // 24 minutes
const LAST_ACTIVE_COOKIE = 'last_active'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect routes
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isSetupPage = request.nextUrl.pathname.startsWith('/setup')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isProtectedRoute = !isAuthPage && !isSetupPage && !isApiRoute

  if (!user && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  // Inactivity session timeout — only enforced on authenticated protected routes
  if (user && isProtectedRoute) {
    const lastActiveRaw = request.cookies.get(LAST_ACTIVE_COOKIE)?.value
    const now = Date.now()

    if (lastActiveRaw) {
      const lastActive = parseInt(lastActiveRaw, 10)
      // Guard: only treat as expired if the value is a valid recent timestamp
      // (i.e. within the last 24h — rejects corrupt/old cookie values)
      const isValidTimestamp = !isNaN(lastActive) && lastActive > now - 24 * 60 * 60 * 1000
      if (isValidTimestamp && now - lastActive > SESSION_TIMEOUT_MS) {
        // Session expired — sign out and redirect
        await supabase.auth.signOut()
        const redirectUrl = new URL('/login', request.url)
        redirectUrl.searchParams.set('reason', 'timeout')
        const timeoutResponse = NextResponse.redirect(redirectUrl)
        timeoutResponse.cookies.delete(LAST_ACTIVE_COOKIE)
        return timeoutResponse
      }
    }

    // Stamp / refresh the last_active cookie on every request
    response.cookies.set(LAST_ACTIVE_COOKIE, String(now), {
      httpOnly: false, // must be readable by client JS so activity resets work
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // 1 hour max (inactivity check is the real gate)
    })
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check if user has a user_roles entry (is authorized to use the system)
  if (user && isProtectedRoute) {
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role, employee_id')
      .eq('user_id', user.id)
      .single()

    // If user is not in user_roles table, they're not authorized
    if (!userRole) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }

    // Role-based access control for admin routes
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
    const isSuperAdminRoute = request.nextUrl.pathname.startsWith('/super-admin')

    if (isAdminRoute || isSuperAdminRoute) {
      const role = userRole.role

      // Super admin routes: only 'admin' enum role
      if (isSuperAdminRoute && role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }

      if (isAdminRoute) {
        // Always allow legacy admin/hr roles
        const hasLegacyAdminRole = ['admin', 'hr', 'super admin', 'ed'].includes(role || '')

        if (!hasLegacyAdminRole) {
          // Check if user has ANY admin module permission via their role assignments
          const { data: assignments } = await supabase
            .from('user_role_assignments')
            .select('role_id')
            .eq('user_id', user.id)

          if (!assignments || assignments.length === 0) {
            return NextResponse.redirect(new URL('/', request.url))
          }

          const roleIds = assignments.map(a => a.role_id)

          const { data: adminPerms } = await supabase
            .from('role_permissions')
            .select('permission:permissions(code)')
            .in('role_id', roleIds)

          const permCodes: string[] = (adminPerms || [])
            .map((rp: any) => rp.permission?.code)
            .filter(Boolean)

          const hasAdminAccess = permCodes.some(
            (code: string) => code.startsWith('admin.') || code === 'admin.manage'
          )

          if (!hasAdminAccess) {
            return NextResponse.redirect(new URL('/', request.url))
          }
        }
      }
    }
  }

  return response
}
