'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

interface SecondaryNavProps {
  items: NavItem[]
  title?: string
}

export default function SecondaryNav({ items, title }: SecondaryNavProps) {
  const pathname = usePathname()

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
      <div className="px-6">
        {title && (
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
        )}
        <nav className="flex gap-2 overflow-x-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                  isActive
                    ? 'border-orange text-orange'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
