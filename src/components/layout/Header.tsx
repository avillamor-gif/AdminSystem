'use client'

import { Bell, Smartphone, ChevronDown, HelpCircle, LogOut, Package, Calendar, AlertTriangle, Clock, BookOpen, ShoppingCart, Plane, Award } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { useState, useMemo, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useNotifications, type NotificationType } from '@/hooks/useNotifications'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface HeaderProps {
  user: {
    firstName: string
    lastName: string
    email: string
    avatarUrl?: string | null
  } | null
}

export function Header({ user }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  const { notifications, timeAgo, markEquipmentNotifRead, markLeaveNotifRead, markLeaveCreditNotifRead, markTravelNotifRead, markPubNotifRead, markSupplyNotifRead } = useNotifications()
  const totalCount = notifications.length
  const { permission, isSubscribed, isLoading: pushLoading, isSupported: pushSupported, subscribe, unsubscribe } = usePushNotifications()

  // Update the PWA app icon badge whenever the unread count changes
  useEffect(() => {
    if ('setAppBadge' in navigator) {
      if (totalCount > 0) {
        (navigator as any).setAppBadge(totalCount).catch(() => {})
      } else {
        (navigator as any).clearAppBadge().catch(() => {})
      }
    }
  }, [totalCount])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showUserMenu, showNotifications])

  // Get page title based on current route
  const pageTitle = useMemo(() => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/admin/leave-absence-management')) return 'Leave & Absence Management'
    if (pathname.startsWith('/admin/user-management')) return 'User Management'
    if (pathname.startsWith('/admin/employee-profiles')) return 'Employee Profiles'
    if (pathname.startsWith('/admin/job-titles')) return 'Job Titles'
    if (pathname.startsWith('/admin/job-categories')) return 'Job Categories'
    if (pathname.startsWith('/admin/job-descriptions')) return 'Job Descriptions'
    if (pathname.startsWith('/admin/department-hierarchy')) return 'Department Hierarchy'
    if (pathname.startsWith('/admin/employment-types')) return 'Employment Types'
    if (pathname.startsWith('/admin/locations')) return 'Locations'
    if (pathname.startsWith('/admin/data-management')) return 'Data Management'
    if (pathname.startsWith('/admin/pim-configuration')) return 'PIM Configuration'
    if (pathname.startsWith('/admin/security-policies')) return 'Security Policies'
    if (pathname.startsWith('/admin/publications')) return 'Publications'
    if (pathname.startsWith('/admin/recruitment')) return 'Recruitment'
    if (pathname.startsWith('/admin/travel')) return 'Travel Management'
    if (pathname.startsWith('/admin/resources-assets/office-supplies')) return 'Office Supplies'
    if (pathname.startsWith('/admin/asset-management/assets')) return 'Assets'
    if (pathname.startsWith('/admin/asset-management/assignments')) return 'Asset Assignments'
    if (pathname.startsWith('/admin/asset-management/maintenance')) return 'Asset Maintenance'
    if (pathname.startsWith('/admin/asset-management/requests')) return 'Asset Requests'
    if (pathname.startsWith('/admin/asset-management/setup')) return 'Asset Setup'
    if (pathname.startsWith('/admin/asset-management/reports')) return 'Asset Reports'
    if (pathname.startsWith('/admin/asset-management')) return 'Asset Management'
    if (pathname.startsWith('/admin')) return 'Admin'
    if (pathname.startsWith('/employees')) return 'PIM'
    if (pathname.startsWith('/leave')) return 'Leave'
    if (pathname.startsWith('/attendance-tracker')) return 'Attendance Tracker'
    if (pathname.startsWith('/travel')) return 'Travel'
    if (pathname.startsWith('/publications')) return 'Publications'
    if (pathname.startsWith('/office-supplies')) return 'Office Supplies'
    if (pathname.startsWith('/performance')) return 'Performance'
    if (pathname.startsWith('/my-info')) return 'My Info'
    if (pathname.startsWith('/directory')) return 'Directory'
    return 'Dashboard'
  }, [pathname])

  return (
    <header className="sticky top-0 h-16 bg-orange border-b border-orange-dark flex items-center justify-between px-6 shadow-sm z-40">
      {/* Left side - Breadcrumb area */}
      <div className="flex items-center gap-2">
        <nav className="text-sm">
          <span className="text-white font-medium">{pageTitle}</span>
        </nav>
      </div>

      {/* Right side - User actions */}
      <div className="flex items-center gap-2">
        {/* Push Notifications Toggle — always visible so user can subscribe from any device */}
        <button
          onClick={() => {
            if (isSubscribed) unsubscribe(); else subscribe()
          }}
          disabled={false}
          title={isSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
          className={`p-2 rounded-full transition-colors hover:bg-white/10 ${isSubscribed ? 'text-white' : 'text-white/40'}`}
        >
          <Smartphone className="w-5 h-5" />
        </button>

        {/* Test Push (visible to all, sends to current user's subscribed devices) */}
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/push/test', { method: 'POST' })
              const json = await res.json()
              if (res.ok && json.ok) {
                alert('✅ Push sent to ' + json.subscriptionsFound + ' device(s)! Check your phone.')
              } else {
                alert('⚠️ ' + (json.error ?? JSON.stringify(json)) + (json.userId ? '\n\nYour user ID: ' + json.userId : ''))
              }
            } catch (e) {
              alert('❌ Error: ' + String(e))
            }
          }}
          title="Send test push notification to my devices"
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors text-xs font-bold"
        >
          TEST
        </button>

        {/* Help */}
        <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {totalCount > 0 && (
              <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold bg-red-500 text-white rounded-full leading-none">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {totalCount > 0 && (
                  <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {totalCount} need action
                  </span>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                {totalCount === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">You're all caught up!</p>
                    <p className="text-xs text-gray-300 mt-1">No pending actions right now</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const config: Record<NotificationType, { icon: React.ElementType; iconBg: string; iconColor: string; dot: string }> = {
                      equipment_request: {
                        icon: Package,
                        iconBg: 'bg-orange-100 group-hover:bg-orange-200',
                        iconColor: 'text-orange-600',
                        dot: 'bg-orange-500',
                      },
                      leave_request: {
                        icon: Calendar,
                        iconBg: 'bg-blue-100 group-hover:bg-blue-200',
                        iconColor: 'text-blue-600',
                        dot: 'bg-blue-500',
                      },
                      leave_credit_request: {
                        icon: Award,
                        iconBg: 'bg-purple-100 group-hover:bg-purple-200',
                        iconColor: 'text-purple-600',
                        dot: notif.urgency === 'warning' ? 'bg-yellow-500' : 'bg-purple-500',
                      },
                      travel_request: {
                        icon: Plane,
                        iconBg: 'bg-indigo-100 group-hover:bg-indigo-200',
                        iconColor: 'text-indigo-600',
                        dot: notif.urgency === 'warning' ? 'bg-yellow-500' : 'bg-indigo-500',
                      },
                      contract_expiring: {
                        icon: notif.urgency === 'urgent' ? AlertTriangle : Clock,
                        iconBg: notif.urgency === 'urgent'
                          ? 'bg-red-100 group-hover:bg-red-200'
                          : 'bg-yellow-100 group-hover:bg-yellow-200',
                        iconColor: notif.urgency === 'urgent' ? 'text-red-600' : 'text-yellow-600',
                        dot: notif.urgency === 'urgent' ? 'bg-red-500' : 'bg-yellow-500',
                      },
                      publication_request: {
                        icon: BookOpen,
                        iconBg: notif.urgency === 'urgent' ? 'bg-red-100 group-hover:bg-red-200' : 'bg-purple-100 group-hover:bg-purple-200',
                        iconColor: notif.urgency === 'urgent' ? 'text-red-600' : 'text-purple-600',
                        dot: notif.urgency === 'urgent' ? 'bg-red-500' : 'bg-purple-500',
                      },
                      supply_request: {
                        icon: ShoppingCart,
                        iconBg: notif.urgency === 'warning' ? 'bg-yellow-100 group-hover:bg-yellow-200' : 'bg-green-100 group-hover:bg-green-200',
                        iconColor: notif.urgency === 'warning' ? 'text-yellow-600' : 'text-green-600',
                        dot: notif.urgency === 'warning' ? 'bg-yellow-500' : 'bg-green-500',
                      },
                    }
                    const { icon: Icon, iconBg, iconColor, dot } = config[notif.type]
                    return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          // Don't mark as read if action is required (e.g. leave approval pending)
                          // It will be dismissed automatically after approve/reject
                          if (!notif.actionRequired) {
                            if (notif.type === 'equipment_request') markEquipmentNotifRead(notif.id)
                            if (notif.type === 'leave_request') markLeaveNotifRead(notif.id)
                            if (notif.type === 'leave_credit_request') markLeaveCreditNotifRead(notif.id)
                            if (notif.type === 'travel_request') markTravelNotifRead(notif.id)
                            if (notif.type === 'publication_request') markPubNotifRead(notif.id)
                            if (notif.type === 'supply_request') markSupplyNotifRead(notif.id)
                          }
                          router.push(notif.href)
                          setShowNotifications(false)
                        }}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 transition-colors ${iconBg}`}>
                          <Icon className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.description}</p>
                          {notif.createdAt && (
                            <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                          )}
                        </div>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${dot}`} />
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        {user && (
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <Avatar
                src={user.avatarUrl}
                firstName={user.firstName}
                lastName={user.lastName}
                size="sm"
              />
              <ChevronDown className="w-4 h-4 text-white/80" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
