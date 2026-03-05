import { createClient } from '@/lib/supabase/client'

export interface ContractDocument {
  id: string
  employee_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  description?: string
  uploaded_by?: string
  created_at: string
  updated_at: string
  uploader?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
  }
}

export interface ContractDocumentInsert {
  employee_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  description?: string
  uploaded_by?: string
}

export const contractDocumentService = {
  /**
   * Get all contract documents for an employee
   */
  async getAllByEmployee(employeeId: string): Promise<ContractDocument[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('contract_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contract documents:', error)
      throw error
    }

    return (data as ContractDocument[]) || []
  },

  /**
   * Create a new contract document record
   */
  async create(document: ContractDocumentInsert): Promise<ContractDocument> {
    const supabase = createClient()
    
    console.log('Creating contract document record:', document)
    
    const { data, error } = await supabase
      .from('contract_documents')
      .insert(document)
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      console.error('Error code:', error.code, 'Message:', error.message)
      throw new Error(`Failed to create contract record: ${error.message}`)
    }

    console.log('Contract document record created:', data)
    return data as ContractDocument
  },

  /**
   * Delete a contract document record and file
   */
  async delete(id: string, filePath: string): Promise<void> {
    const supabase = createClient()
    
    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('contracts')
      .remove([filePath])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      throw storageError
    }

    // Delete database record
    const { error } = await supabase
      .from('contract_documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting contract document:', error)
      throw error
    }
  },

  /**
   * Upload a contract file to Supabase Storage
   */
  async uploadFile(file: File, employeeId: string): Promise<string> {
    const supabase = createClient()
    
    console.log('uploadFile called:', { fileName: file.name, employeeId })
    
    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${employeeId}/${Date.now()}.${fileExt}`

    console.log('Uploading to path:', fileName)

    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      console.error('Error code:', error.message)
      throw new Error(`Storage upload failed: ${error.message}`)
    }

    console.log('Storage upload successful:', data)
    return data.path
  },

  /**
   * Get public URL for a contract file
   */
  getPublicUrl(filePath: string): string {
    const supabase = createClient()
    const { data } = supabase.storage
      .from('contracts')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  /**
   * Download a contract file
   */
  async downloadFile(filePath: string): Promise<Blob> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('contracts')
      .download(filePath)

    if (error) {
      console.error('Error downloading file:', error)
      throw error
    }

    return data
  },

  /**
   * Get a signed URL for viewing a contract file
   */
  async getViewUrl(filePath: string): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('contracts')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error)
      throw error
    }

    return data.signedUrl
  }
}
