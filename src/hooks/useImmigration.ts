import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  immigrationService,
  type ImmigrationDocument,
  type ImmigrationDocumentInsert,
  type ImmigrationDocumentUpdate,
} from '@/services/immigration.service'

export type { ImmigrationDocument, ImmigrationDocumentInsert, ImmigrationDocumentUpdate }

export const immigrationKeys = {
  all: ['employee_immigration'] as const,
  byEmployee: (employeeId: string) => [...immigrationKeys.all, 'employee', employeeId] as const,
}

export function useImmigrationDocuments(employeeId: string) {
  return useQuery({
    queryKey: immigrationKeys.byEmployee(employeeId),
    queryFn: () => immigrationService.getAllByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useCreateImmigrationDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImmigrationDocumentInsert) => immigrationService.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: immigrationKeys.byEmployee(variables.employee_id) })
      toast.success('Immigration document saved')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save immigration document')
    },
  })
}

export function useUpdateImmigrationDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data, employeeId }: { id: string; data: ImmigrationDocumentUpdate; employeeId: string }) =>
      immigrationService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: immigrationKeys.byEmployee(variables.employeeId) })
      toast.success('Immigration document updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update immigration document')
    },
  })
}

export function useDeleteImmigrationDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      immigrationService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: immigrationKeys.byEmployee(variables.employeeId) })
      toast.success('Immigration document deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete immigration document')
    },
  })
}
