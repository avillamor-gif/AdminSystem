import { createClient } from '@/lib/supabase/client'

export interface Committee {
  id: string
  name: string
  description: string | null
  type: 'standing' | 'ad_hoc' | 'technical' | 'advisory'
  formed_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommitteeMember {
  id: string
  committee_id: string
  employee_id: string
  role: 'chair' | 'secretary' | 'member'
  joined_at: string | null
  // joined from employees
  employee?: {
    id: string
    employee_id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
    job_title?: { title: string } | null
    department?: { name: string } | null
  }
}

export interface CommitteeWithMembers extends Committee {
  members: CommitteeMember[]
}

export type CommitteeInsert = Omit<Committee, 'id' | 'created_at' | 'updated_at'>
export type CommitteeUpdate = Partial<CommitteeInsert>

export const committeeService = {
  async getAll(): Promise<CommitteeWithMembers[]> {
    const supabase = createClient()
    const { data: committees, error } = await supabase
      .from('committees')
      .select('*')
      .order('name')
    if (error) throw error

    if (!committees?.length) return []

    const { data: members, error: mErr } = await supabase
      .from('committee_members')
      .select('*, employee:employees(id, employee_id, first_name, last_name, email, avatar_url, job_title:job_titles(title), department:departments(name))')
      .in('committee_id', (committees as Committee[]).map((c: Committee) => c.id))
    if (mErr) throw mErr

    return (committees as Committee[]).map((c: Committee) => ({
      ...c,
      members: ((members ?? []) as any[]).filter((m: any) => m.committee_id === c.id) as CommitteeMember[],
    })) as CommitteeWithMembers[]
  },

  async getByEmployee(employeeId: string): Promise<CommitteeWithMembers[]> {
    const supabase = createClient()
    const { data: memberships, error } = await supabase
      .from('committee_members')
      .select('*, committee:committees(*)')
      .eq('employee_id', employeeId)
    if (error) throw error
    if (!memberships?.length) return []

    return (memberships as any[]).map((m: any) => ({
      ...(m.committee as Committee),
      members: [{ ...m, employee: undefined }],
    })) as CommitteeWithMembers[]
  },

  async create(data: CommitteeInsert): Promise<Committee> {
    const res = await fetch('/api/admin/committees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to create committee')
    return res.json()
  },

  async update(id: string, data: CommitteeUpdate): Promise<Committee> {
    const res = await fetch('/api/admin/committees', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update committee')
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/admin/committees?id=${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to delete committee')
  },

  async addMember(committeeId: string, employeeId: string, role: CommitteeMember['role'] = 'member', joinedAt?: string): Promise<void> {
    const res = await fetch('/api/admin/committee-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ committee_id: committeeId, employee_id: employeeId, role, joined_at: joinedAt ?? null }),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to add member')
  },

  async updateMemberRole(memberId: string, role: CommitteeMember['role']): Promise<void> {
    const res = await fetch('/api/admin/committee-members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: memberId, role }),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to update role')
  },

  async removeMember(memberId: string): Promise<void> {
    const res = await fetch(`/api/admin/committee-members?id=${memberId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to remove member')
  },
}
