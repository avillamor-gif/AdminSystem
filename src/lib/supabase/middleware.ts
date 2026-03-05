import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  const isProtectedRoute = !isAuthPage && !isSetupPage && !request.nextUrl.pathname.startsWith('/api')

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
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

      // Check permissions
      // Super admin routes are only for admin role (highest privilege)
      if (isSuperAdminRoute && role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // Admin routes accessible by admin and hr roles
      if (isAdminRoute && !['admin', 'hr'].includes(role || '')) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return response
}
