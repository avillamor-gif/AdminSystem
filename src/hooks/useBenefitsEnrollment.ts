import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { benefitsEnrollmentService, bereavementService } from '@/services'
import type { EnrollmentInsert, BereavementClaimInsert } from '@/services'
import toast from 'react-hot-toast'

// ── Enrollment hooks ──────────────────────────────────────────

export const enrollmentKeys = {
  all: ['benefits_enrollment'] as const,
  lists: () => [...enrollmentKeys.all, 'list'] as const,
  byEmployee: (id: string) => [...enrollmentKeys.all, 'employee', id] as const,
}

export function useBenefitsEnrollments() {
  return useQuery({
    queryKey: enrollmentKeys.lists(),
    queryFn: () => benefitsEnrollmentService.getAll(),
  })
}

export function useMyBenefitsEnrollments(employeeId: string) {
  return useQuery({
    queryKey: enrollmentKeys.byEmployee(employeeId),
    queryFn: () => benefitsEnrollmentService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useEnrollBenefit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EnrollmentInsert) => benefitsEnrollmentService.enroll(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      toast.success('Employee enrolled in benefit')
    },
    onError: () => toast.error('Failed to enroll'),
  })
}

export function useTerminateBenefit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, endDate }: { id: string; endDate: string }) =>
      benefitsEnrollmentService.terminate(id, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all })
      toast.success('Benefit enrollment ended')
    },
    onError: () => toast.error('Failed to terminate benefit'),
  })
}

// ── Bereavement hooks ─────────────────────────────────────────

export const bereavementKeys = {
  all: ['bereavement_claims'] as const,
  lists: () => [...bereavementKeys.all, 'list'] as const,
  byEmployee: (id: string) => [...bereavementKeys.all, 'employee', id] as const,
}

export function useBereavementClaims() {
  return useQuery({
    queryKey: bereavementKeys.lists(),
    queryFn: () => bereavementService.getAll(),
  })
}

export function useMyBereavementClaims(employeeId: string) {
  return useQuery({
    queryKey: bereavementKeys.byEmployee(employeeId),
    queryFn: () => bereavementService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useCreateBereavementClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BereavementClaimInsert) => bereavementService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bereavementKeys.all })
      toast.success('Bereavement assistance claim submitted')
    },
    onError: () => toast.error('Failed to submit claim'),
  })
}

export function useApproveBereavementClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approverId }: { id: string; approverId: string }) =>
      bereavementService.approve(id, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bereavementKeys.all })
      toast.success('Claim approved')
    },
    onError: () => toast.error('Failed to approve claim'),
  })
}

export function useReleaseBereavementClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bereavementService.release(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bereavementKeys.all })
      toast.success('PHP 15,000 bereavement assistance released')
    },
    onError: () => toast.error('Failed to mark as released'),
  })
}
