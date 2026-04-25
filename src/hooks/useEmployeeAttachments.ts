import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeAttachmentService, type EmployeeAttachmentWithUploader } from '@/services'
import { toast } from 'sonner'

const attachmentKeys = {
  all: ['employee-attachments'] as const,
  byEmployee: (employeeId: string) => [...attachmentKeys.all, 'employee', employeeId] as const,
}

export function useEmployeeAttachments(employeeId: string) {
  return useQuery({
    queryKey: attachmentKeys.byEmployee(employeeId),
    queryFn: () => employeeAttachmentService.getAllByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useUploadEmployeeAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      employeeId,
      file,
      description,
      documentType,
      uploadedBy,
      employeeName,
    }: {
      employeeId: string
      file: File
      description?: string
      documentType?: string
      uploadedBy?: string
      employeeName?: string
    }) => {
      // Upload file to storage
      const filePath = await employeeAttachmentService.uploadFile(employeeId, file)

      // Create database record
      const record = await employeeAttachmentService.create({
        employee_id: employeeId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type.split('/')[1] || 'unknown',
        mime_type: file.type,
        description,
        document_type: documentType,
        uploaded_by: uploadedBy || null,
      })
      return { record, filePath, mimeType: file.type, employeeName }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.byEmployee(variables.employeeId) })
      toast.success('File uploaded successfully')

      // Mirror to Google Drive (fire-and-forget)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        const fileUrl = `${supabaseUrl}/storage/v1/object/public/attachments/${result.filePath}`
        fetch('/api/google/drive/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'attachment',
            fileUrl,
            fileName: result.record.file_name,
            mimeType: result.mimeType,
            employeeId: variables.employeeId,
            employeeName: result.employeeName,
            documentType: variables.documentType,
          }),
        }).catch(err => console.warn('[Drive Sync] attachment mirror failed:', err))
      }
    },
    onError: (error: Error) => {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload file')
    },
  })
}

export function useDeleteEmployeeAttachment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, filePath, employeeId }: { id: string; filePath: string; employeeId: string }) => {
      await employeeAttachmentService.delete(id, filePath)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: attachmentKeys.byEmployee(variables.employeeId) })
      toast.success('File deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Delete error:', error)
      toast.error(error.message || 'Failed to delete file')
    },
  })
}

export function useDownloadEmployeeAttachment() {
  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const blob = await employeeAttachmentService.downloadFile(filePath)
      
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
      toast.error(error.message || 'Failed to download file')
    },
  })
}
