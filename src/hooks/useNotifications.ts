import { useMemo, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useEmployees } from '@/hooks/useEmployees'
import { useCurrentUserPermissions } from '@/hooks'

export type NotificationType =
  | 'equipment_request'
  | 'leave_request'
  | 'travel_request'
  | 'contract_expiring'
  | 'publication_request'
  | 'supply_request'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  href: string
  createdAt?: string
  urgency: 'normal' | 'warning' | 'urgent'
  /** True when this notification requires an action (e.g. approve/reject) before it should be dismissed */
  actionRequired?: boolean
}

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const { data: roleInfo, isLoading: roleLoading } = useCurrentUserPermissions()
  const ADMIN_ROLES = ['Admin', 'Super Admin', 'HR Manager', 'Manager/Department Head', 'admin', 'super_admin', 'hr', 'manager']
  const isAdmin = ADMIN_ROLES.includes(roleInfo?.role_name ?? '')
  const roleLoaded = !roleLoading && roleInfo !== undefined

  // Stable per-user key — prevents cross-user cache collisions
  const currentUserId = roleInfo?.role_id ?? null  // role_id is set from user.id path in permissionService

  // Get the actual auth user id for scoping query keys
  const { data: authUserId } = useQuery({
    queryKey: ['auth_user_id'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id ?? null
    },
    staleTime: Infinity,
  })

  // Helper to create a per-user DB notification query
  function useNotifQuery(table: string) {
    return useQuery({
      queryKey: [table, 'unread', authUserId],
      queryFn: async () => {
        const supabase = createClient()
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(20)
        if (error) {
          console.warn(`[notifications] ${table} fetch error:`, error.message)
          return [] // Don't throw — return empty so other queries still render
        }
        return data ?? []
      },
      enabled: !!authUserId,
      staleTime: 0,
      refetchInterval: 30 * 1000,
      retry: false, // Don't retry on table-not-found errors
    })
  }

  // Per-user DB-driven notification queries (RLS scopes each user's own rows)
  const { data: equipmentNotifs = [] } = useNotifQuery('equipment_request_notifications')
  const { data: leaveNotifsRaw = [] }  = useNotifQuery('leave_request_notifications')
  const { data: travelNotifs = [] }    = useNotifQuery('travel_request_notifications')
  const { data: pubNotifs = [] }       = useNotifQuery('publication_request_notifications')
  const { data: supplyNotifs = [] }    = useNotifQuery('supply_request_notifications')

  // Authoritative source for new_request leave notifications:
  // Calls the server API which resets is_read=false if the leave is still pending.
  // This ensures the bell stays lit even if a notification was accidentally marked read.
  const { data: pendingLeaveNotifs = [] } = useQuery({
    queryKey: ['leave_request_notifications', 'pending_actions', authUserId],
    queryFn: async () => {
      const res = await fetch('/api/leave/pending-notifs')
      if (!res.ok) return []
      const json = await res.json()
      return json.data ?? []
    },
    enabled: !!authUserId,
    staleTime: 0,
    refetchInterval: 30 * 1000,
  })

  // Merge: pending-action notifs take precedence; add response notifs (approved/rejected) from raw query
  const leaveNotifs = useMemo(() => {
    const pendingIds = new Set((pendingLeaveNotifs as any[]).map((n: any) => n.id))
    const responseNotifs = (leaveNotifsRaw as any[]).filter(
      (n: any) => n.type !== 'new_request' && !pendingIds.has(n.id)
    )
    return [...pendingLeaveNotifs, ...responseNotifs]
  }, [pendingLeaveNotifs, leaveNotifsRaw])

  // Contracts expiring within 7 days (admin only — no DB table needed)
  const { data: employees = [] } = useEmployees()

  const expiringContracts = useMemo(() => {
    if (!isAdmin) return []
    return employees.filter((emp) => {
      const endDate = (emp as any).contract_end_date
      if (!endDate) return false
      const days = daysUntil(endDate)
      return days >= 0 && days <= 7
    })
  }, [employees, isAdmin])

  const notifications = useMemo<Notification[]>(() => {
    if (!roleLoaded) return []

    const items: Notification[] = []

    // ── Expiring contracts (admin-only, no DB table) ──────────────────
    if (isAdmin) {
      for (const emp of expiringContracts) {
        const e = emp as any
        const days = daysUntil(e.contract_end_date)
        const name = `${emp.first_name} ${emp.last_name}`
        items.push({
          id: `contract-${emp.id}`,
          type: 'contract_expiring',
          title: 'Contract Expiring Soon',
          description: `${name}'s contract expires in ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'}`}`,
          href: `/employees/${emp.id}`,
          createdAt: e.contract_end_date,
          urgency: days <= 1 ? 'urgent' : 'warning',
        })
      }
    }

    // ── Equipment notifications (DB-driven) ───────────────────────────────
    for (const notif of equipmentNotifs) {
      const isIncoming = notif.type === 'new_request'
      items.push({
        id: `equipment-notif-${notif.id}`,
        type: 'equipment_request',
        title: notif.title,
        description: notif.message,
        href: isIncoming ? '/admin/asset-management/requests' : '/equipment/my-requests',
        createdAt: notif.created_at,
        urgency: notif.type === 'rejected' ? 'warning' : 'normal',
        actionRequired: isIncoming,
      })
    }

    // ── Leave notifications (DB-driven) ───────────────────────────────
    for (const notif of leaveNotifs) {
      const isIncoming = notif.type === 'new_request'
      items.push({
        id: `leave-notif-${notif.id}`,
        type: 'leave_request',
        title: notif.title,
        description: notif.message,
        href: isIncoming ? '/leave/approvals' : '/leave/my-requests',
        createdAt: notif.created_at,
        urgency: notif.type === 'rejected' ? 'warning' : 'normal',
        actionRequired: isIncoming,
      })
    }

    // ── Travel notifications (DB-driven) ──────────────────────────────────
    for (const notif of travelNotifs) {
      const isIncoming = notif.type === 'new_request'
      items.push({
        id: `travel-notif-${notif.id}`,
        type: 'travel_request',
        title: notif.title,
        description: notif.message,
        href: isIncoming ? '/admin/travel/travel-requests' : '/my-travel-requests',
        createdAt: notif.created_at,
        urgency: notif.type === 'rejected' ? 'warning' : 'normal',
        actionRequired: isIncoming,
      })
    }

    // ── Publication notifications (DB-driven) ─────────────────────────────
    for (const notif of pubNotifs) {
      const isIncoming = notif.type === 'new_request'
      items.push({
        id: `pub-notif-${notif.id}`,
        type: 'publication_request',
        title: notif.title,
        description: notif.message,
        href: isIncoming ? '/admin/publications/publication-management' : '/publications/my-requests',
        createdAt: notif.created_at,
        urgency: notif.type === 'rejected' ? 'warning' : 'normal',
        actionRequired: isIncoming,
      })
    }

    // ── Supply notifications (DB-driven) ──────────────────────────────────
    for (const notif of supplyNotifs) {
      const isActionRequired = notif.type === 'new_request' || notif.type === 'pending_fulfillment'
      if (isActionRequired && !isAdmin) continue
      items.push({
        id: `supply-${notif.id}`,
        type: 'supply_request',
        title: notif.title,
        description: notif.message,
        href: isActionRequired ? '/admin/office-supplies/supply-requests' : '/office-supplies/my-requests',
        createdAt: notif.created_at,
        urgency: notif.type === 'rejected' ? 'warning' : 'normal',
        actionRequired: isActionRequired,
      })
    }

    return items.sort((a, b) => {
      const urgencyOrder = { urgent: 0, warning: 1, normal: 2 }
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [roleLoaded, isAdmin, expiringContracts, equipmentNotifs, leaveNotifs, travelNotifs, pubNotifs, supplyNotifs])

  // Realtime subscriptions — invalidate queries instantly when new rows arrive
  useEffect(() => {
    if (!authUserId) return
    const supabase = createClient()
    const tables = [
      'leave_request_notifications',
      'travel_request_notifications',
      'equipment_request_notifications',
      'publication_request_notifications',
      'supply_request_notifications',
    ]
    const channels = tables.map((table) =>
      supabase
        .channel(`notif:${table}:${authUserId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table, filter: `recipient_user_id=eq.${authUserId}` },
          () => {
            queryClient.invalidateQueries({ queryKey: [table, 'unread', authUserId] })
            if (table === 'leave_request_notifications') {
              queryClient.invalidateQueries({ queryKey: ['leave_request_notifications', 'pending_actions', authUserId] })
            }
          }
        )
        .subscribe()
    )
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)) }
  }, [authUserId, queryClient])

  const markNotifRead = async (table: string, rawId: string) => {
    const supabase = createClient()
    await supabase.from(table as any).update({ is_read: true }).eq('id', rawId)
    queryClient.invalidateQueries({ queryKey: [table, 'unread', authUserId] })
  }

  const markEquipmentNotifRead = (id: string) =>
    markNotifRead('equipment_request_notifications', id.replace('equipment-notif-', ''))
  const markLeaveNotifRead = (id: string) =>
    markNotifRead('leave_request_notifications', id.replace('leave-notif-', ''))
  const markTravelNotifRead = (id: string) =>
    markNotifRead('travel_request_notifications', id.replace('travel-notif-', ''))
  const markPubNotifRead = (id: string) =>
    markNotifRead('publication_request_notifications', id.replace('pub-notif-', ''))
  const markSupplyNotifRead = (id: string) =>
    markNotifRead('supply_request_notifications', id.replace('supply-', ''))

  /** Dismiss the leave `new_request` notification that belongs to a specific leave request. */
  const markLeaveNotifReadByRequestId = async (leaveRequestId: string) => {
    const match = (leaveNotifs as any[]).find(
      (n) => n.leave_request_id === leaveRequestId && n.type === 'new_request'
    )
    if (match) {
      await markNotifRead('leave_request_notifications', match.id)
      queryClient.invalidateQueries({ queryKey: ['leave_request_notifications', 'pending_actions', authUserId] })
    }
  }

  return {
    notifications, timeAgo, isAdmin,
    markEquipmentNotifRead,
    markLeaveNotifRead,
    markLeaveNotifReadByRequestId,
    markTravelNotifRead,
    markPubNotifRead,
    markSupplyNotifRead,
  }
}
