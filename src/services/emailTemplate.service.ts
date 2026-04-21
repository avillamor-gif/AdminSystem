/**
 * Email Template Service
 * Handles CRUD operations for customizable email notification templates
 */

import { createClient } from '@/lib/supabase/client'
import type { Tables, UpdateTables } from '@/lib/supabase'

export type EmailTemplate = Tables<'email_templates'>
export type EmailTemplateUpdate = UpdateTables<'email_templates'>

/**
 * Email template service for managing notification templates
 */
export const emailTemplateService = {
  /**
   * Get all email templates
   */
  async getAll(): Promise<EmailTemplate[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  },

  /**
   * Get a specific email template by type
   */
  async getByType(templateType: string): Promise<EmailTemplate | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    
    return data
  },

  /**
   * Update an email template
   */
  async update(id: string, updates: EmailTemplateUpdate): Promise<EmailTemplate> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  /**
   * Reset template to default (marks as inactive and creates new default)
   * Note: This is a soft reset - the custom template remains in the database
   */
  async resetToDefault(id: string): Promise<void> {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }
}
