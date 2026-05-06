import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { committeeService, type CommitteeInsert, type CommitteeUpdate, type CommitteeMember } from '@/services/committee.service'
import { toast } from 'sonner'

export const committeeKeys = {
  all: ['committees'] as const,
  lists: () => [...committeeKeys.all, 'list'] as const,
  byEmployee: (empId: string) => [...committeeKeys.all, 'employee', empId] as const,
}

export function useCommittees() {
  return useQuery({
    queryKey: committeeKeys.lists(),
    queryFn: () => committeeService.getAll(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useEmployeeCommittees(employeeId: string) {
  return useQuery({
    queryKey: committeeKeys.byEmployee(employeeId),
    queryFn: () => committeeService.getByEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCommittee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CommitteeInsert) => committeeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      toast.success('Committee created')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to create committee'),
  })
}

export function useUpdateCommittee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CommitteeUpdate }) => committeeService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      toast.success('Committee updated')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to update committee'),
  })
}

export function useDeleteCommittee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => committeeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.lists() })
      toast.success('Committee deleted')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to delete committee'),
  })
}

export function useAddCommitteeMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ committeeId, employeeId, role, joinedAt }: { committeeId: string; employeeId: string; role?: CommitteeMember['role']; joinedAt?: string }) =>
      committeeService.addMember(committeeId, employeeId, role, joinedAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.all })
      toast.success('Member added')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to add member'),
  })
}

export function useUpdateCommitteeMemberRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: CommitteeMember['role'] }) =>
      committeeService.updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.all })
      toast.success('Role updated')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to update role'),
  })
}

export function useRemoveCommitteeMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (memberId: string) => committeeService.removeMember(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: committeeKeys.all })
      toast.success('Member removed')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to remove member'),
  })
}
