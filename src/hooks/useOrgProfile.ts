import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orgProfileService, generalSettingsService, type OrgProfileUpdate } from '@/services/orgProfile.service'
import { toast } from 'sonner'

export const orgProfileKeys = {
  all: ['org_profile'] as const,
  settings: ['general_settings'] as const,
}

export function useOrgProfile() {
  return useQuery({
    queryKey: orgProfileKeys.all,
    queryFn: () => orgProfileService.get(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateOrgProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: OrgProfileUpdate) => orgProfileService.update(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgProfileKeys.all })
      toast.success('Organization profile saved')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to save'),
  })
}

export function useGeneralSettings() {
  return useQuery({
    queryKey: orgProfileKeys.settings,
    queryFn: () => generalSettingsService.getAll(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateGeneralSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      generalSettingsService.updateKey(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgProfileKeys.settings })
      toast.success('Setting saved')
    },
    onError: (e: any) => toast.error(e.message ?? 'Failed to save setting'),
  })
}
