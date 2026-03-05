import { createClient } from '@/lib/supabase/client'

export interface ExitInterview {
  id: string
  termination_request_id: string
  employee_id: string
  interview_date?: string
  interview_time?: string
  interviewer_id?: string
  interview_location?: string
  interview_method?: 'in_person' | 'video' | 'phone' | 'written'
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'declined'
  reason_for_leaving?: string
  liked_most?: string
  liked_least?: string
  suggestions_for_improvement?: string
  relationship_with_manager_rating?: number
  work_environment_rating?: number
  compensation_rating?: number
  career_growth_rating?: number
  work_life_balance_rating?: number
  overall_satisfaction_rating?: number
  would_recommend_company?: boolean
  would_consider_returning?: boolean
  open_to_future_contact?: boolean
  additional_comments?: string
  interviewer_notes?: string
  action_items?: string
  hr_review_notes?: string
  completed_at?: string
  completed_by?: string
  created_at: string
  updated_at: string
  employee?: {
    id: string
    first_name: string
    last_name: string
    employee_id: string
  }
  interviewer?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface ExitInterviewInsert {
  termination_request_id: string
  employee_id: string
  interview_date?: string
  interview_time?: string
  interviewer_id?: string
  interview_location?: string
  interview_method?: string
  status?: string
}

export interface ExitInterviewUpdate {
  interview_date?: string
  interview_time?: string
  interviewer_id?: string
  interview_location?: string
  interview_method?: string
  status?: string
  reason_for_leaving?: string
  liked_most?: string
  liked_least?: string
  suggestions_for_improvement?: string
  relationship_with_manager_rating?: number
  work_environment_rating?: number
  compensation_rating?: number
  career_growth_rating?: number
  work_life_balance_rating?: number
  overall_satisfaction_rating?: number
  would_recommend_company?: boolean
  would_consider_returning?: boolean
  open_to_future_contact?: boolean
  additional_comments?: string
  interviewer_notes?: string
  action_items?: string
  hr_review_notes?: string
}

export const exitInterviewService = {
  /**
   * Get exit interview by termination request ID
   */
  async getByTerminationRequest(terminationRequestId: string): Promise<ExitInterview | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('exit_interviews')
      .select(`
        *,
        employee:employees!exit_interviews_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_id
        ),
        interviewer:employees!exit_interviews_interviewer_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('termination_request_id', terminationRequestId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching exit interview:', error)
      throw error
    }

    return (data as unknown as ExitInterview) || null
  },

  /**
   * Get exit interview by employee ID
   */
  async getByEmployee(employeeId: string): Promise<ExitInterview[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('exit_interviews')
      .select(`
        *,
        employee:employees!exit_interviews_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_id
        ),
        interviewer:employees!exit_interviews_interviewer_id_fkey(
          id,
          first_name,
          last_name
        )
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching exit interviews:', error)
      throw error
    }

    return (data as unknown as ExitInterview[]) || []
  },

  /**
   * Create exit interview
   */
  async create(interview: ExitInterviewInsert): Promise<ExitInterview> {
    const supabase = createClient()
    const { data, error} = await supabase
      .from('exit_interviews')
      .insert(interview as any)
      .select()
      .single()

    if (error) {
      console.error('Error creating exit interview:', error)
      throw error
    }

    return data as unknown as ExitInterview
  },

  /**
   * Update exit interview
   */
  async update(id: string, updates: ExitInterviewUpdate): Promise<ExitInterview> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('exit_interviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating exit interview:', error)
      throw error
    }

    return data as unknown as ExitInterview
  },

  /**
   * Mark exit interview as completed
   */
  async markAsCompleted(id: string, completedBy: string): Promise<ExitInterview> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('exit_interviews')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error marking exit interview as completed:', error)
      throw error
    }

    return data as unknown as ExitInterview
  },

  /**
   * Cancel exit interview
   */
  async cancel(id: string): Promise<ExitInterview> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('exit_interviews')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error cancelling exit interview:', error)
      throw error
    }

    return data as unknown as ExitInterview
  },

  /**
   * Delete exit interview
   */
  async delete(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('exit_interviews')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting exit interview:', error)
      throw error
    }
  }
}
