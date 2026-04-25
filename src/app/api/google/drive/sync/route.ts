/**
 * POST /api/google/drive/sync
 *
 * Mirrors a file (already uploaded to Supabase Storage) into the
 * organised Google Drive folder structure.
 *
 * If GOOGLE_SHARED_DRIVE_NAME is set in env, files go into that
 * Shared Drive (Team Drive). Otherwise falls back to My Drive of
 * GOOGLE_ADMIN_EMAIL.
 *
 *   IBON International Admin System/   ← root folder (inside Shared Drive or My Drive)
 *   ├── Employees/
 *   │   └── {employeeId} - {employeeName}/
 *   │       ├── Attachments/
 *   │       ├── Emergency Contacts/
 *   │       ├── Immigration/
 *   │       └── Contracts/
 *   └── Publications/
 *       └── {publicationTitle}/
 *           ├── document.pdf
 *           └── cover.jpg
 *
 * Body (JSON):
 *   type          'attachment' | 'contract' | 'publication'
 *   fileUrl       Public URL to download the file from (Supabase public URL)
 *   fileName      Filename to use in Drive
 *   mimeType      MIME type of the file
 *   employeeId?   e.g. "EMP-001"
 *   employeeName? e.g. "Juan dela Cruz"
 *   documentType? e.g. "emergency_contact" | "immigration" (for attachments)
 *   publicationTitle?  Publication title (used as sub-folder name)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDriveClient } from '@/lib/google'
import { Readable } from 'stream'

const ADMIN_EMAIL = process.env.GOOGLE_ADMIN_EMAIL!
const ROOT_FOLDER_NAME = 'IBON International Admin System'
const SHARED_DRIVE_NAME = process.env.GOOGLE_SHARED_DRIVE_NAME ?? null

const DOC_TYPE_FOLDER: Record<string, string> = {
  emergency_contact: 'Emergency Contacts',
  immigration: 'Immigration',
  contract: 'Contracts',
  'e-signature': 'E-Signatures',
}

/** Resolve the Shared Drive ID by name (or return null to use My Drive). */
async function getSharedDriveId(
  drive: ReturnType<typeof getDriveClient>,
): Promise<string | null> {
  if (!SHARED_DRIVE_NAME) return null
  const res = await drive.drives.list({
    pageSize: 50,
    fields: 'drives(id, name)',
    useDomainAdminAccess: true,
  })
  const found = (res.data.drives ?? []).find(d => d.name === SHARED_DRIVE_NAME)
  if (!found?.id) throw new Error(`Shared Drive "${SHARED_DRIVE_NAME}" not found. Create it in Google Workspace first and add the service account as Content Manager.`)
  return found.id
}

/** Find an existing Drive folder by name inside a parent, or create it. */
async function getOrCreateFolder(
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId: string,           // always required — pass sharedDriveId as root parent
  sharedDriveId?: string | null,
): Promise<string> {
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`

  const listParams: Record<string, any> = { q, fields: 'files(id)', spaces: 'drive' }
  if (sharedDriveId) {
    listParams.corpora = 'drive'
    listParams.driveId = sharedDriveId
    listParams.includeItemsFromAllDrives = true
    listParams.supportsAllDrives = true
  }

  const list = await drive.files.list(listParams)
  if (list.data.files && list.data.files.length > 0) {
    return list.data.files[0].id as string
  }

  const createParams: any = {
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  }
  if (sharedDriveId) {
    createParams.supportsAllDrives = true
  }

  const created = await drive.files.create(createParams)
  return created.data.id as string
}

export async function POST(req: NextRequest) {
  try {
    const {
      type,
      fileUrl,
      fileName,
      mimeType,
      employeeId,
      employeeName,
      documentType,
      publicationTitle,
    } = await req.json()

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: 'fileUrl and fileName are required' }, { status: 400 })
    }

    const drive = getDriveClient(ADMIN_EMAIL)

    // ── Resolve Shared Drive (if configured) ────────────────────────────────
    const sharedDriveId = await getSharedDriveId(drive)

    // ── Root folder — parent is either the Shared Drive ID or 'root' ────────
    // For Shared Drives the root parent IS the sharedDriveId itself.
    // For My Drive we use the special alias 'root'.
    const rootParent = sharedDriveId ?? 'root'
    const rootId = await getOrCreateFolder(drive, ROOT_FOLDER_NAME, rootParent, sharedDriveId)

    // ── Determine target folder ──────────────────────────────────────────────
    let targetFolderId: string

    if (type === 'attachment' || type === 'contract') {
      const employeesRootId = await getOrCreateFolder(drive, 'Employees', rootId, sharedDriveId)

      const empFolderName = employeeName
        ? `${employeeId} - ${employeeName}`
        : (employeeId ?? 'Unknown Employee')
      const empFolderId = await getOrCreateFolder(drive, empFolderName, employeesRootId, sharedDriveId)

      const subFolderName =
        type === 'contract'
          ? 'Contracts'
          : DOC_TYPE_FOLDER[documentType] ?? 'Attachments'

      targetFolderId = await getOrCreateFolder(drive, subFolderName, empFolderId, sharedDriveId)
    } else {
      // publication
      const pubsRootId = await getOrCreateFolder(drive, 'Publications', rootId, sharedDriveId)
      targetFolderId = publicationTitle
        ? await getOrCreateFolder(drive, publicationTitle, pubsRootId, sharedDriveId)
        : pubsRootId
    }

    // ── Fetch the file from Supabase public URL ──────────────────────────────
    const fileRes = await fetch(fileUrl)
    if (!fileRes.ok) throw new Error(`Failed to fetch file from Supabase: ${fileRes.statusText}`)
    const buffer = Buffer.from(await fileRes.arrayBuffer())

    // ── Upload to Drive ──────────────────────────────────────────────────────
    const uploadParams: any = {
      requestBody: {
        name: fileName,
        parents: [targetFolderId],
      },
      media: {
        mimeType: mimeType || 'application/octet-stream',
        body: Readable.from(buffer),
      },
      fields: 'id, name, webViewLink',
    }
    if (sharedDriveId) {
      uploadParams.supportsAllDrives = true
    }

    const uploaded = await drive.files.create(uploadParams)

    return NextResponse.json({
      success: true,
      fileId: uploaded.data.id,
      webViewLink: uploaded.data.webViewLink,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Drive Sync]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
