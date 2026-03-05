import SecondaryNav from '@/components/layout/SecondaryNav'

const assetNavItems = [
  { label: 'Assets', href: '/admin/asset-management/assets' },
  { label: 'Assignments', href: '/admin/asset-management/assignments' },
  { label: 'Maintenance', href: '/admin/asset-management/maintenance' },
  { label: 'Requests', href: '/admin/asset-management/requests' },
  { label: 'Setup', href: '/admin/asset-management/setup' },
  { label: 'Reports', href: '/admin/asset-management/reports' },
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
