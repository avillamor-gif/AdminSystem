'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Settings,
  Plane,
  BookOpen,
  Monitor,
  Package,
  UserCircle,
  Building2,
  MoreHorizontal,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useCurrentUserPermissions } from '@/hooks'
import { useNotifications } from '@/hooks/useNotifications'

// Primary tabs always shown in the bottom bar (max 5 including More)
const primaryItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Leave', href: '/leave/my-requests', icon: Calendar, activeBase: '/leave' },
  { name: 'Supplies', href: '/office-supplies', icon: Package, activeBase: '/office-supplies' },
  { name: 'My Info', href: '/my-info', icon: UserCircle },
]

// All items shown in the "More" sheet
const allItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Admin', href: '/admin', icon: Settings, requiresPermission: 'admin.manage' },
  { name: 'Leave', href: '/leave/my-requests', icon: Calendar, activeBase: '/leave' },
  { name: 'Attendance', href: '/attendance-tracker', icon: Clock },
  { name: 'Travel', href: '/travel/travel-request', icon: Plane, activeBase: '/travel' },
  { name: 'Publications', href: '/publications/library', icon: BookOpen, activeBase: '/publications' },
  { name: 'Equipment', href: '/equipment/browse', icon: Monitor, activeBase: '/equipment' },
  { name: 'Office Supplies', href: '/office-supplies', icon: Package },
  { name: 'My Info', href: '/my-info', icon: UserCircle },
  { name: 'Directory', href: '/directory', icon: Building2 },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)
  const { data: roleInfo, isLoading } = useCurrentUserPermissions()
  const { notifications } = useNotifications()
  const unreadCount = notifications.length

  const visibleAllItems = allItems.filter(item => {
    if (!item.requiresPermission) return true
    if (isLoading) return false
    return roleInfo?.permissions.includes(item.requiresPermission)
  })

  function isActive(item: { href: string; activeBase?: string }) {
    return item.href === '/'
      ? pathname === '/'
      : pathname.startsWith(item.activeBase ?? item.href)
  }

  const isMoreActive = !primaryItems.some(i => isActive(i)) && pathname !== '/'

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex items-stretch h-16">
          {primaryItems.map(item => {
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative',
                  active ? 'text-orange-600' : 'text-gray-500'
                )}
                onClick={() => setShowMore(false)}
              >
                <item.icon className={cn('w-5 h-5', active ? 'text-orange-600' : 'text-gray-500')} />
                <span>{item.name}</span>
                {active && <span className="absolute top-1.5 w-1 h-1 rounded-full bg-orange-500" />}
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(v => !v)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative',
              (showMore || isMoreActive) ? 'text-orange-600' : 'text-gray-500'
            )}
          >
            {showMore ? (
              <X className="w-5 h-5" />
            ) : (
              <div className="relative">
                <MoreHorizontal className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            )}
            <span>{showMore ? 'Close' : 'More'}</span>
          </button>
        </div>
      </nav>

      {/* More sheet — slides up from bottom */}
      {showMore && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/30"
            onClick={() => setShowMore(false)}
          />
          {/* Sheet */}
          <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-xl border-t border-gray-200 pb-2">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">All Sections</span>
              <button onClick={() => setShowMore(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-y-1 px-3 pt-3 pb-1">
              {visibleAllItems.map(item => {
                const active = isActive(item)
                return (
                  <Link
                    key={item.name + item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[11px] font-medium transition-colors',
                      active
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      active ? 'bg-orange-100' : 'bg-gray-100'
                    )}>
                      <item.icon className={cn('w-5 h-5', active ? 'text-orange-600' : 'text-gray-500')} />
                    </div>
                    <span className="text-center leading-tight">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}
