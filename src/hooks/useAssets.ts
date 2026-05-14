import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  assetCategoryService,
  assetBrandService,
  assetVendorService,
  assetLocationService,
  assetService,
  assetAssignmentService,
  assetMaintenanceService,
  assetRequestService,
  type AssetCategory,
  type AssetBrand,
  type AssetVendor,
  type AssetLocation,
  type Asset,
  type AssetAssignment,
  type AssetMaintenance,
  type AssetRequest
} from '@/services/asset.service'

// Re-export types
export type {
  AssetCategory,
  AssetBrand,
  AssetVendor,
  AssetLocation,
  Asset,
  AssetAssignment,
  AssetMaintenance,
  AssetRequest
}

// =====================================================
// ASSET CATEGORIES HOOKS
// =====================================================

export const assetCategoryKeys = {
  all: ['asset-categories'] as const,
  list: () => [...assetCategoryKeys.all, 'list'] as const,
  detail: (id: string) => [...assetCategoryKeys.all, 'detail', id] as const
}

export function useAssetCategories() {
  return useQuery({
    queryKey: assetCategoryKeys.list(),
    queryFn: () => assetCategoryService.getAll()
  })
}

export function useAssetCategory(id: string | undefined) {
  return useQuery({
    queryKey: assetCategoryKeys.detail(id || ''),
    queryFn: () => id ? assetCategoryService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateAssetCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<AssetCategory>) => assetCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetCategoryKeys.all })
      toast.success('Asset category created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create asset category')
    }
  })
}

export function useUpdateAssetCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetCategory> }) => 
      assetCategoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetCategoryKeys.all })
      toast.success('Asset category updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update asset category')
    }
  })
}

export function useDeleteAssetCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => assetCategoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetCategoryKeys.all })
      toast.success('Asset category deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete asset category')
    }
  })
}

// =====================================================
// ASSET BRANDS HOOKS
// =====================================================

export const assetBrandKeys = {
  all: ['asset-brands'] as const,
  list: () => [...assetBrandKeys.all, 'list'] as const,
  detail: (id: string) => [...assetBrandKeys.all, 'detail', id] as const
}

export function useAssetBrands() {
  return useQuery({
    queryKey: assetBrandKeys.list(),
    queryFn: () => assetBrandService.getAll()
  })
}

export function useAssetBrand(id: string | undefined) {
  return useQuery({
    queryKey: assetBrandKeys.detail(id || ''),
    queryFn: () => id ? assetBrandService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateAssetBrand() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<AssetBrand>) => assetBrandService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetBrandKeys.all })
      toast.success('Asset brand created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create asset brand')
    }
  })
}

export function useUpdateAssetBrand() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetBrand> }) => 
      assetBrandService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetBrandKeys.all })
      toast.success('Asset brand updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update asset brand')
    }
  })
}

export function useDeleteAssetBrand() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => assetBrandService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetBrandKeys.all })
      toast.success('Asset brand deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete asset brand')
    }
  })
}

// =====================================================
// ASSET VENDORS HOOKS
// =====================================================

export const assetVendorKeys = {
  all: ['asset-vendors'] as const,
  list: () => [...assetVendorKeys.all, 'list'] as const,
  detail: (id: string) => [...assetVendorKeys.all, 'detail', id] as const
}

export function useAssetVendors() {
  return useQuery({
    queryKey: assetVendorKeys.list(),
    queryFn: () => assetVendorService.getAll()
  })
}

export function useAssetVendor(id: string | undefined) {
  return useQuery({
    queryKey: assetVendorKeys.detail(id || ''),
    queryFn: () => id ? assetVendorService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateAssetVendor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<AssetVendor>) => assetVendorService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetVendorKeys.all })
      toast.success('Asset vendor created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create asset vendor')
    }
  })
}

export function useUpdateAssetVendor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetVendor> }) => 
      assetVendorService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetVendorKeys.all })
      toast.success('Asset vendor updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update asset vendor')
    }
  })
}

export function useDeleteAssetVendor() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => assetVendorService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetVendorKeys.all })
      toast.success('Asset vendor deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete asset vendor')
    }
  })
}

// =====================================================
// ASSET LOCATIONS HOOKS
// =====================================================

export const assetLocationKeys = {
  all: ['asset-locations'] as const,
  list: () => [...assetLocationKeys.all, 'list'] as const,
}

export function useAssetLocations() {
  return useQuery({
    queryKey: assetLocationKeys.list(),
    queryFn: () => assetLocationService.getAll()
  })
}

export function useCreateAssetLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AssetLocation>) => assetLocationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetLocationKeys.all })
      toast.success('Location created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create location')
    }
  })
}

export function useUpdateAssetLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetLocation> }) =>
      assetLocationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetLocationKeys.all })
      toast.success('Location updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update location')
    }
  })
}

export function useDeleteAssetLocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => assetLocationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetLocationKeys.all })
      toast.success('Location deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete location')
    }
  })
}

// =====================================================
// ASSETS HOOKS
// =====================================================

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: any) => [...assetKeys.lists(), filters] as const,
  detail: (id: string) => [...assetKeys.all, 'detail', id] as const
}

export function useAssets(filters?: {
  category_id?: string
  status?: string
  assigned_to?: string
  search?: string
}) {
  return useQuery({
    queryKey: assetKeys.list(filters || {}),
    queryFn: () => assetService.getAll(filters)
  })
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: assetKeys.detail(id || ''),
    queryFn: () => id ? assetService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<Asset>) => assetService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      toast.success('Asset created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create asset')
    }
  })
}

export function useUpdateAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Asset> }) => 
      assetService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      toast.success('Asset updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update asset')
    }
  })
}

export function useDeleteAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => assetService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      toast.success('Asset deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete asset')
    }
  })
}

export function useAssignAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ assetId, employeeId, assignedBy, condition }: { 
      assetId: string
      employeeId: string
      assignedBy: string
      condition?: string
    }) => assetService.assign(assetId, employeeId, assignedBy, condition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] })
      toast.success('Asset assigned successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign asset')
    }
  })
}

export function useReturnAsset() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ assignmentId, returnedBy, condition, notes }: { 
      assignmentId: string
      returnedBy: string
      condition?: string
      notes?: string
    }) => assetService.return(assignmentId, returnedBy, condition, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['asset-assignments'] })
      toast.success('Asset returned successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to return asset')
    }
  })
}

// =====================================================
// ASSET ASSIGNMENTS HOOKS
// =====================================================

export function useAssetAssignments(filters?: {
  asset_id?: string
  employee_id?: string
  is_active?: boolean
}) {
  return useQuery({
    queryKey: ['asset-assignments', filters],
    queryFn: () => assetAssignmentService.getAll(filters)
  })
}

// =====================================================
// ASSET MAINTENANCE HOOKS
// =====================================================

export const assetMaintenanceKeys = {
  all: ['asset-maintenance'] as const,
  lists: () => [...assetMaintenanceKeys.all, 'list'] as const,
  list: (filters: any) => [...assetMaintenanceKeys.lists(), filters] as const,
  detail: (id: string) => [...assetMaintenanceKeys.all, 'detail', id] as const
}

export function useAssetMaintenance(filters?: {
  asset_id?: string
  status?: string
}) {
  return useQuery({
    queryKey: assetMaintenanceKeys.list(filters || {}),
    queryFn: () => assetMaintenanceService.getAll(filters)
  })
}

export function useAssetMaintenanceRecord(id: string | undefined) {
  return useQuery({
    queryKey: assetMaintenanceKeys.detail(id || ''),
    queryFn: () => id ? assetMaintenanceService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateAssetMaintenance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<AssetMaintenance>) => assetMaintenanceService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetMaintenanceKeys.lists() })
      toast.success('Maintenance record created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create maintenance record')
    }
  })
}

export function useUpdateAssetMaintenance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetMaintenance> }) => 
      assetMaintenanceService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetMaintenanceKeys.lists() })
      toast.success('Maintenance record updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update maintenance record')
    }
  })
}

export function useDeleteAssetMaintenance() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => assetMaintenanceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetMaintenanceKeys.lists() })
      toast.success('Maintenance record deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete maintenance record')
    }
  })
}

// =====================================================
// ASSET REQUESTS HOOKS
// =====================================================

export const assetRequestKeys = {
  all: ['asset-requests'] as const,
  lists: () => [...assetRequestKeys.all, 'list'] as const,
  list: (filters: any) => [...assetRequestKeys.lists(), filters] as const,
  detail: (id: string) => [...assetRequestKeys.all, 'detail', id] as const
}

export function useAssetRequests(filters?: {
  employee_id?: string
  status?: string
  priority?: string
}) {
  return useQuery({
    queryKey: assetRequestKeys.list(filters || {}),
    queryFn: () => assetRequestService.getAll(filters)
  })
}

export function useAssetRequest(id: string | undefined) {
  return useQuery({
    queryKey: assetRequestKeys.detail(id || ''),
    queryFn: () => id ? assetRequestService.getById(id) : null,
    enabled: !!id
  })
}

export function useCreateAssetRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<AssetRequest>) => assetRequestService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.lists() })
      toast.success('Asset request created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create asset request')
    }
  })
}

export function useUpdateAssetRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssetRequest> }) => 
      assetRequestService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.lists() })
      toast.success('Asset request updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update asset request')
    }
  })
}

export function useApproveAssetRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => 
      assetRequestService.approve(id, approvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.lists() })
      toast.success('Asset request approved successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve asset request')
    }
  })
}

export function useRejectAssetRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, approvedBy, reason }: { id: string; approvedBy: string; reason: string }) => 
      assetRequestService.reject(id, approvedBy, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.lists() })
      toast.success('Asset request rejected')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject asset request')
    }
  })
}

export function useFulfillAssetRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, assetId }: { id: string; assetId?: string | null }) => 
      assetRequestService.fulfill(id, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      toast.success('Asset request fulfilled successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to fulfill asset request')
    }
  })
}

export function useMarkEquipmentReturned() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      assetRequestService.markReturned(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.lists() })
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() })
      toast.success('Equipment marked as returned')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark as returned')
    },
  })
}

export function useDeleteAssetRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => assetRequestService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetRequestKeys.lists() })
      toast.success('Asset request deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete asset request')
    }
  })
}
