import { createClient } from '@/lib/supabase/client'

export interface OrgDocument {
  id: string
  name: string
  description: string | null
  category: string
  file_url: string
  file_name: string | null
  file_size: number | null
  file_type: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface OrgDocumentInsert {
  name: string
  description?: string
  category: string
  file_url: string
  file_name?: string
  file_size?: number
  file_type?: string
}

export const DOCUMENT_CATEGORIES = [
  'Manual of Operations',
  'Government Permit',
  'Certificate / Accreditation',
  'Legal Document',
  'Financial Report',
  'Memorandum / Policy',
  'Partnership Agreement',
  'General',
]

const BUCKET = 'org-documents'

export const orgDocumentService = {
  async getAll(): Promise<OrgDocument[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('org_documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  async getSignedUrl(filePath: string): Promise<string> {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60 * 60) // 1 hour
    if (error) throw error
    return data.signedUrl
  },

  async uploadFile(file: File): Promise<{ path: string; url: string }> {
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file)
    if (error) throw error
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
    return { path, url: signed?.signedUrl ?? '' }
  },

  async deleteFile(filePath: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.storage.from(BUCKET).remove([filePath])
    if (error) throw error
  },
}

// Writes go through API route (service-role for RLS bypass)
export async function createOrgDocument(data: OrgDocumentInsert): Promise<OrgDocument> {
  const res = await fetch('/api/admin/org-documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteOrgDocument(id: string): Promise<void> {
  const res = await fetch(`/api/admin/org-documents?id=${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
}
