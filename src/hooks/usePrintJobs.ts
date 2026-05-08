import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { printJobService, type PrintJobRequest, type DistributionPlanRow } from '@/services/printJob.service'
import toast from 'react-hot-toast'

export { type PrintJobRequest, type DistributionPlanRow } from '@/services/printJob.service'

// ── Query keys ────────────────────────────────────────────────────────────────
export const printJobKeys = {
  all:          ['print_jobs'] as const,
  lists:        ()             => [...printJobKeys.all, 'list'] as const,
  list:         (f: object)    => [...printJobKeys.lists(), f]  as const,
  distribution: (id: string)  => [...printJobKeys.all, 'dist', id] as const,
  presses:      ()             => ['printing_presses'] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────
export function usePrintJobs(
  filters: { status?: string; type?: string; search?: string } = {},
) {
  return useQuery({
    queryKey: printJobKeys.list(filters),
    queryFn:  () => printJobService.getAll(filters),
  })
}

export function usePrintJobDistributionPlan(printJobId: string) {
  return useQuery({
    queryKey: printJobKeys.distribution(printJobId),
    queryFn:  () => printJobService.getDistributionPlan(printJobId),
    enabled:  !!printJobId,
  })
}

export function usePrintingPresses() {
  return useQuery({
    queryKey: printJobKeys.presses(),
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('printing_presses')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (error) throw error
      return (data ?? []) as { id: string; name: string }[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────
export function useCreatePrintJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      jobData,
      distPlan,
    }: {
      jobData: Partial<PrintJobRequest>
      distPlan: DistributionPlanRow[]
    }) => printJobService.createWithDistribution(jobData, distPlan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: printJobKeys.lists() })
      toast.success('Print job request created')
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to create print job'),
  })
}

export function useUpdatePrintJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      jobData,
      distPlan,
    }: {
      id: string
      jobData: Partial<PrintJobRequest>
      distPlan?: DistributionPlanRow[]
    }) => printJobService.updateWithDistribution(id, jobData, distPlan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: printJobKeys.lists() })
      toast.success('Print job updated')
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to update print job'),
  })
}

export function useDeletePrintJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => printJobService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: printJobKeys.lists() })
      toast.success('Print job deleted')
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to delete print job'),
  })
}

export function useAdvancePrintJobStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
      pressId,
    }: {
      id: string
      status: string
      notes?: string
      pressId?: string
    }) => printJobService.advanceStatus(id, status, notes, pressId),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: printJobKeys.lists() })
      const LABELS: Record<string, string> = {
        submitted:    'Submitted for review',
        approved:     'Request approved',
        press_assigned: 'Printing press assigned',
        in_production:  'Marked as In Production',
        quality_check:  'Moved to Quality Check',
        ready:          'Marked as Ready',
        distributing:   'Distribution started',
        completed:      'Print job completed ✓',
        rejected:       'Request rejected',
        cancelled:      'Request cancelled',
      }
      toast.success(LABELS[status] ?? 'Status updated')
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to update status'),
  })
}
