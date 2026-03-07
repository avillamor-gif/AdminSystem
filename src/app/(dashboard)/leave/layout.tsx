import SecondaryNav from '@/components/layout/SecondaryNav'

const leaveNavItems = [
  { label: 'My Requests', href: '/leave/my-requests' },
  { label: 'Leave Credits', href: '/leave/credit-requests' },
]

export default function LeaveLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={leaveNavItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
