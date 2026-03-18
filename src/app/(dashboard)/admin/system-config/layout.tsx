import SecondaryNav from '@/components/layout/SecondaryNav'

const systemConfigNavItems = [
  { label: 'General Settings',        href: '/admin/system-config/general-settings',        requiresPermission: 'admin.system_config.general_settings' },
  { label: 'Email Configuration',     href: '/admin/system-config/email-configuration',    requiresPermission: 'admin.system_config.email_configuration' },
  { label: 'Workflow Settings',       href: '/admin/system-config/workflow-settings',       requiresPermission: 'admin.system_config.workflow_settings' },
  { label: 'API Settings',            href: '/admin/system-config/api-settings',           requiresPermission: 'admin.system_config.api_settings' },
  { label: 'Backup & Recovery',       href: '/admin/system-config/backup-recovery',         requiresPermission: 'admin.system_config.backup_recovery' },
  { label: 'Integration Management',  href: '/admin/system-config/integration-management', requiresPermission: 'admin.system_config.integration_management' },
  { label: 'System Maintenance',      href: '/admin/system-config/system-maintenance',      requiresPermission: 'admin.system_config.system_maintenance' },
]

export default function SystemConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={systemConfigNavItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
