import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/mobile-capture/upload
// Body: multipart/form-data { session, slot, file }
// Uploads the image to Supabase storage, then broadcasts via Realtime channel
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const session = form.get('session') as string | null
    const slot    = parseInt((form.get('slot') as string | null) ?? '0', 10)
    const file    = form.get('file') as File | null

    if (!session || !file) {
      return NextResponse.json({ error: 'Missing session or file' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Upload to storage
    const fileExt  = file.name.split('.').pop() ?? 'jpg'
    const fileName = `mobile-${session}-${slot}-${Date.now()}.${fileExt}`
    const filePath = `sessions/${fileName}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('asset-images')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('asset-images')
      .getPublicUrl(filePath)

    // Broadcast result via Realtime so the desktop page picks it up
    await supabase
      .channel(`mobile-capture-${session}`)
      .send({
        type: 'broadcast',
        event: 'photo',
        payload: { slot, url: publicUrl },
      })

    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    console.error('[mobile-capture/upload]', err)
    return NextResponse.json({ error: err.message ?? 'Upload failed' }, { status: 500 })
  }
}
