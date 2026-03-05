import SecondaryNav from '@/components/layout/SecondaryNav'

const officeSuppliesNavItems = [
  { label: 'Supply Inventory', href: '/admin/office-supplies/supply-inventory' },
  { label: 'Supply Requests', href: '/admin/office-supplies/supply-requests' },
  { label: 'Vendor Management', href: '/admin/office-supplies/vendor-management' },
  { label: 'Purchase Orders', href: '/admin/office-supplies/purchase-orders' },
  { label: 'Stock Levels', href: '/admin/office-supplies/stock-levels' },
  { label: 'Supply Categories', href: '/admin/office-supplies/supply-categories' },
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
