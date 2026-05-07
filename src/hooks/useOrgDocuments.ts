import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  orgDocumentService,
  createOrgDocument,
  deleteOrgDocument,
  type OrgDocumentInsert,
} from '@/services/orgDocument.service'

export const orgDocumentKeys = {
  all:   ['org_documents'] as const,
  lists: () => [...orgDocumentKeys.all, 'list'] as const,
}

export function useOrgDocuments() {
  return useQuery({
    queryKey: orgDocumentKeys.lists(),
    queryFn:  () => orgDocumentService.getAll(),
  })
}

export function useCreateOrgDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OrgDocumentInsert) => createOrgDocument(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: orgDocumentKeys.lists() })
      toast.success('Document uploaded successfully')

      // Mirror to Google Drive (fire-and-forget)
      if (result.file_url && result.file_name) {
        fetch('/api/google/drive/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'org_document',
            fileUrl: result.file_url,
            fileName: result.file_name,
            mimeType: result.file_type ?? 'application/octet-stream',
            documentCategory: result.category,
          }),
        }).catch(err => console.error('[Drive Sync] org document mirror failed:', err?.message ?? err))
      }
    },
    onError: () => toast.error('Failed to upload document'),
  })
}

export function useDeleteOrgDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, filePath }: { id: string; filePath?: string }) =>
      Promise.all([
        deleteOrgDocument(id),
        filePath ? orgDocumentService.deleteFile(filePath) : Promise.resolve(),
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgDocumentKeys.lists() })
      toast.success('Document deleted')
    },
    onError: () => toast.error('Failed to delete document'),
  })
}
