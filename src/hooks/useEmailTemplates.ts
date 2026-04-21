/**
 * React Query hooks for Email Templates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emailTemplateService } from '@/services'
import type { EmailTemplate, EmailTemplateUpdate } from '@/services/emailTemplate.service'
import toast from 'react-hot-toast'

export const emailTemplateKeys = {
  all: ['email_templates'] as const,
  lists: () => [...emailTemplateKeys.all, 'list'] as const,
  list: (filters: object) => [...emailTemplateKeys.lists(), filters] as const,
  details: () => [...emailTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...emailTemplateKeys.details(), id] as const,
  byType: (type: string) => [...emailTemplateKeys.all, 'type', type] as const,
}

/**
 * Fetch all email templates
 */
export function useEmailTemplates() {
  return useQuery({
    queryKey: emailTemplateKeys.lists(),
    queryFn: () => emailTemplateService.getAll(),
  })
}

/**
 * Fetch a specific email template by type
 */
export function useEmailTemplateByType(templateType: string) {
  return useQuery({
    queryKey: emailTemplateKeys.byType(templateType),
    queryFn: () => emailTemplateService.getByType(templateType),
    enabled: !!templateType,
  })
}

/**
 * Update an email template
 */
export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EmailTemplateUpdate }) =>
      emailTemplateService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists() })
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.byType(data.template_type) })
      toast.success('Template updated successfully')
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`)
    },
  })
}

/**
 * Reset template to default
 */
export function useResetEmailTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => emailTemplateService.resetToDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailTemplateKeys.lists() })
      toast.success('Template reset to default')
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset template: ${error.message}`)
    },
  })
}
