import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  programService,
  projectService,
  indicatorService,
  dataEntryService,
  meReportService,
  type MEProgram,
  type MEProject,
  type MEIndicator,
  type MEDataEntry,
  type MEReport,
} from '@/services/monitoring.service'

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const meKeys = {
  all: ['me'] as const,
  programs: () => [...meKeys.all, 'programs'] as const,
  projects: (programId?: string) => [...meKeys.all, 'projects', programId ?? 'all'] as const,
  indicators: (filters?: { program_id?: string; project_id?: string }) =>
    [...meKeys.all, 'indicators', JSON.stringify(filters ?? {})] as const,
  dataEntries: (indicatorId?: string) => [...meKeys.all, 'data-entries', indicatorId ?? 'all'] as const,
  reports: () => [...meKeys.all, 'reports'] as const,
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export function usePrograms() {
  return useQuery({ queryKey: meKeys.programs(), queryFn: () => programService.getAll() })
}

export function useCreateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<MEProgram, 'id' | 'created_at' | 'updated_at' | 'lead_staff'>) =>
      programService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.programs() })
      toast.success('Program created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MEProgram> }) =>
      programService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.programs() })
      toast.success('Program updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteProgram() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => programService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.programs() })
      toast.success('Program deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function useProjects(programId?: string) {
  return useQuery({
    queryKey: meKeys.projects(programId),
    queryFn: () => projectService.getAll(programId),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<MEProject, 'id' | 'created_at' | 'updated_at' | 'program' | 'lead_staff'>) =>
      projectService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.projects() })
      toast.success('Project created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MEProject> }) =>
      projectService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.projects() })
      toast.success('Project updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.projects() })
      toast.success('Project deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Indicators ───────────────────────────────────────────────────────────────

export function useIndicators(filters?: { program_id?: string; project_id?: string }) {
  return useQuery({
    queryKey: meKeys.indicators(filters),
    queryFn: () => indicatorService.getAll(filters),
  })
}

export function useCreateIndicator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Omit<MEIndicator, 'id' | 'created_at' | 'updated_at' | 'program' | 'project' | 'responsible_staff'>
    ) => indicatorService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.indicators() })
      toast.success('Indicator created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateIndicator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MEIndicator> }) =>
      indicatorService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.indicators() })
      toast.success('Indicator updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteIndicator() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => indicatorService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.indicators() })
      toast.success('Indicator deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Data Entries ─────────────────────────────────────────────────────────────

export function useDataEntries(indicatorId?: string) {
  return useQuery({
    queryKey: meKeys.dataEntries(indicatorId),
    queryFn: () => dataEntryService.getAll(indicatorId),
  })
}

export function useCreateDataEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Omit<MEDataEntry, 'id' | 'created_at' | 'updated_at' | 'indicator' | 'entered_by_emp'>
    ) => dataEntryService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.dataEntries() })
      toast.success('Data entry saved')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateDataEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MEDataEntry> }) =>
      dataEntryService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.dataEntries() })
      toast.success('Data entry updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteDataEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dataEntryService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.dataEntries() })
      toast.success('Entry deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export function useMEReports() {
  return useQuery({ queryKey: meKeys.reports(), queryFn: () => meReportService.getAll() })
}

export function useCreateMEReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      data: Omit<MEReport, 'id' | 'created_at' | 'updated_at' | 'program' | 'project' | 'prepared_by_emp'>
    ) => meReportService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.reports() })
      toast.success('Report created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateMEReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MEReport> }) =>
      meReportService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.reports() })
      toast.success('Report updated')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteMEReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => meReportService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: meKeys.reports() })
      toast.success('Report deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
