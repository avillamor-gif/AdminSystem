import SecondaryNav from '@/components/layout/SecondaryNav'

const navItems = [
  { label: 'Travel Requests',    href: '/admin/travel/travel-requests',   requiresPermission: 'admin.travel.travel_requests' },
  { label: 'Travel Booking',     href: '/admin/travel/travel-booking',    requiresPermission: 'admin.travel.travel_booking' },
  { label: 'Expense Management', href: '/admin/travel/expense-management',requiresPermission: 'admin.travel.expense_management' },
  { label: 'Travel Policies',    href: '/admin/travel/travel-policies',   requiresPermission: 'admin.travel.travel_policies' },
  { label: 'Vendor Management',  href: '/admin/travel/vendor-management', requiresPermission: 'admin.travel.vendor_management' },
  { label: 'Travel Analytics',   href: '/admin/travel/travel-analytics',  requiresPermission: 'admin.travel.travel_analytics' },
]

export default function TravelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={navItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
