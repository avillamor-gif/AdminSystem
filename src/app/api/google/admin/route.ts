/**
 * Google Workspace Admin SDK API route.
 *
 * POST /api/google/admin
 * Body:
 *   action: 'createUser' | 'suspendUser' | 'restoreUser' | 'deleteUser' | 'resetPassword' | 'getUser'
 *
 *   For createUser:
 *     firstName: string
 *     lastName: string
 *     email: string          — full Workspace email (user@iboninternational.org)
 *     password: string       — temporary password (user must change on first login)
 *     jobTitle?: string
 *     department?: string
 *     phone?: string
 *     changePasswordAtNextLogin?: boolean   — default true
 *
 *   For suspendUser / restoreUser / deleteUser / getUser:
 *     email: string
 *
 *   For resetPassword:
 *     email: string
 *     password: string
 *
 * Returns: { success: true, user?: object }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient, WORKSPACE_DOMAIN } from '@/lib/google'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    const admin = getAdminClient()

    if (action === 'createUser') {
      const {
        firstName,
        lastName,
        email,
        password,
        jobTitle,
        department,
        phone,
        changePasswordAtNextLogin = true,
      } = body

      if (!firstName || !lastName || !email || !password) {
        return NextResponse.json(
          { error: 'firstName, lastName, email, password are required' },
          { status: 400 },
        )
      }

      const res = await admin.users.insert({
        requestBody: {
          name: { givenName: firstName, familyName: lastName },
          primaryEmail: email,
          password,
          changePasswordAtNextLogin,
          orgUnitPath: '/',
          organizations: jobTitle || department
            ? [{ title: jobTitle, department, primary: true }]
            : undefined,
          phones: phone ? [{ value: phone, type: 'work', primary: true }] : undefined,
        },
      })

      return NextResponse.json({ success: true, user: res.data })
    }

    if (action === 'suspendUser') {
      const res = await admin.users.update({
        userKey: body.email,
        requestBody: { suspended: true },
      })
      return NextResponse.json({ success: true, user: res.data })
    }

    if (action === 'restoreUser') {
      const res = await admin.users.update({
        userKey: body.email,
        requestBody: { suspended: false },
      })
      return NextResponse.json({ success: true, user: res.data })
    }

    if (action === 'deleteUser') {
      await admin.users.delete({ userKey: body.email })
      return NextResponse.json({ success: true })
    }

    if (action === 'resetPassword') {
      const res = await admin.users.update({
        userKey: body.email,
        requestBody: {
          password: body.password,
          changePasswordAtNextLogin: true,
        },
      })
      return NextResponse.json({ success: true, user: res.data })
    }

    if (action === 'getUser') {
      const res = await admin.users.get({ userKey: body.email })
      return NextResponse.json({ success: true, user: res.data })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Google Admin API]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** GET /api/google/admin?email=user@iboninternational.org — look up a user */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) {
      return NextResponse.json({ error: 'email query param is required' }, { status: 400 })
    }
    const admin = getAdminClient()
    const res = await admin.users.get({ userKey: email })
    return NextResponse.json({ success: true, user: res.data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
