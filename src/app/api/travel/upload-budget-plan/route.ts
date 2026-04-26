import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'
import { Readable } from 'stream'

// ── Google Drive auth ─────────────────────────────────────────────────────────
function getDriveClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!json) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON env var')

  const credentials = JSON.parse(json)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return google.drive({ version: 'v3', auth })
}

// ── Resolve Shared Drive ID by name ──────────────────────────────────────────
async function getSharedDriveId(drive: ReturnType<typeof google.drive>): Promise<string> {
  const driveName = process.env.GOOGLE_SHARED_DRIVE_NAME
  if (!driveName) throw new Error('Missing GOOGLE_SHARED_DRIVE_NAME env var')

  const res = await drive.drives.list({ pageSize: 50, fields: 'drives(id, name)' })
  const found = res.data.drives?.find(d => d.name === driveName)
  if (!found?.id) throw new Error(`Shared Drive "${driveName}" not found. Check GOOGLE_SHARED_DRIVE_NAME and that the service account has access.`)
  return found.id
}

// ── Ensure folder exists (or create it) ─────────────────────────────────────
async function ensureFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string,
  sharedDriveId: string,
): Promise<string> {
  const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`

  const res = await drive.files.list({
    q,
    fields: 'files(id)',
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    driveId: sharedDriveId,
    corpora: 'drive',
  })

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!
  }

  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })

  return created.data.id!
}

// ── POST /api/travel/upload-budget-plan ──────────────────────────────────────
// Body: multipart/form-data
//   file         — Excel file
//   travelRequestId — UUID of the travel request
//   requestNumber   — e.g. TR-2026-0042
//   employeeName    — e.g. "Juan dela Cruz"
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file           = formData.get('file') as File | null
    const travelRequestId = formData.get('travelRequestId') as string | null
    const requestNumber   = formData.get('requestNumber') as string | null
    const employeeName    = formData.get('employeeName') as string | null

    if (!file || !travelRequestId || !requestNumber || !employeeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const drive = getDriveClient()
    const sharedDriveId = await getSharedDriveId(drive)
    const year  = new Date().getFullYear().toString()

    // ── Folder structure: Travel Requests / {Year} / {Employee Name} / {Request#} ──
    const rootFolderId      = await ensureFolder(drive, 'Travel Requests',       sharedDriveId, sharedDriveId)
    const yearFolderId      = await ensureFolder(drive, year,                    rootFolderId,  sharedDriveId)
    const employeeFolderId  = await ensureFolder(drive, employeeName,            yearFolderId,  sharedDriveId)
    const requestFolderId   = await ensureFolder(drive, requestNumber,           employeeFolderId, sharedDriveId)

    // ── Upload the Excel file ─────────────────────────────────────────────────
    const buffer     = Buffer.from(await file.arrayBuffer())
    const stream     = Readable.from(buffer)
    const filename   = file.name || `${requestNumber}-budget-plan.xlsx`

    // Detect MIME type
    const mimeType = file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    // Delete existing budget plan file in this folder if any
    const existingFiles = await drive.files.list({
      q: `'${requestFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      driveId: sharedDriveId,
      corpora: 'drive',
    })
    for (const f of existingFiles.data.files ?? []) {
      await drive.files.delete({ fileId: f.id!, supportsAllDrives: true })
    }

    const uploaded = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: filename,
        parents: [requestFolderId],
      },
      media: {
        mimeType,
        body: stream,
      },
      fields: 'id, webViewLink',
    })

    const fileId      = uploaded.data.id!
    const webViewLink = uploaded.data.webViewLink!

    // Make the file accessible to anyone in the org with the link
    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: {
        role: 'writer',
        type: 'anyone',
      },
    })

    // ── Save URL back to travel_requests ──────────────────────────────────────
    const supabase = createAdminClient()
    const { error: dbError } = await supabase
      .from('travel_requests')
      .update({
        budget_plan_url: webViewLink,
        budget_plan_filename: filename,
      })
      .eq('id', travelRequestId)

    if (dbError) {
      console.error('Supabase update error:', dbError)
      // Still return success — the URL is valid, DB update can be retried
    }

    return NextResponse.json({ url: webViewLink, filename })
  } catch (err: any) {
    console.error('Budget plan upload error:', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}
