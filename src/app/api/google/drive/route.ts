/**
 * Google Drive API route.
 *
 * POST /api/google/drive
 * Body (multipart/form-data OR JSON):
 *   action: 'upload' | 'delete' | 'createFolder' | 'share'
 *
 *   For upload (multipart/form-data):
 *     file: File blob
 *     fileName: string
 *     mimeType: string
 *     folderId?: string      — parent folder ID
 *     ownerEmail: string     — Workspace user whose Drive to upload to
 *
 *   For delete (JSON):
 *     fileId: string
 *     ownerEmail: string
 *
 *   For createFolder (JSON):
 *     folderName: string
 *     parentFolderId?: string
 *     ownerEmail: string
 *
 *   For share (JSON):
 *     fileId: string
 *     shareWithEmail: string
 *     role: 'reader' | 'writer' | 'commenter'
 *     ownerEmail: string
 *
 * Returns: { success: true, fileId?: string, folderId?: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDriveClient } from '@/lib/google'
import { Readable } from 'stream'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      // --- File upload ---
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      const fileName = formData.get('fileName') as string
      const mimeType = formData.get('mimeType') as string
      const folderId = formData.get('folderId') as string | null
      const ownerEmail = formData.get('ownerEmail') as string

      if (!file || !fileName || !mimeType || !ownerEmail) {
        return NextResponse.json({ error: 'file, fileName, mimeType, ownerEmail are required' }, { status: 400 })
      }

      const drive = getDriveClient(ownerEmail)
      const buffer = Buffer.from(await file.arrayBuffer())
      const stream = Readable.from(buffer)

      const res = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: folderId ? [folderId] : undefined,
        },
        media: {
          mimeType,
          body: stream,
        },
        fields: 'id, name, webViewLink',
      })

      return NextResponse.json({ success: true, fileId: res.data.id, webViewLink: res.data.webViewLink })
    }

    // --- JSON actions ---
    const body = await req.json()
    const { action, ownerEmail } = body

    if (!ownerEmail) {
      return NextResponse.json({ error: 'ownerEmail is required' }, { status: 400 })
    }

    const drive = getDriveClient(ownerEmail)

    if (action === 'delete') {
      await drive.files.delete({ fileId: body.fileId })
      return NextResponse.json({ success: true })
    }

    if (action === 'createFolder') {
      const res = await drive.files.create({
        requestBody: {
          name: body.folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: body.parentFolderId ? [body.parentFolderId] : undefined,
        },
        fields: 'id',
      })
      return NextResponse.json({ success: true, folderId: res.data.id })
    }

    if (action === 'share') {
      await drive.permissions.create({
        fileId: body.fileId,
        requestBody: {
          type: 'user',
          role: body.role ?? 'reader',
          emailAddress: body.shareWithEmail,
        },
        sendNotificationEmail: true,
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Google Drive API]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
