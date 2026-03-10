import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Standard Reports',       href: '/admin/analytics-reports/standard-reports' },
  { label: 'Custom Reports',         href: '/admin/analytics-reports/custom-reports' },
  { label: 'Dashboard Configuration',href: '/admin/analytics-reports/dashboard-configuration' },
  { label: 'Data Analytics',         href: '/admin/analytics-reports/data-analytics' },
  { label: 'KPI Metrics',            href: '/admin/analytics-reports/kpi-metrics' },
  { label: 'Export Settings',        href: '/admin/analytics-reports/export-settings' },
]

export default function AnalyticsReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
