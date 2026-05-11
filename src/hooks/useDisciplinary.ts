import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { disciplinaryService } from '@/services'
import type { DisciplinaryFilters, DisciplinaryRecordInsert } from '@/services'
import toast from 'react-hot-toast'

export const disciplinaryKeys = {
  all: ['disciplinary_records'] as const,
  lists: () => [...disciplinaryKeys.all, 'list'] as const,
  list: (filters: DisciplinaryFilters) => [...disciplinaryKeys.lists(), filters] as const,
  byEmployee: (id: string) => [...disciplinaryKeys.all, 'employee', id] as const,
}

export function useDisciplinaryRecords(filters: DisciplinaryFilters = {}) {
  return useQuery({
    queryKey: disciplinaryKeys.list(filters),
    queryFn: () => disciplinaryService.getAll(filters),
  })
}

export function useDisciplinaryByEmployee(employeeId: string) {
  return useQuery({
    queryKey: disciplinaryKeys.byEmployee(employeeId),
    queryFn: () => disciplinaryService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useCreateDisciplinaryRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DisciplinaryRecordInsert) => disciplinaryService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplinaryKeys.lists() })
      toast.success('Disciplinary record created')
    },
    onError: () => toast.error('Failed to create disciplinary record'),
  })
}

export function useUpdateDisciplinaryRecord() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof disciplinaryService.update>[1] }) =>
      disciplinaryService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: disciplinaryKeys.lists() })
      toast.success('Record updated')
    },
    onError: () => toast.error('Failed to update record'),
  })
}
