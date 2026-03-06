import SecondaryNav from '@/components/layout/SecondaryNav'

const leaveManagementNavItems = [
  { label: 'All Leave Requests', href: '/admin/leave-management' },
  { label: 'Leave Credit Approvals', href: '/admin/leave-management/credit-approvals' },
]

export default function LeaveManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-m-6">
      <SecondaryNav items={leaveManagementNavItems} />
      <div className="p-6">{children}</div>
    </div>
  )
}
