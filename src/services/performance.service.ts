import { createClient } from '../lib/supabase/client'
import type { Tables, InsertTables, UpdateTables } from '../lib/supabase'

export type PerformanceReview = Tables<'performance_reviews'>
export type PerformanceReviewInsert = InsertTables<'performance_reviews'>
export type PerformanceReviewUpdate = UpdateTables<'performance_reviews'>

export type Goal = Tables<'goals'>
export type GoalInsert = InsertTables<'goals'>
export type GoalUpdate = UpdateTables<'goals'>

export type PerformanceReviewWithRelations = PerformanceReview & {
  employee?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string | null } | null
  reviewer?: { id: string; first_name: string; last_name: string } | null
}

export type GoalWithRelations = Goal & {
  employee?: { id: string; first_name: string; last_name: string } | null
}

export interface ReviewFilters {
  employee_id?: string
  status?: string
  period?: string
}

export interface GoalFilters {
  employee_id?: string
  status?: string
}

export const performanceService = {
  // Performance Reviews
  async getReviews(filters?: ReviewFilters): Promise<PerformanceReviewWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('performance_reviews')
      .select(`
        *,
        employee:employees!performance_reviews_employee_id_fkey(id, first_name, last_name, email, avatar_url),
        reviewer:employees!performance_reviews_reviewer_id_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as PerformanceReviewWithRelations[]
  },

  async getReviewById(id: string): Promise<PerformanceReviewWithRelations | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('performance_reviews')
      .select(`
        *,
        employee:employees!performance_reviews_employee_id_fkey(id, first_name, last_name, email, avatar_url),
        reviewer:employees!performance_reviews_reviewer_id_fkey(id, first_name, last_name)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as PerformanceReviewWithRelations | null
  },

  async createReview(review: PerformanceReviewInsert): Promise<PerformanceReview> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('performance_reviews')
      .insert(review as never)
      .select()
      .single()

    if (error) throw error
    return data as PerformanceReview
  },

  async updateReview(id: string, review: PerformanceReviewUpdate): Promise<PerformanceReview> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('performance_reviews')
      .update({ ...review, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as PerformanceReview
  },

  async deleteReview(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('performance_reviews').delete().eq('id', id)
    if (error) throw error
  },

  // Goals
  async getGoals(filters?: GoalFilters): Promise<GoalWithRelations[]> {
    const supabase = createClient()
    let query = supabase
      .from('goals')
      .select(`
        *,
        employee:employees(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (filters?.employee_id) {
      query = query.eq('employee_id', filters.employee_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as GoalWithRelations[]
  },

  async createGoal(goal: GoalInsert): Promise<Goal> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('goals')
      .insert(goal as never)
      .select()
      .single()

    if (error) throw error
    return data as Goal
  },

  async updateGoal(id: string, goal: GoalUpdate): Promise<Goal> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('goals')
      .update({ ...goal, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Goal
  },

  async deleteGoal(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) throw error
  },
}
