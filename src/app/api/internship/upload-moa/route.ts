/**
 * POST /api/internship/upload-moa
 *
 * Accepts a multipart form upload of a MOA document, saves it to
 * Supabase Storage (moa-documents bucket, service-role to bypass RLS),
 * persists moa_file_path in partner_institutions, then fire-and-forgets
 * a mirror to the Google Workspace Shared Drive under:
 *
 *   IBON International Admin System/
 *   └── Partner Institutions/
 *       └── {institutionName}/
 *           └── MOA Documents/
 *               └── {fileName}
 *
 * Body: multipart/form-data
 *   file            — the uploaded file (PDF / DOC / DOCX)
 *   institutionId   — UUID of the partner_institution row
 *   institutionName — display name used for Drive folder
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file            = form.get('file') as File | null
    const institutionId   = form.get('institutionId') as string | null
    const institutionName = (form.get('institutionName') as string | null) ?? 'Unknown'

    if (!file || !institutionId) {
      return NextResponse.json({ error: 'Missing file or institutionId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // ── 1. Upload to Supabase Storage ──────────────────────────────────────
    const ext      = file.name.split('.').pop() ?? 'pdf'
    const path     = `${institutionId}/${Date.now()}.${ext}`
    const buffer   = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('moa-documents')
      .upload(path, buffer, {
        contentType: file.type || 'application/pdf',
        upsert: true,
      })

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`)

    // ── 2. Persist path in DB ──────────────────────────────────────────────
    const { error: dbError } = await supabase
      .from('partner_institutions' as any)
      .update({ moa_file_path: path, updated_at: new Date().toISOString() })
      .eq('id', institutionId)

    if (dbError) throw new Error(`DB update failed: ${dbError.message}`)

    // ── 3. Mirror to Google Drive (fire-and-forget) ────────────────────────
    // Create a short-lived signed URL so the Drive sync API can fetch the file
    const { data: signedData } = await supabase.storage
      .from('moa-documents')
      .createSignedUrl(path, 300) // 5-minute URL — enough for Drive to fetch it

    if (signedData?.signedUrl) {
      const origin = req.nextUrl.origin
      fetch(`${origin}/api/google/drive/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'moa',
          fileUrl: signedData.signedUrl,
          fileName: `MOA - ${institutionName}.${ext}`,
          mimeType: file.type || 'application/pdf',
          institutionName,
        }),
      }).catch(err => console.error('[Drive Sync] MOA mirror failed:', err?.message ?? err))
    }

    return NextResponse.json({ path })
  } catch (err: any) {
    console.error('[upload-moa]', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}
