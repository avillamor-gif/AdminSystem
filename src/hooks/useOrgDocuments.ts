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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgDocumentKeys.lists() })
      toast.success('Document uploaded successfully')
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
