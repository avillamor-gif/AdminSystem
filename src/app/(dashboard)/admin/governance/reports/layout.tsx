'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Mail } from 'lucide-react'

const tabs = [
  { href: '/admin/governance/reports/membership-analytics', label: 'Membership Analytics', icon: Users },
  { href: '/admin/governance/reports/email-report',         label: 'Email Report',          icon: Mail  },
]

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div>
      {/* Inner tab bar — same pattern as Attendance Reports */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map(tab => {
            const isActive = pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href}
                className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-orange text-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>
      {children}
    </div>
  )
}
