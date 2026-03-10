import SecondaryNav from '@/components/layout/SecondaryNav'

const systemConfigNavItems = [
  { label: 'General Settings',       href: '/admin/system-config/general-settings' },
  { label: 'Email Configuration',    href: '/admin/system-config/email-configuration' },
  { label: 'Workflow Settings',      href: '/admin/system-config/workflow-settings' },
  { label: 'API Settings',           href: '/admin/system-config/api-settings' },
  { label: 'Backup & Recovery',      href: '/admin/system-config/backup-recovery' },
  { label: 'Integration Management', href: '/admin/system-config/integration-management' },
  { label: 'System Maintenance',     href: '/admin/system-config/system-maintenance' },
]

export default function SystemConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={systemConfigNavItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
