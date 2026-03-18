import SecondaryNav from '@/components/layout/SecondaryNav'

const officeSuppliesNavItems = [
  { label: 'Supply Inventory', href: '/admin/office-supplies/supply-inventory', requiresPermission: 'admin.supplies.supply_inventory' },
  { label: 'Supply Requests',  href: '/admin/office-supplies/supply-requests',  requiresPermission: 'admin.supplies.supply_requests' },
  { label: 'Purchase Orders',  href: '/admin/office-supplies/purchase-orders',  requiresPermission: 'admin.supplies.purchase_orders' },
  { label: 'Stock Levels',     href: '/admin/office-supplies/stock-levels',     requiresPermission: 'admin.supplies.stock_levels' },
  { label: 'Reports',          href: '/admin/office-supplies/reports',          requiresPermission: 'admin.supplies.reports' },
  { label: 'Setup',            href: '/admin/office-supplies/setup',            requiresPermission: 'admin.supplies.setup' },
]

export default function AdminOfficeSuppliesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="-m-6">
      <SecondaryNav items={officeSuppliesNavItems} />
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
