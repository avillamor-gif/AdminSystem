import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reimbursementService } from '@/services/reimbursement.service'
import type { ReimbursementInsert, ReimbursementUpdate } from '@/services/reimbursement.service'
import toast from 'react-hot-toast'

export const reimbursementKeys = {
  all: ['reimbursements'] as const,
  lists: () => [...reimbursementKeys.all, 'list'] as const,
}

export function useReimbursements() {
  return useQuery({
    queryKey: reimbursementKeys.lists(),
    queryFn: () => reimbursementService.getAll(),
  })
}

export function useCreateReimbursement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ReimbursementInsert) => reimbursementService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reimbursementKeys.lists() })
      toast.success('Reimbursement created')
    },
    onError: (e: any) => toast.error(e.message || 'Error creating reimbursement'),
  })
}

export function useUpdateReimbursement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReimbursementUpdate }) =>
      reimbursementService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reimbursementKeys.lists() })
      toast.success('Reimbursement updated')
    },
    onError: (e: any) => toast.error(e.message || 'Error updating reimbursement'),
  })
}

export function useDeleteReimbursement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reimbursementService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reimbursementKeys.lists() })
      toast.success('Reimbursement deleted')
    },
    onError: (e: any) => toast.error(e.message || 'Error deleting reimbursement'),
  })
}
