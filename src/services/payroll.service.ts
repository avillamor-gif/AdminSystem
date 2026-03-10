/**
 * Payroll Service
 * Philippine NGO (IBON International)
 *
 * Tables (not yet in generated types — use 'as any'):
 *   payroll_runs, payslips
 *
 * PH Contribution rates (2025):
 *   SSS    EE 4.5% | ER 9.5%  | MSC ceiling ₱30,000
 *   PhilHealth EE 2.5% | ER 2.5% | basic ceiling ₱100,000
 *   Pag-IBIG EE 1-2% | ER 2%   | capped ER ₱100/mo
 *   BIR withholding — simplified graduated table (monthly)
 */

import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PayrollRunStatus = 'draft' | 'processing' | 'for_approval' | 'approved' | 'paid' | 'cancelled'
export type PayslipStatus    = 'draft' | 'approved' | 'paid'
export type PeriodType       = 'monthly' | 'semi_monthly' | 'weekly'

export interface PayrollRun {
  id: string
  name: string
  period_type: PeriodType
  pay_date: string
  period_start: string
  period_end: string
  status: PayrollRunStatus
  notes: string | null
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  // aggregated (not in DB)
  payslip_count?: number
  total_net_pay?: number
  total_gross_pay?: number
}

export interface PayrollRunInsert {
  name: string
  period_type: PeriodType
  pay_date: string
  period_start: string
  period_end: string
  status?: PayrollRunStatus
  notes?: string | null
  created_by?: string | null
}

export interface BreakdownItem {
  name: string
  amount: number
}

export interface Payslip {
  id: string
  payroll_run_id: string
  employee_id: string
  basic_salary: number
  allowances: number
  gross_pay: number
  sss_ee: number
  philhealth_ee: number
  pagibig_ee: number
  withholding_tax: number
  sss_er: number
  philhealth_er: number
  pagibig_er: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  earnings_breakdown: BreakdownItem[] | null
  deductions_breakdown: BreakdownItem[] | null
  adjustment_amount: number
  adjustment_note: string | null
  status: PayslipStatus
  remarks: string | null
  created_at: string
  updated_at: string
  // joined
  employee?: {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    email: string
    department_id: string | null
    job_title_id: string | null
    sss_number: string | null
    philhealth_number: string | null
    pagibig_number: string | null
    tin_number: string | null
    salary_structure_id?: string | null
  }
  department?: { id: string; name: string } | null
  job_title?: { id: string; title: string } | null
}

// ─── PH Contribution Calculators ──────────────────────────────────────────────

/** SSS Monthly Salary Credit table (simplified bracket) — 2025 */
function computeSSS(monthlySalary: number): { ee: number; er: number } {
  const msc = Math.min(Math.max(monthlySalary, 4000), 30000)
  // Round MSC to nearest 500
  const rounded = Math.round(msc / 500) * 500
  const total = rounded * 0.14
  const ee    = Math.round(rounded * 0.045 * 100) / 100
  const er    = Math.round((total - ee) * 100) / 100
  return { ee, er }
}

/** PhilHealth — 5% total, split equally; basic ceiling ₱100,000 */
function computePhilHealth(basicSalary: number): { ee: number; er: number } {
  const basis = Math.min(basicSalary, 100000)
  const share = Math.round(basis * 0.025 * 100) / 100
  return { ee: share, er: share }
}

/** Pag-IBIG */
function computePagIbig(monthlySalary: number): { ee: number; er: number } {
  const eeRate = monthlySalary <= 1500 ? 0.01 : 0.02
  const ee = Math.round(monthlySalary * eeRate * 100) / 100
  const er = Math.min(Math.round(monthlySalary * 0.02 * 100) / 100, 100)
  return { ee, er }
}

/**
 * BIR Withholding Tax — 2023 TRAIN simplified graduated (monthly)
 * Taxable = gross - mandatory EE contributions - personal exemption (₱25,000/12 ~ ₱2,083.33 simplified)
 */
function computeWithholdingTax(
  grossPay: number,
  sssEe: number,
  philhealthEe: number,
  pagibigEe: number
): number {
  const taxable = grossPay - sssEe - philhealthEe - pagibigEe
  if (taxable <= 20833)  return 0
  if (taxable <= 33332)  return Math.round((taxable - 20833) * 0.20 * 100) / 100
  if (taxable <= 66666)  return Math.round(2500  + (taxable - 33333) * 0.25 * 100) / 100
  if (taxable <= 166666) return Math.round(10833 + (taxable - 66667) * 0.30 * 100) / 100
  if (taxable <= 666666) return Math.round(40833 + (taxable - 166667) * 0.32 * 100) / 100
  return Math.round(200833 + (taxable - 666667) * 0.35 * 100) / 100
}

/** Divide monthly amounts by 2 for semi-monthly payroll */
function scaleToPeriod(val: number, periodType: PeriodType): number {
  if (periodType === 'semi_monthly') return Math.round(val / 2 * 100) / 100
  if (periodType === 'weekly')       return Math.round(val / 4.333 * 100) / 100
  return val
}

// ─── Computation helper ────────────────────────────────────────────────────────

export interface ComputedPayslip {
  basic_salary: number
  allowances: number
  gross_pay: number
  sss_ee: number
  philhealth_ee: number
  pagibig_ee: number
  withholding_tax: number
  sss_er: number
  philhealth_er: number
  pagibig_er: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  earnings_breakdown: BreakdownItem[]
  deductions_breakdown: BreakdownItem[]
}

export function computePayslip(
  basicSalary: number,
  components: { name: string; amount: number; type: string }[],
  periodType: PeriodType,
  otherDeductions: number = 0
): ComputedPayslip {
  // Scale monthly salary to period
  const periodBasic    = scaleToPeriod(basicSalary, periodType)
  const earningsBreak: BreakdownItem[] = [{ name: 'Basic Salary', amount: periodBasic }]

  let allowances = 0
  for (const c of components) {
    const amt = scaleToPeriod(c.amount, periodType)
    earningsBreak.push({ name: c.name, amount: amt })
    allowances += amt
  }
  const grossPay = periodBasic + allowances

  // Contributions — always computed on monthly equivalent
  const monthlySalary = periodType === 'semi_monthly' ? basicSalary
                      : periodType === 'weekly'       ? basicSalary * 4.333
                      : basicSalary

  const sss        = computeSSS(monthlySalary)
  const ph         = computePhilHealth(monthlySalary)
  const pagibig    = computePagIbig(monthlySalary)
  const withheld   = computeWithholdingTax(monthlySalary, sss.ee, ph.ee, pagibig.ee)

  // Scale deductions to period
  const sssEe      = scaleToPeriod(sss.ee,     periodType)
  const phEe       = scaleToPeriod(ph.ee,      periodType)
  const pagibigEe  = scaleToPeriod(pagibig.ee, periodType)
  const taxEe      = scaleToPeriod(withheld,   periodType)
  const sssEr      = scaleToPeriod(sss.er,     periodType)
  const phEr       = scaleToPeriod(ph.er,      periodType)
  const pagibigEr  = scaleToPeriod(pagibig.er, periodType)

  const deductionsBreak: BreakdownItem[] = [
    { name: 'SSS (EE)',           amount: sssEe },
    { name: 'PhilHealth (EE)',    amount: phEe },
    { name: 'Pag-IBIG (EE)',      amount: pagibigEe },
    { name: 'Withholding Tax',    amount: taxEe },
  ]
  if (otherDeductions > 0) {
    deductionsBreak.push({ name: 'Other Deductions', amount: otherDeductions })
  }

  const totalDeductions = sssEe + phEe + pagibigEe + taxEe + otherDeductions
  const netPay          = Math.max(0, grossPay - totalDeductions)

  return {
    basic_salary:         periodBasic,
    allowances,
    gross_pay:            grossPay,
    sss_ee:               sssEe,
    philhealth_ee:        phEe,
    pagibig_ee:           pagibigEe,
    withholding_tax:      taxEe,
    sss_er:               sssEr,
    philhealth_er:        phEr,
    pagibig_er:           pagibigEr,
    other_deductions:     otherDeductions,
    total_deductions:     totalDeductions,
    net_pay:              netPay,
    earnings_breakdown:   earningsBreak,
    deductions_breakdown: deductionsBreak,
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const payrollService = {

  // ── Payroll Runs ──────────────────────────────────────────────────────────

  async getAllRuns(): Promise<PayrollRun[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payroll_runs' as any)
      .select('*')
      .order('period_start', { ascending: false })
    if (error) throw error
    const runs = (data ?? []) as unknown as PayrollRun[]

    // Attach summary counts from payslips
    const ids = runs.map(r => r.id)
    if (ids.length === 0) return runs

    const { data: slips } = await supabase
      .from('payslips' as any)
      .select('payroll_run_id, net_pay, gross_pay')
      .in('payroll_run_id', ids)

    const summary: Record<string, { count: number; net: number; gross: number }> = {}
    for (const s of (slips ?? []) as any[]) {
      if (!summary[s.payroll_run_id]) summary[s.payroll_run_id] = { count: 0, net: 0, gross: 0 }
      summary[s.payroll_run_id].count++
      summary[s.payroll_run_id].net   += Number(s.net_pay)
      summary[s.payroll_run_id].gross += Number(s.gross_pay)
    }

    return runs.map(r => ({
      ...r,
      payslip_count:   summary[r.id]?.count  ?? 0,
      total_net_pay:   summary[r.id]?.net    ?? 0,
      total_gross_pay: summary[r.id]?.gross  ?? 0,
    }))
  },

  async getRunById(id: string): Promise<PayrollRun | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payroll_runs' as any)
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as unknown as PayrollRun
  },

  async createRun(payload: PayrollRunInsert): Promise<PayrollRun> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('payroll_runs' as any)
      .insert({ ...payload, created_by: user?.id ?? null })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as PayrollRun
  },

  async updateRunStatus(id: string, status: PayrollRunStatus, approvedBy?: string): Promise<PayrollRun> {
    const supabase = createClient()
    const patch: any = { status, updated_at: new Date().toISOString() }
    if (status === 'approved' && approvedBy) {
      patch.approved_by  = approvedBy
      patch.approved_at  = new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('payroll_runs' as any)
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as PayrollRun
  },

  async deleteRun(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('payroll_runs' as any)
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // ── Payslips ──────────────────────────────────────────────────────────────

  async getPayslipsByRun(runId: string): Promise<Payslip[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payslips' as any)
      .select('*')
      .eq('payroll_run_id', runId)
      .order('created_at', { ascending: true })
    if (error) throw error
    const payslips = (data ?? []) as unknown as Payslip[]

    // Fetch employee details separately (avoid aliased FK)
    const empIds = [...new Set(payslips.map(p => p.employee_id))]
    if (empIds.length === 0) return payslips

    const { data: emps } = await supabase
      .from('employees')
      .select('id, employee_id, first_name, last_name, email, department_id, job_title_id, sss_number, philhealth_number, pagibig_number, tin_number')
      .in('id', empIds)

    const empMap: Record<string, any> = {}
    for (const e of (emps ?? [])) empMap[e.id] = e

    const deptIds = [...new Set((emps ?? []).map((e: any) => e.department_id).filter(Boolean))]
    const jtIds   = [...new Set((emps ?? []).map((e: any) => e.job_title_id).filter(Boolean))]

    const [{ data: depts }, { data: jts }] = await Promise.all([
      deptIds.length ? supabase.from('departments').select('id, name').in('id', deptIds) : Promise.resolve({ data: [] }),
      jtIds.length   ? supabase.from('job_titles').select('id, title').in('id', jtIds)   : Promise.resolve({ data: [] }),
    ])

    const deptMap: Record<string, any> = {}
    for (const d of (depts ?? [])) deptMap[d.id] = d
    const jtMap: Record<string, any> = {}
    for (const j of (jts ?? [])) jtMap[j.id] = j

    return payslips.map(p => ({
      ...p,
      employee:   empMap[p.employee_id] ?? null,
      department: empMap[p.employee_id]?.department_id ? deptMap[empMap[p.employee_id].department_id] ?? null : null,
      job_title:  empMap[p.employee_id]?.job_title_id  ? jtMap[empMap[p.employee_id].job_title_id]   ?? null : null,
    }))
  },

  async getMyPayslips(employeeId: string): Promise<Payslip[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payslips' as any)
      .select(`*, payroll_run:payroll_runs(id, name, period_start, period_end, pay_date, period_type)`)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as Payslip[]
  },

  async upsertPayslip(payslip: Omit<Payslip, 'id' | 'created_at' | 'updated_at'>): Promise<Payslip> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payslips' as any)
      .upsert(payslip, { onConflict: 'payroll_run_id,employee_id' })
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Payslip
  },

  async updatePayslip(id: string, patch: Partial<Payslip>): Promise<Payslip> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('payslips' as any)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data as unknown as Payslip
  },

  /**
   * Generate payslips for ALL active employees in a run.
   * Calls the PH contribution calculators and upserts each payslip.
   */
  async generatePayslips(run: PayrollRun): Promise<Payslip[]> {
    const supabase = createClient()

    // 1. Fetch active employees with their salary structure
    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select(`
        id, employee_id, first_name, last_name, email,
        sss_number, philhealth_number, pagibig_number, tin_number,
        salary_structure_id
      `)
      .eq('status', 'active')
    if (empErr) throw empErr

    // 2. Fetch all salary structures
    const { data: structures } = await supabase
      .from('salary_structures')
      .select('*')

    const structMap: Record<string, any> = {}
    for (const s of (structures ?? [])) structMap[s.id] = s

    // 3. Compute and upsert each payslip
    const results: Payslip[] = []
    for (const emp of (employees ?? []) as any[]) {
      const struct = emp.salary_structure_id ? structMap[emp.salary_structure_id] : null
      const basicSalary = struct ? Number(struct.base_salary) : 0
      const rawComponents: { name: string; amount: number; type: string }[] =
        Array.isArray(struct?.components) ? struct.components : []

      const computed = computePayslip(basicSalary, rawComponents, run.period_type)

      const payslip = await payrollService.upsertPayslip({
        payroll_run_id:       run.id,
        employee_id:          emp.id,
        ...computed,
        adjustment_amount:    0,
        adjustment_note:      null,
        status:               'draft',
        remarks:              null,
      })
      results.push(payslip)
    }

    // 4. Mark run as processing done → for_approval
    await payrollService.updateRunStatus(run.id, 'for_approval')

    return results
  },
}
