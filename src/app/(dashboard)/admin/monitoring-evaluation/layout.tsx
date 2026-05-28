'use client'

import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Dashboard', href: '/admin/monitoring-evaluation/dashboard' },
  { label: 'Programs', href: '/admin/monitoring-evaluation/programs' },
  { label: 'Projects', href: '/admin/monitoring-evaluation/projects' },
  { label: 'Indicators', href: '/admin/monitoring-evaluation/indicators' },
  { label: 'Data Entry', href: '/admin/monitoring-evaluation/data-entry' },
  { label: 'Reports', href: '/admin/monitoring-evaluation/reports' },
  { label: 'Citations', href: '/admin/monitoring-evaluation/citations' },
]

export default function MonitoringEvaluationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
