import { createClient } from './client'

export const BUCKETS = {
  EMPLOYEE_PHOTOS: 'employee-photos',
  DOCUMENTS: 'documents',
  ATTACHMENTS: 'attachments',
} as const

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
