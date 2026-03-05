import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  emergencyContactService, 
  type EmergencyContact, 
  type EmergencyContactInsert, 
  type EmergencyContactUpdate 
} from '@/services/emergencyContact.service'

export const emergencyContactKeys = {
  all: ['emergencyContacts'] as const,
  byEmployee: (employeeId: string) => [...emergencyContactKeys.all, 'employee', employeeId] as const,
  detail: (id: string) => [...emergencyContactKeys.all, 'detail', id] as const,
}

export function useEmergencyContacts(employeeId: string) {
  return useQuery({
    queryKey: emergencyContactKeys.byEmployee(employeeId),
    queryFn: () => emergencyContactService.getAllByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useEmergencyContact(id: string) {
  return useQuery({
    queryKey: emergencyContactKeys.detail(id),
    queryFn: () => emergencyContactService.getById(id),
    enabled: !!id,
  })
}

export function useCreateEmergencyContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: EmergencyContactInsert) => emergencyContactService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: emergencyContactKeys.byEmployee(data.employee_id) })
      toast.success('Emergency contact created successfully')
    },
    onError: (error) => {
      console.error('Error creating emergency contact:', error)
      toast.error('Failed to create emergency contact')
    },
  })
}

export function useUpdateEmergencyContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmergencyContactUpdate }) => 
      emergencyContactService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: emergencyContactKeys.byEmployee(data.employee_id) })
      queryClient.invalidateQueries({ queryKey: emergencyContactKeys.detail(data.id) })
      toast.success('Emergency contact updated successfully')
    },
    onError: (error) => {
      console.error('Error updating emergency contact:', error)
      toast.error('Failed to update emergency contact')
    },
  })
}

export function useDeleteEmergencyContact() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => emergencyContactService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergencyContactKeys.all })
      toast.success('Emergency contact deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting emergency contact:', error)
      toast.error('Failed to delete emergency contact')
    },
  })
}
