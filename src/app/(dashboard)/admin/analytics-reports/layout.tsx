import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Standard Reports',        href: '/admin/analytics-reports/standard-reports',        requiresPermission: 'admin.analytics.standard_reports' },
  { label: 'Custom Reports',          href: '/admin/analytics-reports/custom-reports',           requiresPermission: 'admin.analytics.custom_reports' },
  { label: 'Dashboard Configuration', href: '/admin/analytics-reports/dashboard-configuration',  requiresPermission: 'admin.analytics.dashboard_configuration' },
  { label: 'Data Analytics',          href: '/admin/analytics-reports/data-analytics',            requiresPermission: 'admin.analytics.data_analytics' },
  { label: 'KPI Metrics',             href: '/admin/analytics-reports/kpi-metrics',               requiresPermission: 'admin.analytics.kpi_metrics' },
  { label: 'Export Settings',         href: '/admin/analytics-reports/export-settings',           requiresPermission: 'admin.analytics.export_settings' },
]

export default function AnalyticsReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
