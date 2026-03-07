import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeAssetService, EmployeeAssetInsert, AssetReturnData } from '@/services/employeeAsset.service'
import { logAction } from '@/services/auditLog.service'
import { toast } from 'sonner'

export const employeeAssetKeys = {
  all: ['employee-assets'] as const,
  lists: () => [...employeeAssetKeys.all, 'list'] as const,
  list: (employeeId: string) => [...employeeAssetKeys.lists(), employeeId] as const,
  unreturned: (employeeId: string) => [...employeeAssetKeys.all, 'unreturned', employeeId] as const,
}

/**
 * Hook to fetch all assets for an employee
 */
export function useEmployeeAssets(employeeId: string) {
  return useQuery({
    queryKey: employeeAssetKeys.list(employeeId),
    queryFn: () => employeeAssetService.getAllByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

/**
 * Hook to fetch unreturned assets for an employee
 */
export function useUnreturnedAssets(employeeId: string) {
  return useQuery({
    queryKey: employeeAssetKeys.unreturned(employeeId),
    queryFn: () => employeeAssetService.getUnreturnedByEmployee(employeeId),
    enabled: !!employeeId,
  })
}

/**
 * Hook to check if employee has unreturned assets
 */
export function useHasUnreturnedAssets(employeeId: string) {
  return useQuery({
    queryKey: [...employeeAssetKeys.all, 'has-unreturned', employeeId],
    queryFn: () => employeeAssetService.hasUnreturnedAssets(employeeId),
    enabled: !!employeeId,
  })
}

/**
 * Hook to create a new asset assignment
 */
export function useCreateEmployeeAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (asset: EmployeeAssetInsert) => employeeAssetService.create(asset),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: employeeAssetKeys.list(data.employee_id) })
      queryClient.invalidateQueries({ queryKey: employeeAssetKeys.unreturned(data.employee_id) })
      logAction({
        employee_id: data.employee_id,
        action: 'Asset Assigned',
        details: `Asset assigned to employee`,
      })
      toast.success('Asset assigned successfully')
    },
    onError: (error: Error) => {
      console.error('Create asset error:', error)
      toast.error('Failed to assign asset')
    },
  })
}

/**
 * Hook to mark asset as returned
 */
export function useReturnEmployeeAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, returnData, employeeId }: { id: string; returnData: AssetReturnData; employeeId: string }) =>
      employeeAssetService.markAsReturned(id, returnData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeAssetKeys.list(variables.employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeAssetKeys.unreturned(variables.employeeId) })
      logAction({
        employee_id: variables.employeeId,
        action: 'Asset Returned',
        details: `Asset marked as returned`,
      })
      toast.success('Asset marked as returned')
    },
    onError: (error: Error) => {
      console.error('Return asset error:', error)
      toast.error('Failed to mark asset as returned')
    },
  })
}

/**
 * Hook to update asset status
 */
export function useUpdateAssetStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      id, 
      status, 
      notes, 
      employeeId 
    }: { 
      id: string
      status: 'assigned' | 'returned' | 'lost' | 'damaged' | 'retired'
      notes?: string
      employeeId: string
    }) => employeeAssetService.updateStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeAssetKeys.list(variables.employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeAssetKeys.unreturned(variables.employeeId) })
      logAction({
        employee_id: variables.employeeId,
        action: 'Asset Status Updated',
        details: `Asset status changed to: ${variables.status}`,
      })
      toast.success('Asset status updated')
    },
    onError: (error: Error) => {
      console.error('Update asset status error:', error)
      toast.error('Failed to update asset status')
    },
  })
}

/**
 * Hook to delete an asset
 */
export function useDeleteEmployeeAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) =>
      employeeAssetService.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeAssetKeys.list(variables.employeeId) })
      queryClient.invalidateQueries({ queryKey: employeeAssetKeys.unreturned(variables.employeeId) })
      toast.success('Asset deleted successfully')
    },
    onError: (error: Error) => {
      console.error('Delete asset error:', error)
      toast.error('Failed to delete asset')
    },
  })
}
