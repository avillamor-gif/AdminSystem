import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Travel Requests',      href: '/admin/travel/travel-requests' },
  { label: 'Travel Booking',       href: '/admin/travel/travel-booking' },
  { label: 'Expense Management',   href: '/admin/travel/expense-management' },
  { label: 'Travel Policies',      href: '/admin/travel/travel-policies' },
  { label: 'Vendor Management',    href: '/admin/travel/vendor-management' },
  { label: 'Travel Analytics',     href: '/admin/travel/travel-analytics' },
]

export default function TravelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
