import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractDocumentService, ContractDocumentInsert } from '@/services/contractDocument.service'
import { toast } from 'sonner'

export const contractDocumentKeys = {
  all: ['contract-documents'] as const,
  lists: () => [...contractDocumentKeys.all, 'list'] as const,
  list: (employeeId: string) => [...contractDocumentKeys.lists(), employeeId] as const,
}

/**
 * Hook to fetch all contract documents for an employee
 */
export function useContractDocuments(employeeId: string) {
  return useQuery({
    queryKey: contractDocumentKeys.list(employeeId),
    queryFn: () => contractDocumentService.getAllByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

/**
 * Hook to upload and create a contract document
 */
export function useUploadContractDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      file, 
      employeeId, 
      uploadedBy, 
      description,
      employeeName,
    }: { 
      file: File
      employeeId: string
      uploadedBy?: string
      description?: string
      employeeName?: string
    }) => {
      // Upload file to storage
      const filePath = await contractDocumentService.uploadFile(file, employeeId)

      // Create database record
      const documentData: ContractDocumentInsert = {
        employee_id: employeeId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        description,
        uploaded_by: uploadedBy,
      }

      const record = await contractDocumentService.create(documentData)
      return { record, filePath, mimeType: file.type, employeeName }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: contractDocumentKeys.list(variables.employeeId) 
      })
      toast.success('Contract document uploaded successfully')

      // Mirror to Google Drive (fire-and-forget)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/contracts/${result.filePath}`
        fetch('/api/google/drive/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'contract',
            fileUrl,
            fileName: result.record.file_name,
            mimeType: result.mimeType,
            employeeId: variables.employeeId,
            employeeName: result.employeeName,
          }),
        }).catch(err => console.warn('[Drive Sync] contract mirror failed:', err))
      }
    },
    onError: (error: Error) => {
      console.error('Upload error:', error)
      toast.error('Failed to upload contract document')
    },
  })
}

/**
 * Hook to delete a contract document
 */
export function useDeleteContractDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      filePath, 
      employeeId 
    }: { 
      id: string
      filePath: string
      employeeId: string
    }) => {
      await contractDocumentService.delete(id, filePath)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: contractDocumentKeys.list(variables.employeeId) 
      })
      toast.success('Contract document deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Delete error:', error)
      toast.error('Failed to delete contract document')
    },
  })
}

/**
 * Hook to download a contract document
 */
export function useDownloadContractDocument() {
  return useMutation({
    mutationFn: async ({ 
      filePath, 
      fileName 
    }: { 
      filePath: string
      fileName: string
    }) => {
      const blob = await contractDocumentService.downloadFile(filePath)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onError: (error: Error) => {
      console.error('Download error:', error)
      toast.error('Failed to download contract document')
    },
  })
}
