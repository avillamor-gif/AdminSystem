'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Settings,
  Building2,
  UserCircle,
  Users,
  Briefcase,
  FileText,
  Search,
  ChevronRight,
  Menu,
  X,
  Plane,
  BookOpen,
  Monitor,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useCurrentUserPermissions } from '@/hooks'
import { useSidebar } from '@/contexts/SidebarContext'

interface NavigationItem {
  name: string
  href: string
  icon: any
  badge?: string
  requiresPermission?: string
  requiresAdmin?: boolean
  activeBase?: string
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Admin', href: '/admin', icon: Settings, requiresPermission: 'admin.manage' },
  { name: 'Leave', href: '/leave/my-requests', icon: Calendar, requiresPermission: 'leave.view', activeBase: '/leave' },
  { name: 'Attendance Tracker', href: '/attendance-tracker', icon: Clock },
  { name: 'Travel', href: '/travel/travel-request', icon: Plane, activeBase: '/travel' },
  { name: 'Publications', href: '/publications/library', icon: BookOpen, activeBase: '/publications' },
  { name: 'Office Equipment', href: '/equipment/browse', icon: Monitor, activeBase: '/equipment' },
  { name: 'Office Supplies', href: '/office-supplies', icon: Package },

  { name: 'My Info', href: '/my-info', icon: UserCircle, badge: 'Personal Info' },
  { name: 'Performance', href: '/performance', icon: FileText, requiresPermission: 'performance.view' },
  { name: 'Directory', href: '/directory', icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const { data: roleInfo, isLoading } = useCurrentUserPermissions()

  // Filter navigation items based on user permissions
  const navigation = navigationItems.filter(item => {
    if (!item.requiresPermission && !item.requiresAdmin) return true
    if (isLoading) return false
    if (item.requiresPermission && roleInfo) return roleInfo.permissions.includes(item.requiresPermission)
    return false
  })

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-30 transition-all duration-300",
      isCollapsed ? "w-[70px]" : "w-[260px]"
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center px-5 border-b border-gray-200 mb-4">
        {isCollapsed ? (
          <img src="/ibon-icon.png" alt="II Admin System" className="h-16 w-16 object-contain" />
        ) : (
          <img src="/ibon-logo.png" alt="II Admin System" className="h-12 w-auto object-contain" />
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 text-[#1a1e29] placeholder-gray-400 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.activeBase ?? item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-orange-50 text-orange border-l-4 border-orange ml-[-4px] pl-[calc(0.75rem+4px)]'
                  : 'text-[#1a1e29] hover:bg-gray-50',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-orange" : "text-[#1a1e29]"
              )} />
              {!isCollapsed && (
                <>
                  <span>{item.name}</span>
                  {item.badge && (
                    <ChevronRight className="w-4 h-4 ml-auto text-gray-500" />
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#1a1e29] hover:bg-gray-50 w-full transition-colors",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5 flex-shrink-0 text-[#1a1e29]" /> : <ChevronRight className="w-5 h-5 flex-shrink-0 text-[#1a1e29] rotate-180" />}
          {!isCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
