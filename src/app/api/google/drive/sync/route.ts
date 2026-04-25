/**
 * POST /api/google/drive/sync
 *
 * Mirrors a file (already uploaded to Supabase Storage) into the
 * organised Google Drive folder structure:
 *
 *   IBON Admin System/
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
const ROOT_FOLDER_NAME = 'IBON Admin System'

const DOC_TYPE_FOLDER: Record<string, string> = {
  emergency_contact: 'Emergency Contacts',
  immigration: 'Immigration',
  contract: 'Contracts',
}

/** Find an existing Drive folder by name inside a parent, or create it. */
async function getOrCreateFolder(
  drive: ReturnType<typeof getDriveClient>,
  name: string,
  parentId?: string,
): Promise<string> {
  const parentClause = parentId ? ` and '${parentId}' in parents` : ''
  const q = `name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder'${parentClause} and trashed=false`

  const list = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' })
  if (list.data.files && list.data.files.length > 0) {
    return list.data.files[0].id as string
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: 'id',
  })
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

    // ── Root folder ──────────────────────────────────────────────────────────
    const rootId = await getOrCreateFolder(drive, ROOT_FOLDER_NAME)

    // ── Determine target folder ──────────────────────────────────────────────
    let targetFolderId: string

    if (type === 'attachment' || type === 'contract') {
      const employeesRootId = await getOrCreateFolder(drive, 'Employees', rootId)

      const empFolderName = employeeName
        ? `${employeeId} - ${employeeName}`
        : (employeeId ?? 'Unknown Employee')
      const empFolderId = await getOrCreateFolder(drive, empFolderName, employeesRootId)

      const subFolderName =
        type === 'contract'
          ? 'Contracts'
          : DOC_TYPE_FOLDER[documentType] ?? 'Attachments'

      targetFolderId = await getOrCreateFolder(drive, subFolderName, empFolderId)
    } else {
      // publication
      const pubsRootId = await getOrCreateFolder(drive, 'Publications', rootId)
      targetFolderId = publicationTitle
        ? await getOrCreateFolder(drive, publicationTitle, pubsRootId)
        : pubsRootId
    }

    // ── Fetch the file from Supabase public URL ──────────────────────────────
    const fileRes = await fetch(fileUrl)
    if (!fileRes.ok) throw new Error(`Failed to fetch file from Supabase: ${fileRes.statusText}`)
    const buffer = Buffer.from(await fileRes.arrayBuffer())

    // ── Upload to Drive ──────────────────────────────────────────────────────
    const uploaded = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [targetFolderId],
      },
      media: {
        mimeType: mimeType || 'application/octet-stream',
        body: Readable.from(buffer),
      },
      fields: 'id, name, webViewLink',
    })

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
