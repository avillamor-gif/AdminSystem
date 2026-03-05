import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeService, type EmployeeFilters, type EmployeeInsert, type EmployeeUpdate } from '@/services'
import toast from 'react-hot-toast'

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeFilters) => [...employeeKeys.lists(), filters] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
}

export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: employeeKeys.list(filters || {}),
    queryFn: async () => {
      console.log('Fetching employees with filters:', filters)
      try {
        const result = await employeeService.getAll(filters)
        console.log('Employees fetched successfully:', result?.length || 0)
        return result
      } catch (error) {
        console.error('Employee fetch error:', error)
        throw error
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
    retryDelay: 1000,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeeService.getById(id),
    enabled: !!id,
  })
}

export function useEmployeeByEmployeeId(employeeId: string) {
  return useQuery({
    queryKey: [...employeeKeys.all, 'by-employee-id', employeeId] as const,
    queryFn: () => employeeService.getByEmployeeId(employeeId),
    enabled: !!employeeId,
  })
}

export function useCurrentEmployee() {
  return useQuery({
    queryKey: [...employeeKeys.all, 'current'] as const,
    queryFn: () => employeeService.getCurrentEmployee(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: EmployeeInsert) => employeeService.create(data),
    onSuccess: (newEmployee) => {
      console.log('Employee created successfully:', newEmployee)
      
      // Invalidate and refetch all employee queries
      queryClient.invalidateQueries({ queryKey: employeeKeys.all })
      queryClient.refetchQueries({ queryKey: employeeKeys.all })
      
      toast.success('Employee created successfully')
    },
    onError: (error: any) => {
      console.error('Error creating employee:', error)
      
      // Handle specific database errors
      if (error?.code === '23505' && error?.details?.includes('email')) {
        toast.error('This email address is already in use by another employee')
      } else if (error?.code === '23505' && error?.details?.includes('employee_id')) {
        toast.error('This employee ID already exists')
      } else {
        toast.error(error?.message || 'Failed to create employee')
      }
    },
  })
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeUpdate }) =>
      employeeService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
      toast.success('Employee updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update employee')
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => employeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      toast.success('Employee deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete employee')
    },
  })
}
