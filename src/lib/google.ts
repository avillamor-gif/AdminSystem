/**
 * Google Workspace integration helpers.
 * Uses a service account with domain-wide delegation to act on behalf of
 * any user in the iboninternational.org domain.
 *
 * Never import this file in client components — server / API routes only.
 */

import { google, Auth } from 'googleapis'

const SCOPES = {
  calendar: [
    'https://www.googleapis.com/auth/calendar',
  ],
  drive: [
    'https://www.googleapis.com/auth/drive',
  ],
  chat: [
    'https://www.googleapis.com/auth/chat.bot',
  ],
  admin: [
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.group',
  ],
}

function getServiceAccountKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set')
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON')
  }
}

/**
 * Returns an OAuth2 client authenticated as the given user (impersonation).
 * Pass the full Workspace email, e.g. "jdelacruz@iboninternational.org".
 */
export function getAuthClient(
  scopes: string[],
  impersonateEmail?: string,
): Auth.JWT {
  const key = getServiceAccountKey()
  return new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes,
    subject: impersonateEmail, // domain-wide delegation — act as this user
  })
}

/** Calendar client impersonating a specific user. */
export function getCalendarClient(userEmail: string) {
  const auth = getAuthClient(SCOPES.calendar, userEmail)
  return google.calendar({ version: 'v3', auth })
}

/** Drive client impersonating a specific user. */
export function getDriveClient(userEmail: string) {
  const auth = getAuthClient(SCOPES.drive, userEmail)
  return google.drive({ version: 'v3', auth })
}

/**
 * Chat client — uses the service account directly (bot identity),
 * not impersonation, because Chat bots act as themselves.
 */
export function getChatClient() {
  const auth = getAuthClient(SCOPES.chat)
  return google.chat({ version: 'v1', auth })
}

/**
 * Admin SDK client — must impersonate a super admin.
 * Uses GOOGLE_ADMIN_EMAIL env var.
 */
export function getAdminClient() {
  const adminEmail = process.env.GOOGLE_ADMIN_EMAIL
  if (!adminEmail) throw new Error('GOOGLE_ADMIN_EMAIL env var is not set')
  const auth = getAuthClient(SCOPES.admin, adminEmail)
  return google.admin({ version: 'directory_v1', auth })
}

/** Workspace domain, e.g. "iboninternational.org" */
export const WORKSPACE_DOMAIN = process.env.GOOGLE_WORKSPACE_DOMAIN ?? ''
