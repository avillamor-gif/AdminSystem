import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { departmentService, type DepartmentInsert, type DepartmentUpdate } from '@/services'
import toast from 'react-hot-toast'

export const departmentKeys = {
  all: ['departments'] as const,
}

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: async () => {
      try {
        return await departmentService.getAll()
      } catch (error) {
        console.error('Departments service error:', error)
        // Return empty array instead of throwing to prevent blank page
        return []
      }
    },
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DepartmentInsert) => departmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      toast.success('Department created')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create department')
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentUpdate }) =>
      departmentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      toast.success('Department updated')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update department')
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => departmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all })
      toast.success('Department deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete department')
    },
  })
}
