import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_FIELDS = [
  'employee_id', 'first_name', 'last_name', 'email', 'phone',
  'date_of_birth', 'hire_date', 'department_id', 'job_title_id',
  'manager_id', 'location_id', 'work_location_type', 'remote_location',
  'status', 'avatar_url', 'address', 'city', 'country',
  'employment_type_id', 'job_specification_id',
  'middle_name', 'suffix', 'sex', 'marital_status', 'nationality',
  'national_id', 'voters_id', 'pagibig_number', 'philhealth_number', 'sss_number', 'tin_number',
  'work_phone', 'mobile_phone', 'home_phone', 'work_email', 'personal_email', 'state', 'zip_code',
  'contract_start_date', 'contract_end_date',
  'salary_structure_id',
  'signature_url',
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the caller is authenticated
    const supabaseServer = createClient()
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id } = params

    // Filter to allowed fields only
    const filtered: Record<string, unknown> = {}
    for (const key of Object.keys(body)) {
      if (ALLOWED_FIELDS.includes(key)) {
        filtered[key] = body[key]
      }
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('employees')
      .update({ ...filtered, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('[api/employees/[id]] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[api/employees/[id]] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
