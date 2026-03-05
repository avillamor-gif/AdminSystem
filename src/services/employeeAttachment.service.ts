import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type EmployeeAttachment = Database['public']['Tables']['employee_attachments']['Row']
type EmployeeAttachmentInsert = Database['public']['Tables']['employee_attachments']['Insert']

export interface EmployeeAttachmentWithUploader extends EmployeeAttachment {
  uploader?: {
    first_name: string
    last_name: string
  }
}

export const employeeAttachmentService = {
  // Get all attachments for an employee
  async getAllByEmployee(employeeId: string): Promise<EmployeeAttachmentWithUploader[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_attachments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching employee attachments:', error)
      throw new Error('Failed to fetch employee attachments')
    }

    return data as EmployeeAttachmentWithUploader[]
  },

  // Create new attachment record
  async create(attachmentData: EmployeeAttachmentInsert): Promise<EmployeeAttachment> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('employee_attachments')
      .insert(attachmentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating attachment record:', error)
      throw new Error(error.message || 'Failed to create attachment record')
    }

    return data
  },

  // Delete attachment record and file
  async delete(id: string, filePath: string): Promise<void> {
    const supabase = createClient()
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([filePath])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      throw new Error('Failed to delete file from storage')
    }

    // Then delete database record
    const { error: dbError } = await supabase
      .from('employee_attachments')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Error deleting attachment record:', dbError)
      throw new Error('Failed to delete attachment record')
    }
  },

  // Upload file to Supabase Storage
  async uploadFile(employeeId: string, file: File): Promise<string> {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${employeeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error } = await supabase.storage
      .from('attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      throw new Error('Failed to upload file')
    }

    return fileName
  },

  // Download file from Supabase Storage
  async downloadFile(filePath: string): Promise<Blob> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('attachments')
      .download(filePath)

    if (error) {
      console.error('Error downloading file:', error)
      throw new Error('Failed to download file')
    }

    return data
  },
}
