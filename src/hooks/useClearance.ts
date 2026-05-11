import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clearanceService } from '@/services'
import type { ClearanceChecklistInsert } from '@/services'
import toast from 'react-hot-toast'

export const clearanceKeys = {
  all: ['clearance_checklists'] as const,
  lists: () => [...clearanceKeys.all, 'list'] as const,
  detail: (id: string) => [...clearanceKeys.all, 'detail', id] as const,
  byEmployee: (id: string) => [...clearanceKeys.all, 'employee', id] as const,
}

export function useClearanceChecklists() {
  return useQuery({
    queryKey: clearanceKeys.lists(),
    queryFn: () => clearanceService.getAll(),
  })
}

export function useClearanceChecklist(id: string) {
  return useQuery({
    queryKey: clearanceKeys.detail(id),
    queryFn: () => clearanceService.getById(id),
    enabled: !!id,
  })
}

export function useClearanceByEmployee(employeeId: string) {
  return useQuery({
    queryKey: clearanceKeys.byEmployee(employeeId),
    queryFn: () => clearanceService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useCreateClearanceChecklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClearanceChecklistInsert) => clearanceService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clearanceKeys.lists() })
      toast.success('Clearance checklist created')
    },
    onError: () => toast.error('Failed to create clearance checklist'),
  })
}

export function useUpdateClearanceChecklist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof clearanceService.update>[1] }) =>
      clearanceService.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: clearanceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clearanceKeys.detail(id) })
      toast.success('Checklist updated')
    },
    onError: () => toast.error('Failed to update checklist'),
  })
}

export function useClearChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, clearedBy, remarks }: { itemId: string; clearedBy: string; remarks?: string }) =>
      clearanceService.clearItem(itemId, clearedBy, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clearanceKeys.all })
      toast.success('Item cleared')
    },
    onError: () => toast.error('Failed to clear item'),
  })
}
