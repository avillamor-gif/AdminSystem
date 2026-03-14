import { createClient } from './client'

export const BUCKETS = {
  EMPLOYEE_PHOTOS: 'employee-photos',
  DOCUMENTS: 'documents',
  ATTACHMENTS: 'attachments',
  ASSET_IMAGES: 'asset-images',
} as const

export async function uploadAssetImage(file: File, assetId: string, index: number): Promise<string> {
  const supabase = createClient()
  const fileExt = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${assetId}-${index}-${Date.now()}.${fileExt}`
  const filePath = `${assetId}/${fileName}`

  const { error } = await supabase.storage
    .from(BUCKETS.ASSET_IMAGES)
    .upload(filePath, file, { cacheControl: '3600', upsert: true })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKETS.ASSET_IMAGES)
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deleteAssetImage(imageUrl: string): Promise<void> {
  const supabase = createClient()
  try {
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/${BUCKETS.ASSET_IMAGES}/`)
    if (pathParts.length < 2) return
    await supabase.storage.from(BUCKETS.ASSET_IMAGES).remove([pathParts[1]])
  } catch {
    // Ignore deletion errors (URL may be external/invalid)
  }
}

export async function uploadEmployeePhoto(file: File, employeeId: string): Promise<string> {
  const supabase = createClient()
  
  // Create a unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${employeeId}-${Date.now()}.${fileExt}`
  const filePath = `${employeeId}/${fileName}`

  // Upload file to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKETS.EMPLOYEE_PHOTOS)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Error uploading photo:', error)
    throw error
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKETS.EMPLOYEE_PHOTOS)
    .getPublicUrl(filePath)

  return publicUrl
}

export async function deleteEmployeePhoto(photoUrl: string): Promise<void> {
  const supabase = createClient()
  
  // Extract file path from URL
  const url = new URL(photoUrl)
  const pathParts = url.pathname.split(`/${BUCKETS.EMPLOYEE_PHOTOS}/`)
  
  if (pathParts.length < 2) {
    throw new Error('Invalid photo URL')
  }
  
  const filePath = pathParts[1]

  const { error } = await supabase.storage
    .from(BUCKETS.EMPLOYEE_PHOTOS)
    .remove([filePath])

  if (error) {
    console.error('Error deleting photo:', error)
    throw error
  }
}
