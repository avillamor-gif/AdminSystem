import SecondaryNav from '@/components/layout/SecondaryNav'

const assetNavItems = [
  { label: 'Assets',       href: '/admin/asset-management/assets',       requiresPermission: 'admin.assets.assets' },
  { label: 'Assignments',  href: '/admin/asset-management/assignments',  requiresPermission: 'admin.assets.assignments' },
  { label: 'Maintenance',  href: '/admin/asset-management/maintenance',  requiresPermission: 'admin.assets.maintenance' },
  { label: 'Requests',     href: '/admin/asset-management/requests',     requiresPermission: 'admin.assets.requests' },
  { label: 'Setup',        href: '/admin/asset-management/setup',        requiresPermission: 'admin.assets.setup' },
  { label: 'Reports',      href: '/admin/asset-management/reports',      requiresPermission: 'admin.assets.reports' },
]

export default function AssetManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-m-6">
      <SecondaryNav items={assetNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
