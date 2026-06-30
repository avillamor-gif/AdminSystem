export type PerformanceAppraisalStatus = 'draft' | 'pending_review' | 'in_review' | 'returned' | 'completed'
export type PerformanceAppraisalPeriod = 'midyear' | 'yearend'

export interface PerformanceAppraisalRecord {
  id: string
  appraisee_employee_id: string
  appraiser_employee_id: string | null
  period_covered: PerformanceAppraisalPeriod
  review_year: number
  status: PerformanceAppraisalStatus
  filename: string
  form_data: any
  submitted_at: string | null
  finalized_at: string | null
  created_at: string
  updated_at: string
  appraisee?: {
    id: string
    employee_id?: string | null
    first_name: string
    last_name: string
    email?: string | null
    department_id?: string | null
  } | null
  appraiser?: {
    id: string
    first_name: string
    last_name: string
    email?: string | null
  } | null
}

export interface SavePerformanceAppraisalInput {
  id?: string
  periodCovered: PerformanceAppraisalPeriod
  reviewYear: number
  appraiserEmployeeId?: string | null
  formData: any
}

export interface AdminAppraisalFilters {
  status?: string
  period?: string
  year?: string
}

export const performanceAppraisalService = {
  async getMyAppraisals(): Promise<PerformanceAppraisalRecord[]> {
    const res = await fetch('/api/performance/appraisals', { cache: 'no-store' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to load appraisals')
    }
    return res.json()
  },

  async saveDraft(input: SavePerformanceAppraisalInput): Promise<PerformanceAppraisalRecord> {
    const res = await fetch('/api/performance/appraisals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, action: 'draft' }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to save draft')
    }

    return res.json()
  },

  async submit(input: SavePerformanceAppraisalInput): Promise<PerformanceAppraisalRecord> {
    const res = await fetch('/api/performance/appraisals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, action: 'submit' }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to submit appraisal')
    }

    return res.json()
  },

  async getAdminAppraisals(filters: AdminAppraisalFilters = {}): Promise<PerformanceAppraisalRecord[]> {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.period) params.set('period', filters.period)
    if (filters.year) params.set('year', filters.year)

    const res = await fetch(`/api/admin/performance-appraisals?${params.toString()}`, { cache: 'no-store' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to load admin appraisals')
    }
    return res.json()
  },

  async getAdminAppraisalById(id: string): Promise<PerformanceAppraisalRecord> {
    const res = await fetch(`/api/admin/performance-appraisals/${id}`, { cache: 'no-store' })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to load appraisal')
    }
    return res.json()
  },

  async updateAdminAppraisal(
    id: string,
    updates: Partial<Pick<PerformanceAppraisalRecord, 'status' | 'appraiser_employee_id' | 'form_data'>>
  ): Promise<PerformanceAppraisalRecord> {
    const res = await fetch('/api/admin/performance-appraisals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Failed to update appraisal')
    }

    return res.json()
  },
}
