import { useQuery } from '@tanstack/react-query'
import { pimConfigService } from '@/services'
import type { PIMFieldConfig } from '@/services/employeeData.service'

/**
 * Hook to fetch PIM fields grouped by field_group
 * Used by My Info to dynamically render fields based on PIM configuration
 */
export function usePIMFieldsByGroup(fieldGroup: string) {
  return useQuery({
    queryKey: ['pim-fields', fieldGroup],
    queryFn: async () => {
      const allFields = await pimConfigService.getAll()
      // Filter by field group and only show visible fields
      return allFields
        .filter(field => field.field_group === fieldGroup && field.is_visible)
        .sort((a, b) => (a.field_order || 0) - (b.field_order || 0))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch all PIM fields organized by group
 */
export function useAllPIMFields() {
  return useQuery({
    queryKey: ['pim-fields', 'all'],
    queryFn: async () => {
      const allFields = await pimConfigService.getAll()
      
      // Group fields by field_group
      const grouped = allFields.reduce((acc, field) => {
        const group = field.field_group
        if (!acc[group]) {
          acc[group] = []
        }
        acc[group].push(field)
        return acc
      }, {} as Record<string, PIMFieldConfig[]>)
      
      // Sort each group by field_order
      Object.keys(grouped).forEach(group => {
        grouped[group].sort((a, b) => (a.field_order || 0) - (b.field_order || 0))
      })
      
      return grouped
    },
    staleTime: 5 * 60 * 1000,
  })
}
