import { createClient } from '../lib/supabase/client'

export type ProbationaryReviewStatus = 'pending' | 'completed' | 'overdue' | 'skipped'
export type ProbationaryReviewType = 'interim_3mo' | 'final_5mo'
export type ProbationaryRecommendation = 'regularize' | 'extend_probation' | 'terminate'

export interface ProbationaryReview {
  id: string
  employee_id: string
  review_type: ProbationaryReviewType
  due_date: string
  status: ProbationaryReviewStatus
  recommendation: ProbationaryRecommendation | null
  reviewer_id: string | null
  performance_score: number | null
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ProbationaryReviewWithRelations extends ProbationaryReview {
  employee?: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url?: string | null
    hire_date?: string | null
    department_id?: string | null
  } | null
  reviewer?: {
    id: string
    first_name: string
    last_name: string
  } | null
}

export interface ProbationaryReviewFilters {
  status?: ProbationaryReviewStatus
  review_type?: ProbationaryReviewType
  employee_id?: string
  due_before?: string
  due_after?: string
}

export interface ProbationaryReviewUpdate {
  status?: ProbationaryReviewStatus
  recommendation?: ProbationaryRecommendation | null
  reviewer_id?: string | null
  performance_score?: number | null
  notes?: string | null
  completed_at?: string | null
}

export const probationaryService = {
  async getAll(filters: ProbationaryReviewFilters = {}): Promise<ProbationaryReviewWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('probationary_reviews')
      .select('*')
      .order('due_date', { ascending: true })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.review_type) query = query.eq('review_type', filters.review_type)
    if (filters.employee_id) query = query.eq('employee_id', filters.employee_id)
    if (filters.due_before) query = query.lte('due_date', filters.due_before)
    if (filters.due_after) query = query.gte('due_date', filters.due_after)

    const { data, error } = await query
    if (error) throw error

    const reviews: ProbationaryReview[] = (data || []) as ProbationaryReview[]

    // Fetch related employees
    const employeeIds = [...new Set(reviews.map((r: ProbationaryReview) => r.employee_id))]
    const reviewerIds = [...new Set(reviews.map((r: ProbationaryReview) => r.reviewer_id).filter(Boolean))] as string[]

    let employeeMap: Record<string, any> = {}
    let reviewerMap: Record<string, any> = {}

    if (employeeIds.length > 0) {
      const { data: emps } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, avatar_url, hire_date, department_id')
        .in('id', employeeIds)
      ;(emps || []).forEach((e: any) => { employeeMap[e.id] = e })
    }

    if (reviewerIds.length > 0) {
      const { data: revs } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .in('id', reviewerIds)
      ;(revs || []).forEach((r: any) => { reviewerMap[r.id] = r })
    }

    return reviews.map((r: ProbationaryReview) => ({
      ...r,
      employee: employeeMap[r.employee_id] || null,
      reviewer: r.reviewer_id ? reviewerMap[r.reviewer_id] || null : null,
    })) as ProbationaryReviewWithRelations[]
  },

  async getByEmployee(employeeId: string): Promise<ProbationaryReviewWithRelations[]> {
    return probationaryService.getAll({ employee_id: employeeId })
  },

  async update(id: string, updates: ProbationaryReviewUpdate): Promise<ProbationaryReview> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('probationary_reviews')
      .update(updates as never)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as ProbationaryReview
  },

  async complete(
    id: string,
    payload: {
      recommendation: ProbationaryRecommendation
      reviewer_id: string
      performance_score?: number | null
      notes?: string | null
    }
  ): Promise<ProbationaryReview> {
    return probationaryService.update(id, {
      status: 'completed',
      recommendation: payload.recommendation,
      reviewer_id: payload.reviewer_id,
      performance_score: payload.performance_score ?? null,
      notes: payload.notes ?? null,
      completed_at: new Date().toISOString(),
    })
  },

  /** Mark all pending reviews whose due_date < today as overdue */
  async syncOverdueStatuses(): Promise<void> {
    const supabase = createClient()
    await supabase
      .from('probationary_reviews')
      .update({ status: 'overdue' } as never)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString().split('T')[0])
  },
}
