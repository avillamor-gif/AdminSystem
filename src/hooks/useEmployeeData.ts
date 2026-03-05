import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customFieldsService, customFieldValuesService, pimConfigService, dataImportService } from '@/services/employeeData.service'
import type { CustomField, CustomFieldValue, PIMFieldConfig, DataImportLog } from '@/services/employeeData.service'
import { toast } from 'sonner'

// Query Keys
export const customFieldsKeys = {
  all: ['custom-fields'] as const,
  lists: () => [...customFieldsKeys.all, 'list'] as const,
  list: (filters: any) => [...customFieldsKeys.lists(), filters] as const,
  details: () => [...customFieldsKeys.all, 'detail'] as const,
  detail: (id: string) => [...customFieldsKeys.details(), id] as const,
}

export const pimConfigKeys = {
  all: ['pim-config'] as const,
  lists: () => [...pimConfigKeys.all, 'list'] as const,
  list: (filters: any) => [...pimConfigKeys.lists(), filters] as const,
}

export const dataImportKeys = {
  all: ['data-imports'] as const,
  lists: () => [...dataImportKeys.all, 'list'] as const,
  list: (filters: any) => [...dataImportKeys.lists(), filters] as const,
}

// Custom Fields Hooks
export function useCustomFields(filters?: { category?: string; status?: string }) {
  return useQuery({
    queryKey: customFieldsKeys.list(filters || {}),
    queryFn: () => customFieldsService.getAll(filters),
  })
}

export function useCustomField(id: string) {
  return useQuery({
    queryKey: customFieldsKeys.detail(id),
    queryFn: () => customFieldsService.getById(id),
    enabled: !!id,
  })
}

export function useCreateCustomField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (field: Omit<CustomField, 'id' | 'created_at' | 'updated_at'>) =>
      customFieldsService.create(field),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.all })
      toast.success('Custom field created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create custom field')
    },
  })
}

export function useUpdateCustomField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CustomField> }) =>
      customFieldsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.all })
      toast.success('Custom field updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update custom field')
    },
  })
}

export function useDeleteCustomField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customFieldsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.all })
      toast.success('Custom field deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete custom field')
    },
  })
}

export function useReorderCustomFields() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fieldIds: string[]) => customFieldsService.reorder(fieldIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customFieldsKeys.all })
      toast.success('Field order updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reorder fields')
    },
  })
}

// Custom Field Values Hooks
export function useEmployeeCustomFields(employeeId: string) {
  return useQuery({
    queryKey: ['employee-custom-fields', employeeId],
    queryFn: () => customFieldValuesService.getByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

export function useUpsertCustomFieldValue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ employeeId, fieldId, value }: { employeeId: string; fieldId: string; value: string | string[] }) =>
      customFieldValuesService.upsert(employeeId, fieldId, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee-custom-fields', variables.employeeId] })
      toast.success('Field value updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update field value')
    },
  })
}

// PIM Configuration Hooks
export function usePIMConfig(filters?: { field_group?: string }) {
  return useQuery({
    queryKey: pimConfigKeys.list(filters || {}),
    queryFn: () => pimConfigService.getAll(filters),
  })
}

export function useUpdatePIMConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PIMFieldConfig> }) =>
      pimConfigService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pimConfigKeys.all })
      toast.success('PIM configuration updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update PIM configuration')
    },
  })
}

export function useBulkUpdatePIMConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (configs: Array<{ id: string; updates: Partial<PIMFieldConfig> }>) =>
      pimConfigService.bulkUpdate(configs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pimConfigKeys.all })
      toast.success('PIM configurations updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update PIM configurations')
    },
  })
}

// Data Import Hooks
export function useDataImports(filters?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: dataImportKeys.list(filters || {}),
    queryFn: () => dataImportService.getAll(filters),
  })
}

export function useCreateDataImport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (importLog: Omit<DataImportLog, 'id' | 'created_at'>) =>
      dataImportService.create(importLog),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataImportKeys.all })
      toast.success('Import log created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create import log')
    },
  })
}

export function useUpdateImportStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, updates }: { id: string; status: DataImportLog['status']; updates?: Partial<DataImportLog> }) =>
      dataImportService.updateStatus(id, status, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataImportKeys.all })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update import status')
    },
  })
}
