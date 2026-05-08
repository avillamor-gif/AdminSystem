import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type PrintJobStatus =
  | 'draft' | 'submitted' | 'approved' | 'press_assigned'
  | 'in_production' | 'quality_check' | 'ready'
  | 'distributing' | 'completed' | 'cancelled' | 'rejected'

export interface PrintJobRequest {
  id: string
  request_number: string | null
  publication_id: string | null
  title: string
  publication_type: string
  request_type: string
  quantity: number
  purpose: string | null
  event_name: string | null
  target_date: string | null
  paper_size: string | null
  paper_type: string | null
  color_mode: string | null
  binding_type: string | null
  special_instructions: string | null
  estimated_cost: number | null
  actual_cost: number | null
  printing_press_id: string | null
  status: PrintJobStatus
  requested_by: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  // relations
  printing_press?: { id: string; name: string } | null
  requester?: { first_name: string; last_name: string } | null
  distribution_plan?: DistributionPlanRow[]
}

export interface DistributionPlanRow {
  id?: string
  print_job_id?: string
  recipient_group: string
  recipient_type: string
  quantity: number
  delivery_method: string
  delivery_address: string | null
  pic_name: string | null
  target_date: string | null
  actual_delivered_date: string | null
  status: string
  notes: string | null
  sort_order: number
}

export const printJobService = {
  async getAll(filters: { status?: string; type?: string; search?: string } = {}): Promise<PrintJobRequest[]> {
    let query = supabase
      .from('print_job_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.status) query = query.eq('status', filters.status)
    if (filters.type)   query = query.eq('publication_type', filters.type)
    if (filters.search) query = query.ilike('title', `%${filters.search}%`)

    const { data, error } = await query
    if (error) throw error
    if (!data || data.length === 0) return []

    // Fetch relations in parallel
    const pressIds = [...new Set(data.map((d: any) => d.printing_press_id).filter(Boolean))]
    const empIds   = [...new Set(data.map((d: any) => d.requested_by).filter(Boolean))]

    const [pressRes, empRes, distRes] = await Promise.all([
      pressIds.length > 0
        ? supabase.from('printing_presses').select('id, name').in('id', pressIds)
        : Promise.resolve({ data: [] }),
      empIds.length > 0
        ? supabase.from('employees').select('id, first_name, last_name').in('id', empIds)
        : Promise.resolve({ data: [] }),
      supabase
        .from('print_job_distribution_plan')
        .select('*')
        .in('print_job_id', data.map((d: any) => d.id))
        .order('sort_order'),
    ])

    const pressMap = Object.fromEntries((pressRes.data || []).map((p: any) => [p.id, p]))
    const empMap   = Object.fromEntries((empRes.data   || []).map((e: any) => [e.id, e]))
    const distMap: Record<string, DistributionPlanRow[]> = {}
    ;(distRes.data || []).forEach((row: any) => {
      if (!distMap[row.print_job_id]) distMap[row.print_job_id] = []
      distMap[row.print_job_id].push(row)
    })

    return data.map((job: any) => ({
      ...job,
      printing_press: job.printing_press_id ? (pressMap[job.printing_press_id] ?? null) : null,
      requester:      job.requested_by       ? (empMap[job.requested_by]         ?? null) : null,
      distribution_plan: distMap[job.id] ?? [],
    })) as PrintJobRequest[]
  },

  async getDistributionPlan(printJobId: string): Promise<DistributionPlanRow[]> {
    const { data, error } = await supabase
      .from('print_job_distribution_plan')
      .select('*')
      .eq('print_job_id', printJobId)
      .order('sort_order')
    if (error) throw error
    return (data ?? []) as DistributionPlanRow[]
  },

  async createWithDistribution(
    jobData: Partial<PrintJobRequest>,
    distPlan: DistributionPlanRow[],
  ): Promise<PrintJobRequest> {
    const { data, error } = await supabase
      .from('print_job_requests')
      .insert(jobData as any)
      .select('*')
      .single()
    if (error) throw error

    if (distPlan.length > 0) {
      const rows = distPlan.map((row, i) => ({
        ...row, id: undefined, print_job_id: data.id, sort_order: i,
      }))
      const { error: distErr } = await supabase.from('print_job_distribution_plan').insert(rows)
      if (distErr) console.error('Distribution plan save error:', distErr)
    }
    return data as unknown as PrintJobRequest
  },

  async updateWithDistribution(
    id: string,
    jobData: Partial<PrintJobRequest>,
    distPlan?: DistributionPlanRow[],
  ): Promise<PrintJobRequest> {
    const { data, error } = await supabase
      .from('print_job_requests')
      .update({ ...jobData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error

    if (distPlan !== undefined) {
      await supabase.from('print_job_distribution_plan').delete().eq('print_job_id', id)
      if (distPlan.length > 0) {
        const rows = distPlan.map((row, i) => ({
          ...row, id: undefined, print_job_id: id, sort_order: i,
        }))
        const { error: distErr } = await supabase.from('print_job_distribution_plan').insert(rows)
        if (distErr) console.error('Distribution plan save error:', distErr)
      }
    }
    return data as unknown as PrintJobRequest
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('print_job_requests').delete().eq('id', id)
    if (error) throw error
  },

  async advanceStatus(
    id: string,
    status: string,
    notes?: string,
    pressId?: string,
  ): Promise<void> {
    const update: any = { status, updated_at: new Date().toISOString() }
    if (notes)   update.notes = notes
    if (pressId) update.printing_press_id = pressId
    if (status === 'approved')  update.approved_at = new Date().toISOString()
    if (status === 'rejected' && notes) update.rejection_reason = notes
    const { error } = await supabase.from('print_job_requests').update(update).eq('id', id)
    if (error) throw error
  },
}
