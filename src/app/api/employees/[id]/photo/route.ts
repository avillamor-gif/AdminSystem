import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'employee-photos'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify caller is authenticated
    const supabaseServer = createClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const employeeId = formData.get('employeeId') as string | null

    if (!file || !employeeId) {
      return NextResponse.json({ error: 'Missing file or employeeId' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Delete existing photos for this employee first
    const { data: existing } = await admin.storage.from(BUCKET).list(employeeId)
    if (existing && existing.length > 0) {
      const toRemove = existing.map((f: { name: string }) => `${employeeId}/${f.name}`)
      await admin.storage.from(BUCKET).remove(toRemove)
    }

    const fileExt = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${employeeId}-${Date.now()}.${fileExt}`
    const filePath = `${employeeId}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      })

    if (uploadError) {
      console.error('[photo/route] Upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(filePath)

    // Also update avatar_url on the employee row
    const { error: updateError } = await admin
      .from('employees')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    if (updateError) {
      console.error('[photo/route] DB update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ publicUrl })
  } catch (err: any) {
    console.error('[photo/route] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseServer = createClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Remove all photos for this employee
    const { data: existing } = await admin.storage.from(BUCKET).list(params.id)
    if (existing && existing.length > 0) {
      const toRemove = existing.map((f: { name: string }) => `${params.id}/${f.name}`)
      await admin.storage.from(BUCKET).remove(toRemove)
    }

    await admin
      .from('employees')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', params.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[photo/route] DELETE Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
