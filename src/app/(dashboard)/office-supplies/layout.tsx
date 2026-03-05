import SecondaryNav from '@/components/layout/SecondaryNav'

const officeSuppliesNavItems = [
  { label: 'Supplies List', href: '/office-supplies/list' },
  { label: 'Request Supplies', href: '/office-supplies/request' },
  { label: 'My Requests', href: '/office-supplies/my-requests' },
]

export default function OfficeSuppliesLayout({
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
