import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { employeeProfileService } from '@/services/employeeProfile.service'
import type { EmployeeProfile, EmployeeProfileInsert, EmployeeProfileUpdate, ProfileFilters } from '@/services/employeeProfile.service'

// Query Keys
export const employeeProfileKeys = {
  all: ['employee-profiles'] as const,
  lists: () => [...employeeProfileKeys.all, 'list'] as const,
  list: (filters: ProfileFilters) => [...employeeProfileKeys.lists(), filters] as const,
  details: () => [...employeeProfileKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeProfileKeys.details(), id] as const,
}

// Queries
export function useEmployeeProfiles(filters?: ProfileFilters) {
  return useQuery({
    queryKey: employeeProfileKeys.list(filters || {}),
    queryFn: async () => {
      // Temporary fallback - return empty array to prevent blank page
      try {
        return await employeeProfileService.getAll(filters)
      } catch (error) {
        console.error('Employee profiles service error:', error)
        // Return empty array instead of throwing to prevent blank page
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useEmployeeProfile(id: string) {
  return useQuery({
    queryKey: employeeProfileKeys.detail(id),
    queryFn: () => employeeProfileService.getById(id),
    enabled: !!id,
  })
}

// Mutations
export function useCreateEmployeeProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: EmployeeProfileInsert) => employeeProfileService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeProfileKeys.all })
      toast.success(`Employee profile for ${data.personalInfo.firstName} ${data.personalInfo.lastName} created successfully`)
    },
    onError: (error: Error) => {
      console.error('Create employee profile error:', error)
      toast.error(error.message || 'Failed to create employee profile')
    },
  })
}

export function useUpdateEmployeeProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeProfileUpdate }) => 
      employeeProfileService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeProfileKeys.all })
      queryClient.invalidateQueries({ queryKey: employeeProfileKeys.detail(data.id) })
      toast.success(`Employee profile for ${data.personalInfo.firstName} ${data.personalInfo.lastName} updated successfully`)
    },
    onError: (error: Error) => {
      console.error('Update employee profile error:', error)
      toast.error(error.message || 'Failed to update employee profile')
    },
  })
}

export function useDeleteEmployeeProfile() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => employeeProfileService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeProfileKeys.all })
      toast.success('Employee profile deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Delete employee profile error:', error)
      toast.error(error.message || 'Failed to delete employee profile')
    },
  })
}